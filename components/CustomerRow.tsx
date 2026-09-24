import {
  Mail,
  Phone,
  CreditCard,
  UserCheck,
  UserX,
  ArrowUpRight,
  Star,
  ShieldCheck,
} from 'lucide-react';
import { getBadgeStyles } from '../lib/loyaltyTiers';
import { CustomerRow as CustomerRowData, ROLE_STYLES, ROLE_LABELS } from '../lib/customers';

interface CustomerTableRowProps {
  customer: CustomerRowData;
  onOpenProfile: (customer: CustomerRowData) => void;
}

function formatCRC(amount: number) {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    maximumFractionDigits: 0
  }).format(amount);
}

export function CustomerTableRow({ customer, onOpenProfile }: CustomerTableRowProps) {
  return (
    <tr className="hover:bg-zinc-50/60 transition-colors group">

      <td className="px-6 py-4">
        <div className="space-y-0.5">
          <p className="font-bold text-zinc-950 group-hover:text-zinc-900 transition-colors">
            {customer.name || 'Sin nombre registrado'}
          </p>
          {customer.dni && (
            <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
              <CreditCard size={10} /> {customer.dni}
            </span>
          )}
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex flex-col gap-1 text-xs text-zinc-500">
          {customer.email && (
            <span className="flex items-center gap-2">
              <Mail size={13} className="text-zinc-400" /> {customer.email}
            </span>
          )}
          {customer.phone && (
            <span className="flex items-center gap-2">
              <Phone size={13} className="text-zinc-400" /> {customer.phone}
            </span>
          )}
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-zinc-950">{customer.orderCount} pedidos</span>
          <span className="text-[10px] text-zinc-500">{formatCRC(customer.totalSpent)}</span>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex flex-col gap-1.5 items-start">
          {customer.role !== 'customer' && (
            <div className={`flex items-center gap-1 w-fit px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${ROLE_STYLES[customer.role]}`}>
              <ShieldCheck size={10} />
              {ROLE_LABELS[customer.role]}
            </div>
          )}

          {customer.tier && (
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getBadgeStyles(customer.tier.badge_color)}`}>
              {customer.manual_tier_id && <Star size={10} fill="currentColor" />}
              {customer.tier.name}
            </div>
          )}

          <div className={`flex items-center gap-1 w-fit px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
            customer.status === 'active'
              ? 'bg-green-50 text-green-700 border border-green-100'
              : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
          }`}>
            {customer.status === 'active' ? <UserCheck size={10} /> : <UserX size={10} />}
            {customer.status === 'active' ? 'Activo' : 'Inactivo'}
          </div>
        </div>
      </td>

      <td className="px-6 py-4 text-right">
        <button
          onClick={() => onOpenProfile(customer)}
          className="p-2 bg-zinc-50 border border-zinc-200 rounded-xl hover:bg-zinc-950 hover:border-zinc-950 hover:text-white transition group/btn inline-flex items-center"
          title="Ver expediente"
        >
          <ArrowUpRight size={14} className="text-zinc-500 group-hover/btn:text-white transition-colors" />
        </button>
      </td>

    </tr>
  );
}