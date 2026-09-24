/**
 * Config única de estados de pedido para todo lo que el cliente ve en
 * /profile (historial, resumen). Los mismos 5 estados que usa el admin
 * en app/admin/ventas/page.tsx (pending/paid/shipped/delivered/cancelled),
 * pero acá con estilos pensados para fondo claro en vez de badges sólidos.
 */

export const ORDER_STATUS_CONFIG: Record<string, { label: string; styles: string }> = {
  pending: { label: 'Pendiente', styles: 'bg-amber-50 text-amber-700 border-amber-200' },
  paid: { label: 'Pagado', styles: 'bg-sky-50 text-sky-700 border-sky-200' },
  shipped: { label: 'Enviado', styles: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  delivered: { label: 'Entregado', styles: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelado', styles: 'bg-red-50 text-red-700 border-red-200' },
};

export const ORDER_STATUS_LIST = Object.keys(ORDER_STATUS_CONFIG);

export const ACTIVE_ORDER_STATUSES = ['pending', 'paid', 'shipped'];

export function getOrderStatusInfo(status: string) {
  return ORDER_STATUS_CONFIG[status] ?? { label: status, styles: 'bg-ink-50 text-ink-500 border-ink-200' };
}
