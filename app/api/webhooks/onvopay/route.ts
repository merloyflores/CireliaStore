import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';
import { parseOnvoWebhookEvent } from '@/lib/payments/onvopay';

/**
 * Webhook de ONVOPay: cuando el pago se confirma del lado de ellos,
 * llaman esta URL para que marquemos el pedido como pagado sin
 * depender de que el comprador vuelva al sitio (si cierra la pestaña
 * después de pagar, el pedido igual queda bien).
 *
 * Configurar esta URL en el panel de ONVOPay:
 * https://tu-dominio.com/api/webhooks/onvopay
 *
 * PENDIENTE antes de producción: verificar la firma del webhook. Hoy
 * este endpoint NO confirma que el request venga realmente de ONVOPay
 * (la documentación pública no deja claro el nombre exacto del header
 * de firma) — hay que revisar la sección "Webhooks" de
 * docs.onvopay.com con una llave de prueba y sumar esa verificación
 * acá antes de usarlo con dinero real. Mientras tanto, solo actualiza
 * pedidos que ya tengan ese payment_reference guardado (no crea nada
 * nuevo), lo que limita bastante el riesgo de un evento falso.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  let event: ReturnType<typeof parseOnvoWebhookEvent>;
  try {
    event = parseOnvoWebhookEvent(rawBody);
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  if (!event.providerReference) {
    return NextResponse.json({ received: true });
  }

  const isPaid = ['succeeded', 'paid', 'completed'].includes((event.status || '').toLowerCase());
  if (!isPaid) {
    return NextResponse.json({ received: true });
  }

  const supabase = createServiceRoleClient();
  const { data: order } = await supabase
    .from('orders')
    .select('id, status')
    .eq('payment_reference', event.providerReference)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ received: true });
  }
  if (order.status !== 'paid') {
    await supabase.from('orders').update({ status: 'paid' }).eq('id', order.id);
  }

  return NextResponse.json({ received: true });
}
