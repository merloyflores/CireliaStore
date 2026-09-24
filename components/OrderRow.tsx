import {
  Hash,
  CalendarDays,
  CreditCard,
  Truck,
  ArrowUpRight,
} from 'lucide-react';
import { ORDER_STATUS_CONFIG, ORDER_STATUS_LIST, getOrderStatusInfo } from '../lib/orderStatus';

export interface OrderRowData {
  id: string;
  invoice_number: number | null;
  status: string;
  total_amount: number;
  created_at: string;
  payment_method: string | null;
  delivery_method: string | null;
  delivery_cost: number | null;
  users: { name: string } | null;
}

interface OrderTableRowProps {
  order: OrderRowData;
  isUpdatingStatus: boolean;
  onStatusChange: (orderId: string, newStatus: string) => void;
  onOpenDetail: (order: OrderRowData) => void;
}

function formatCRC(amount: number) {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatOrderDate(isoDate: string) {
  return new Intl.DateTimeFormat('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoDate));
}

export function OrderTableRow({ order, isUpdatingStatus, onStatusChange, onOpenDetail }: OrderTableRowProps) {
  const statusInfo = getOrderStatusInfo(order.status);

  return (
    <tr className="hover:bg-zinc-50/60 transition-colors group">

      <td className="px-6 py-4">
        <div className="space-y-0.5">
          <p className="font-bold text-zinc-950 group-hover:text-zinc-900 transition-colors flex items-center gap-1">
            <Hash size={11} className="text-zinc-400" />
            {order.invoice_number ? order.invoice_number.toString().padStart(4, '0') : order.id.substring(0, 6).toUpperCase()}
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
            <CalendarDays size={10} /> {formatOrderDate(order.created_at)}
          </span>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex flex-col gap-1 text-xs text-zinc-500">
          <span className="font-bold text-zinc-900 text-sm">{order.users?.name || 'Cliente sin nombre'}</span>
          {order.payment_method && (
            <span className="flex items-center gap-2 capitalize">
              <CreditCard size={13} className="text-zinc-400" /> {order.payment_method.replace('_', ' ')}
            </span>
          )}
          {order.delivery_method && (
            <span className="flex items-center gap-2 capitalize">
              <Truck size={13} className="text-zinc-400" /> {order.delivery_method}
            </span>
          )}
        </div>
      </td>

      <td className="px-6 py-4">
        <span className="text-sm font-black text-zinc-900">{formatCRC(order.total_amount)}</span>
      </td>

      <td className="px-6 py-4">
        <select
          aria-label="Actualizar estado del pedido"
          value={order.status}
          onChange={(e) => onStatusChange(order.id, e.target.value)}
          disabled={isUpdatingStatus}
          className={`appearance-none px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border-none outline-none cursor-pointer transition-all ${
            isUpdatingStatus ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-80'
          } ${statusInfo.styles}`}
        >
          {ORDER_STATUS_LIST.map((statusKey) => (
            <option key={statusKey} value={statusKey} className="bg-white text-zinc-900 font-medium">
              {ORDER_STATUS_CONFIG[statusKey].label}
            </option>
          ))}
        </select>
      </td>

      <td className="px-6 py-4 text-right">
        <button
          onClick={() => onOpenDetail(order)}
          className="p-2 bg-zinc-50 border border-zinc-200 rounded-xl hover:bg-zinc-950 hover:border-zinc-950 hover:text-white transition group/btn inline-flex items-center"
          title="Ver detalle del pedido"
        >
          <ArrowUpRight size={14} className="text-zinc-500 group-hover/btn:text-white transition-colors" />
        </button>
      </td>

    </tr>
  );
}