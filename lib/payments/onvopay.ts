/**
 * Adaptador para ONVOPay (https://onvopay.com) — la pasarela de pago
 * costarricense que salió elegida en la investigación de la sección
 * "Pendientes e ideas futuras" (comisiones más bajas que PayPal para
 * pagos locales, sin cuota mensual, y con SINPE Móvil como método
 * además de tarjeta).
 *
 * VERIFICADO con una llamada real a la API de prueba (llave
 * onvo_test_...) el 2026-09-25, así que ya no son suposiciones:
 *
 * - No existe un endpoint de "checkout session" con URL directa. El
 *   flujo real de ONVOPay para un checkout hospedado (redirigir al
 *   comprador a pagar) es "Payment Links": primero se crea un
 *   producto (`POST /v1/products`) y luego un link de pago
 *   (`POST /v1/payment-links`) que referencia ese producto — el link
 *   responde con `url` (la página de pago) y `id` (la referencia).
 * - El link SÍ soporta redirigir de vuelta al sitio después de pagar,
 *   con `afterCompletion: { type: 'redirect', redirectUrl }` — pero
 *   probé varios nombres de campo para adjuntar un ID propio o una
 *   URL de cancelación (metadata, clientReferenceId, reference,
 *   orderId, cancelUrl…) y ninguno existe en este endpoint. Por eso
 *   el emparejamiento con el pedido se hace guardando el `id` que
 *   devuelve el link como `payment_reference` del pedido, no por
 *   metadata.
 * - Los montos para CRC van en colones enteros, NO en céntimos (a
 *   diferencia de Stripe/PayPal): enviar `amount: 15000` para un pedido
 *   de ₡15.000, confirmado comparando el `baseAmount` (su equivalente
 *   en USD) que devuelve la API de prueba. Enviar *100 sería cobrar
 *   100 veces de más.
 *
 * Lo único que sigue sin confirmar en un sandbox real (requiere
 * completar un pago de prueba con tarjeta, algo que no se puede hacer
 * desde acá) es la forma exacta del evento que manda el webhook al
 * completarse un pago — `parseOnvoWebhookEvent` de abajo queda
 * intencionalmente flexible para cubrir varios formatos razonables,
 * y sin verificar la firma del webhook todavía (ver nota ahí).
 */

const ONVOPAY_BASE_URL = 'https://api.onvopay.com/v1';

export type CreateOnvoCheckoutParams = {
  secretKey: string;
  amount: number; // en unidades enteras de la moneda (colones, no céntimos)
  currency: 'CRC' | 'USD';
  orderId: string;
  invoiceNumber: number | string;
  successUrl: string;
  cancelUrl: string; // se guarda para uso futuro; ONVOPay Payment Links no acepta una URL de cancelación propia hoy
  customerEmail?: string | null;
};

export type OnvoCheckoutResult = {
  checkoutUrl: string;
  providerReference: string;
};

export class OnvoPayError extends Error {}

/**
 * Crea un producto + un link de pago hospedado en ONVOPay para un
 * pedido, y devuelve la URL a la que hay que redirigir al comprador.
 */
export async function createOnvoCheckoutSession(params: CreateOnvoCheckoutParams): Promise<OnvoCheckoutResult> {
  const { secretKey, amount, currency, orderId, invoiceNumber, successUrl, customerEmail } = params;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${secretKey}`,
  };

  // 1) Un "producto" en ONVOPay es solo el nombre que ve el comprador
  // en la página de pago — lo creamos por pedido, no hace falta
  // reusarlo.
  const productRes = await fetch(`${ONVOPAY_BASE_URL}/products`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: `Pedido #${invoiceNumber}` }),
  });
  if (!productRes.ok) {
    const bodyText = await productRes.text().catch(() => '');
    throw new OnvoPayError(`ONVOPay (crear producto) respondió ${productRes.status}: ${bodyText || 'sin detalle'}`);
  }
  const product = await productRes.json().catch(() => null);
  const productId: string | undefined = product?.id;
  if (!productId) {
    throw new OnvoPayError('ONVOPay no devolvió un id de producto reconocible.');
  }

  // 2) El link de pago en sí, con el monto real del pedido y
  // redirección de vuelta a la tienda al terminar.
  const linkRes = await fetch(`${ONVOPAY_BASE_URL}/payment-links`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      lineItems: [
        {
          quantity: 1,
          priceData: {
            type: 'one_time',
            unitAmount: Math.round(amount),
            currency,
            productId,
          },
        },
      ],
      afterCompletion: { type: 'redirect', redirectUrl: successUrl },
    }),
  });

  if (!linkRes.ok) {
    const bodyText = await linkRes.text().catch(() => '');
    throw new OnvoPayError(`ONVOPay (crear link de pago) respondió ${linkRes.status}: ${bodyText || 'sin detalle'}`);
  }

  const link = await linkRes.json().catch(() => null);
  const checkoutUrl: string | undefined = link?.url;
  const providerReference: string | undefined = link?.id;

  if (!checkoutUrl || !providerReference) {
    throw new OnvoPayError('ONVOPay no devolvió una URL de checkout reconocible.');
  }

  // orderId/customerEmail no los acepta este endpoint (no hay campo de
  // metadata) — quedan en la firma por si ONVOPay lo suma más adelante,
  // y para que quede documentado que se intentó.
  void orderId;
  void customerEmail;

  return { checkoutUrl, providerReference };
}

/**
 * Verifica y decodifica un evento de webhook de ONVOPay.
 *
 * El mecanismo exacto de firma (nombre del header, algoritmo) no está
 * confirmado — la configuración de webhooks vive en el dashboard de
 * ONVOPay, no en la API con llave secreta, así que no se pudo probar
 * en vivo desde acá. Por ahora esta función NO verifica firma (queda
 * marcado abajo) — antes de mover a producción, revisar la sección
 * "Webhooks" del dashboard de ONVOPay y completar la verificación con
 * el secreto de webhook que entregan al configurar la URL de
 * notificación, para no aceptar eventos falsos.
 */
export function parseOnvoWebhookEvent(rawBody: string): { type: string; providerReference: string | null; status: string | null } {
  const payload = JSON.parse(rawBody);
  const obj = payload?.data?.object ?? payload?.data ?? payload;
  return {
    type: payload?.type ?? payload?.event ?? 'unknown',
    providerReference: obj?.id ?? obj?.paymentLinkId ?? obj?.paymentIntentId ?? null,
    status: obj?.status ?? null,
  };
}
