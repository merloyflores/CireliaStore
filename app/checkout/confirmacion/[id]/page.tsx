'use client';

import { useEffect, useState, use as usePromise } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle2, Loader2, Bike } from 'lucide-react';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import DeliveryMap from '@/components/DeliveryMap';
import { useTenantSettings } from '@/lib/useTenantSettings';

const DELIVERY_STATUS_LABELS: Record<string, string> = {
  assigned: 'Repartidor asignado',
  accepted: 'Tu pedido va a salir pronto',
  en_route: 'Tu repartidor está en camino',
  delivered: 'Entregado',
  failed: 'No se pudo entregar',
};

function money(amount: number) {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(amount);
}

export default function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const supabase = createClient();
  const { settings } = useTenantSettings();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState<{ status: string; lat: number | null; lng: number | null } | null>(null);

  useEffect(() => {
    async function load() {
      const [{ data: orderData }, { data: itemsData }] = await Promise.all([
        supabase.from('orders').select('*').eq('id', id).maybeSingle(),
        supabase.from('order_items').select('*, products(name)').eq('order_id', id),
      ]);
      setOrder(orderData);
      setItems(itemsData ?? []);
      setLoading(false);

      // El tracking en vivo solo existe para clientes con cuenta (la
      // política RLS de delivery_tracking_events exige sesión); si el
      // pedido fue como invitado, simplemente no habrá nada que mostrar.
      const { data: assignmentData } = await supabase
        .from('delivery_assignments')
        .select('id, status')
        .eq('order_id', id)
        .maybeSingle();

      if (assignmentData) {
        const { data: lastEvent } = await supabase
          .from('delivery_tracking_events')
          .select('lat, lng, status')
          .eq('delivery_assignment_id', assignmentData.id)
          .not('lat', 'is', null)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (assignmentData.status && assignmentData.status !== 'unassigned') {
          setTracking({
            status: assignmentData.status,
            lat: lastEvent?.lat != null ? Number(lastEvent.lat) : null,
            lng: lastEvent?.lng != null ? Number(lastEvent.lng) : null,
          });
        }
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-cream-50">
        <Loader2 className="w-6 h-6 animate-spin text-ink-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-cream-50 px-4 text-center">
        <h1 className="font-serif text-2xl text-ink-900 mb-2">No encontramos ese pedido</h1>
        <Link href="/shop" className="text-gold-700 font-bold hover:underline">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  const address = order.shipping_address || {};

  const whatsappHref = () => {
    const lines = items.map(
      (it) => `▪ ${it.products?.name ?? 'Producto'} (x${it.quantity}) - ${money(it.price_at_purchase * it.quantity)}`
    );
    const msg =
      `¡Hola! Quiero coordinar el pago de mi pedido #${order.invoice_number}.%0A%0A` +
      `*Productos:*%0A${lines.join('%0A')}%0A%0A` +
      `*Total: ${money(order.total_amount)}*%0A` +
      `*Nombre:* ${address.nombre ?? ''}%0A*Dirección:* ${address.direccion ?? ''}`;
    return `https://wa.me/${settings.whatsapp_number}?text=${msg}`;
  };

  return (
    <div className="bg-cream-50 min-h-screen pb-24 pt-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink-900 mb-2">¡Pedido recibido!</h1>
        <p className="text-ink-500 mb-10">
          Pedido <span className="font-bold text-ink-900">#{order.invoice_number}</span> — coordiná el pago por
          WhatsApp para confirmarlo.
        </p>

        {tracking && (
          <div className="bg-cream-100 rounded-3xl border border-ink-100 p-6 sm:p-8 text-left mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Bike size={18} className="text-gold-600" />
              <p className="font-semibold text-ink-900 text-sm">{DELIVERY_STATUS_LABELS[tracking.status] ?? tracking.status}</p>
            </div>
            {tracking.lat != null && tracking.lng != null ? (
              <DeliveryMap lat={tracking.lat} lng={tracking.lng} label="Tu repartidor" />
            ) : (
              <p className="text-xs text-ink-400">Todavía no hay ubicación en vivo de tu repartidor.</p>
            )}
          </div>
        )}

        <div className="bg-cream-100 rounded-3xl border border-ink-100 p-6 sm:p-8 text-left mb-8">
          <div className="space-y-3 pb-5 border-b border-ink-200">
            {items.map((it) => (
              <div key={it.id} className="flex justify-between text-sm">
                <span className="text-ink-600">
                  {it.products?.name ?? 'Producto'} <span className="text-ink-400">×{it.quantity}</span>
                </span>
                <span className="font-semibold text-ink-900">{money(it.price_at_purchase * it.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-end pt-5">
            <span className="text-sm font-medium text-ink-500">Total</span>
            <span className="text-2xl font-bold text-ink-900">{money(order.total_amount)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={whatsappHref()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white h-14 rounded-2xl font-bold hover:bg-emerald-600 transition-all"
          >
            <WhatsAppIcon style={{ fontSize: 20 }} /> Coordinar pago por WhatsApp
          </a>
          <Link
            href="/shop"
            className="flex-1 flex items-center justify-center bg-cream-50 border border-ink-200 text-ink-900 h-14 rounded-2xl font-bold hover:border-gold-400 transition-all"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
