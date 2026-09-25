'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/app/store/useCartStore';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/app/providers';
import { ChevronLeft, Loader2, MessageCircle, ShoppingBag, CreditCard } from 'lucide-react';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useTenantSettings } from '@/lib/useTenantSettings';

const TAX_RATE = 0.13;

function money(amount: number) {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(amount);
}

export default function CheckoutPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, profile } = useAuth();
  const cart = useCartStore((s) => s.cart);
  const clearCart = useCartStore((s) => s.clearCart);
  const { settings: tenantSettings } = useTenantSettings();
  const useOnvoPay = tenantSettings.payment_config?.provider === 'onvopay';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
    }
  }, [profile]);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  if (profile?.status === 'banned') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-cream-50 px-4">
        <div className="w-28 h-28 bg-red-100 rounded-full flex items-center justify-center mb-8">
          <ShoppingBag size={40} className="text-red-500" />
        </div>
        <h1 className="font-serif text-3xl text-ink-900 mb-3 text-center">No podés completar la compra</h1>
        <p className="text-ink-500 mb-8 max-w-md text-center">
          Tu cuenta tiene una restricción activa. Si creés que es un error, escribinos por soporte.
        </p>
        <Link href="/profile/soporte" className="bg-ink-900 text-cream-50 px-8 py-4 rounded-2xl font-bold hover:bg-gold-600 transition-all">
          Contactar soporte
        </Link>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-cream-50 px-4">
        <div className="w-28 h-28 bg-cream-200 rounded-full flex items-center justify-center mb-8">
          <ShoppingBag size={40} className="text-ink-400" />
        </div>
        <h1 className="font-serif text-3xl text-ink-900 mb-3 text-center">No hay nada que pagar</h1>
        <p className="text-ink-500 mb-8 max-w-md text-center">Tu carrito está vacío.</p>
        <Link href="/shop" className="bg-ink-900 text-cream-50 px-8 py-4 rounded-2xl font-bold hover:bg-gold-600 transition-all">
          Ir al catálogo
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      // orders.tenant_id es NOT NULL y este checkout corre en el cliente
      // (sin el header x-tenant-slug que arma el proxy para Server
      // Components), así que resolvemos el tenant acá por slug, igual
      // que en WhatsAppWidget y /profile/soporte.
      const tenantSlug = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || 'cirelia';
      const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).maybeSingle();
      if (!tenant) throw new Error('No se pudo identificar la tienda. Recargá la página e intentá de nuevo.');

      // El pedido se crea igual sea cual sea el método de pago (como
      // "pending"): con ONVOPay, se marca "paid" solo automáticamente
      // cuando la pasarela confirma el cobro (webhook); sin ONVOPay, el
      // equipo lo confirma manualmente al recibir el pago por SINPE.
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          tenant_id: tenant.id,
          user_id: user?.id ?? null,
          status: 'pending',
          subtotal,
          tax_amount: tax,
          tax_percentage: TAX_RATE * 100,
          total_amount: total,
          payment_method: useOnvoPay ? 'onvopay' : 'sinpe_whatsapp',
          shipping_address: { nombre: name, telefono: phone, correo: email, direccion: address },
          order_notes: notes || null,
        })
        .select('id, invoice_number')
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price,
        original_price: item.price,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // Descontamos stock (best-effort: si una línea falla no bloqueamos
      // el pedido ya creado, solo lo registramos).
      await Promise.all(
        cart.map((item) =>
          supabase.rpc('decrement_stock', { p_product_id: item.id, p_quantity: item.quantity }).then(({ error }) => {
            if (error) console.error('No se pudo descontar stock de', item.id, error);
          })
        )
      );

      // Con ONVOPay: intentamos armar el checkout hospedado y redirigir
      // ahí a pagar. Si algo falla (todavía no configurado, error de
      // red, etc.) no dejamos al comprador sin poder pagar — caemos de
      // vuelta al flujo manual de siempre, con el pedido ya guardado.
      if (useOnvoPay && tenantSettings.tenantId) {
        try {
          const res = await fetch('/api/payments/onvopay/create-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: order.id, tenantId: tenantSettings.tenantId }),
          });
          const data = await res.json();
          if (res.ok && data.url) {
            clearCart();
            window.location.href = data.url;
            return;
          }
          console.error('ONVOPay create-session:', data.error);
        } catch (err) {
          console.error('No se pudo iniciar el pago con ONVOPay:', err);
        }
      }

      clearCart();
      router.push(`/checkout/confirmacion/${order.id}`);
    } catch (err: any) {
      console.error('Error creando el pedido:', err);
      setErrorMsg(err.message || 'No se pudo procesar el pedido. Intenta de nuevo.');
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-cream-50 min-h-screen pb-24 pt-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/cart" className="group flex items-center gap-2 text-ink-500 hover:text-ink-900 mb-6 text-sm font-bold w-fit">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Volver al carrito
        </Link>

        <h1 className="font-serif text-3xl sm:text-4xl text-ink-900 mb-8">Finalizar compra</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
            {!user && (
              <div className="bg-gold-50 border border-gold-200 rounded-2xl p-4 text-xs text-gold-800">
                Estás comprando como invitado.{' '}
                <Link href={`/login?next=/checkout`} className="font-bold underline">
                  Iniciá sesión
                </Link>{' '}
                si preferís guardar tus datos para la próxima.
              </div>
            )}

            <div className="bg-cream-100 rounded-3xl p-6 sm:p-8 border border-ink-100 space-y-4">
              <h2 className="font-serif text-lg text-ink-900 mb-2">Datos de contacto y envío</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Nombre completo</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-12 px-4 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500 focus:ring-4 focus:ring-gold-500/10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Teléfono</label>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+506 8888 8888"
                    className="w-full h-12 px-4 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500 focus:ring-4 focus:ring-gold-500/10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Correo</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500 focus:ring-4 focus:ring-gold-500/10"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Dirección de envío</label>
                <textarea
                  required
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Provincia, cantón, distrito, señas exactas..."
                  className="w-full px-4 py-3 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500 focus:ring-4 focus:ring-gold-500/10 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Notas (opcional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instrucciones especiales para la entrega..."
                  className="w-full px-4 py-3 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500 focus:ring-4 focus:ring-gold-500/10 resize-none"
                />
              </div>
            </div>

            <div className="bg-cream-100 rounded-3xl p-6 sm:p-8 border border-ink-100">
              <h2 className="font-serif text-lg text-ink-900 mb-2">Método de pago</h2>
              {useOnvoPay ? (
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <CreditCard className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Al confirmar, te llevamos a pagar de forma segura con tarjeta o SINPE Móvil. Tu pedido queda
                    registrado ya mismo y se confirma automáticamente en cuanto se completa el pago.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Al confirmar, creamos tu pedido y te abrimos WhatsApp con el resumen para coordinar el pago por
                    SINPE Móvil. Tu pedido queda registrado ya mismo.
                  </p>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-4 rounded-xl">{errorMsg}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-14 bg-ink-900 text-cream-50 rounded-2xl font-bold hover:bg-gold-600 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Procesando...
                </>
              ) : (
                <>
                  {useOnvoPay ? (
                    <>
                      <CreditCard className="w-5 h-5" /> Pagar ahora
                    </>
                  ) : (
                    <>
                      <WhatsAppIcon style={{ fontSize: 18 }} /> Confirmar pedido
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          <div className="lg:col-span-5">
            <div className="bg-cream-100 rounded-3xl p-6 sm:p-8 border border-ink-100 sticky top-24">
              <h2 className="font-serif text-lg text-ink-900 mb-5">Tu pedido</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-ink-600 truncate pr-2">
                      {item.name} <span className="text-ink-400">×{item.quantity}</span>
                    </span>
                    <span className="font-semibold text-ink-900 shrink-0">{money(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-5 border-t border-ink-200 space-y-2">
                <div className="flex justify-between text-sm text-ink-600">
                  <span>Subtotal</span>
                  <span>{money(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-ink-600">
                  <span>IVA (13%)</span>
                  <span>{money(tax)}</span>
                </div>
                <div className="flex justify-between items-end pt-3">
                  <span className="text-sm font-medium text-ink-500">Total</span>
                  <span className="text-2xl font-bold text-ink-900">{money(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
