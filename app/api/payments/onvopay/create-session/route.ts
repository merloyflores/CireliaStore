import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';
import { createOnvoCheckoutSession, OnvoPayError } from '@/lib/payments/onvopay';

/**
 * Arranca el pago con ONVOPay para un pedido ya creado (checkout crea
 * el pedido como "pending" primero, igual que con el flujo manual, y
 * recién después llama acá). Usa el service role porque quien llama
 * esto es un comprador anónimo o logueado como cliente — nunca staff
 * — así que no tiene (ni debería tener) permiso para leer la llave
 * secreta de ONVOPay del tenant vía RLS normal.
 *
 * Si el tenant no tiene ONVOPay configurado, o algo falla del lado de
 * ONVOPay, devuelve un error claro y el checkout del storefront cae de
 * vuelta al flujo manual (WhatsApp/SINPE) — nunca deja al comprador
 * sin ninguna opción de pagar.
 */
export async function POST(request: Request) {
  let body: { orderId?: string; tenantId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
  }

  const { orderId, tenantId } = body;
  if (!orderId || !tenantId) {
    return NextResponse.json({ error: 'Falta orderId o tenantId.' }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (err: any) {
    console.error('ONVOPay create-session:', err.message);
    return NextResponse.json({ error: 'Pasarela de pago no disponible en este momento.' }, { status: 503 });
  }

  const [{ data: order, error: orderError }, { data: providerConfig }] = await Promise.all([
    supabase.from('orders').select('id, invoice_number, total_amount, tenant_id, user_id').eq('id', orderId).eq('tenant_id', tenantId).maybeSingle(),
    supabase.from('payment_provider_config').select('onvopay_secret_key, onvopay_mode').eq('tenant_id', tenantId).maybeSingle(),
  ]);

  if (orderError || !order) {
    return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });
  }
  if (!providerConfig?.onvopay_secret_key) {
    return NextResponse.json({ error: 'Esta tienda todavía no configuró ONVOPay.' }, { status: 400 });
  }

  let customerEmail: string | null = null;
  if (order.user_id) {
    const { data: userRow } = await supabase.from('users').select('email').eq('id', order.user_id).maybeSingle();
    customerEmail = userRow?.email ?? null;
  }

  const origin = request.headers.get('origin') || new URL(request.url).origin;

  try {
    const session = await createOnvoCheckoutSession({
      secretKey: providerConfig.onvopay_secret_key,
      amount: Number(order.total_amount),
      currency: 'CRC',
      orderId: order.id,
      invoiceNumber: order.invoice_number,
      successUrl: `${origin}/checkout/confirmacion/${order.id}`,
      cancelUrl: `${origin}/checkout`,
      customerEmail,
    });

    await supabase.from('orders').update({ payment_reference: session.providerReference }).eq('id', order.id);

    return NextResponse.json({ url: session.checkoutUrl });
  } catch (err: any) {
    console.error('ONVOPay create-session falló:', err);
    const message = err instanceof OnvoPayError ? err.message : 'No se pudo iniciar el pago con la pasarela.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
