import Link from 'next/link';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { TrendingUp, ShoppingBag, Users, AlertTriangle, ArrowUpRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

function money(amount: number) {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(amount);
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  return `Hace ${Math.floor(hours / 24)} d`;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-amber-100 text-amber-700' },
  paid: { label: 'Pagado', className: 'bg-sky-100 text-sky-700' },
  shipped: { label: 'Enviado', className: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Entregado', className: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-700' },
};

export default async function AdminDashboard() {
  const supabase = await createClient();
  const headerList = await headers();
  const tenantSlug = headerList.get('x-tenant-slug') || process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || 'cirelia';
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).maybeSingle();
  const tenantId = tenant?.id;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: recentOrders }, { count: ordersTodayCount }, { data: sales30d }, { count: newCustomersCount }, { data: lowStock }] =
    await Promise.all([
      supabase
        .from('orders')
        .select('id, invoice_number, total_amount, status, created_at, users(name, email)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(6),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).gte('created_at', startOfToday.toISOString()),
      supabase.from('orders').select('total_amount').eq('tenant_id', tenantId).neq('status', 'cancelled').gte('created_at', thirtyDaysAgo),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('role', 'customer').gte('created_at', thirtyDaysAgo),
      supabase.from('products').select('id, name, stock').eq('tenant_id', tenantId).eq('is_active', true).lte('stock', 5).order('stock').limit(6),
    ]);

  const totalSales30d = (sales30d ?? []).reduce((acc, o) => acc + Number(o.total_amount || 0), 0);

  const stats = [
    { label: 'Ventas (30 días)', value: money(totalSales30d), icon: TrendingUp, color: 'text-gold-600' },
    { label: 'Pedidos hoy', value: String(ordersTodayCount ?? 0), icon: ShoppingBag, color: 'text-emerald-600' },
    { label: 'Clientes nuevos (30d)', value: String(newCustomersCount ?? 0), icon: Users, color: 'text-indigo-600' },
    { label: 'Alertas de stock', value: String(lowStock?.length ?? 0), icon: AlertTriangle, color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-ink-950 tracking-tight">Dashboard</h1>
        <p className="text-ink-500">Resumen de tu tienda.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white p-6 rounded-2xl border border-ink-100 shadow-sm flex items-start justify-between hover:border-ink-200 transition-colors"
          >
            <div>
              <p className="text-xs font-black text-ink-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-ink-950 mt-1">{stat.value}</h3>
            </div>
            <div className={`p-2 bg-ink-50 rounded-xl ${stat.color}`}>
              <stat.icon size={20} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-ink-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-black text-ink-950">Pedidos recientes</h2>
            <Link href="/admin/ventas" className="text-xs font-bold text-gold-700 hover:text-gold-800 flex items-center gap-1">
              Ver todos <ArrowUpRight size={14} />
            </Link>
          </div>

          {recentOrders && recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order: any) => {
                const status = STATUS_LABELS[order.status] ?? { label: order.status, className: 'bg-ink-100 text-ink-600' };
                return (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-cream-100 rounded-xl hover:bg-cream-200 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 bg-white rounded-lg border border-ink-200 flex items-center justify-center font-bold text-xs shrink-0">
                        #{order.invoice_number}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-ink-900 truncate">{order.users?.name || order.users?.email || 'Cliente'}</p>
                        <p className="text-xs text-ink-400">{timeAgo(order.created_at)} · {money(order.total_amount)}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-black px-3 py-1 rounded-full shrink-0 ${status.className}`}>{status.label.toUpperCase()}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-ink-400 py-8 text-center">Todavía no hay pedidos.</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-ink-100 shadow-sm">
          <h2 className="font-black text-ink-950 mb-6">Stock bajo</h2>
          {lowStock && lowStock.length > 0 ? (
            <div className="space-y-3">
              {lowStock.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 text-sm p-3 rounded-xl font-medium border ${
                    p.stock === 0 ? 'bg-red-50 text-red-800 border-red-100' : 'bg-amber-50 text-amber-800 border-amber-100'
                  }`}
                >
                  <AlertTriangle size={16} className="shrink-0" />
                  <span className="truncate">
                    {p.name}: {p.stock} unidades
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-400 py-8 text-center">Sin alertas de stock.</p>
          )}
        </div>
      </div>
    </div>
  );
}
