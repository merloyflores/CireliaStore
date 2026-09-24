'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/app/providers';
import {
  Loader2, Package, ChevronLeft, ChevronRight, X, Truck, Bike, Check,
  ClipboardCheck, PackageCheck, MapPin, UserCircle2, Percent, Save,
} from 'lucide-react';

const PAGE_SIZE = 15;

const STATUS_FLOW = ['pending', 'paid', 'shipped', 'delivered'] as const;

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-amber-100 text-amber-700' },
  paid: { label: 'Pagado', className: 'bg-sky-100 text-sky-700' },
  shipped: { label: 'Enviado', className: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Entregado', className: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-700' },
};

// Etapas visuales estilo "seguimiento de paquete" (como Amazon): cada
// una tiene su ícono y a qué estado(s) de la orden corresponde, para
// poder marcar cuáles ya se cumplieron sin importar el estado exacto.
const TRACKING_STAGES = [
  { key: 'pending', label: 'Pedido confirmado', icon: ClipboardCheck },
  { key: 'paid', label: 'Pago recibido', icon: Check },
  { key: 'shipped', label: 'En camino', icon: Truck },
  { key: 'delivered', label: 'Entregado', icon: PackageCheck },
] as const;

function money(amount: number) {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

type OrderRow = {
  id: string;
  invoice_number: number;
  status: string;
  total_amount: number;
  shipping_address: any;
  payment_method: string | null;
  order_notes: string | null;
  sold_by_staff_id: string | null;
  created_at: string;
  users: { name: string | null; email: string | null } | null;
};

type OrderItem = {
  id: string;
  quantity: number;
  price_at_purchase: number;
  products: { name: string } | null;
};

type Commission = {
  id: string;
  final_amount: number;
  calculated_amount: number | null;
  manual_override_amount: number | null;
};

export default function VentasPage() {
  const supabase = createClient();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [updating, setUpdating] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const [couriers, setCouriers] = useState<{ id: string; name: string | null; email: string | null }[]>([]);
  const [staff, setStaff] = useState<{ id: string; name: string | null; email: string | null }[]>([]);
  const [assignment, setAssignment] = useState<{ id: string; courier_user_id: string | null; status: string } | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [assigningSeller, setAssigningSeller] = useState(false);

  const [commission, setCommission] = useState<Commission | null>(null);
  const [manualCommission, setManualCommission] = useState('');
  const [savingCommission, setSavingCommission] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    supabase
      .from('users')
      .select('id, name, email')
      .eq('tenant_id', tenantId)
      .eq('role', 'delivery')
      .then(({ data }) => setCouriers(data ?? []));
    supabase
      .from('users')
      .select('id, name, email')
      .eq('tenant_id', tenantId)
      .in('role', ['admin', 'moderator'])
      .then(({ data }) => setStaff(data ?? []));
  }, [tenantId]);

  const loadOrders = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    let query = supabase
      .from('orders')
      .select('id, invoice_number, status, total_amount, shipping_address, payment_method, order_notes, sold_by_staff_id, created_at, users(name, email)', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (statusFilter) query = query.eq('status', statusFilter);

    const { data, count } = await query;
    setOrders((data as any) ?? []);
    setTotalCount(count ?? 0);
    setLoading(false);
  }, [tenantId, page, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const openOrder = async (order: OrderRow) => {
    setSelected(order);
    setAssignment(null);
    setCommission(null);
    setNotesDraft(order.order_notes ?? '');
    setManualCommission('');
    const [{ data: itemsData }, { data: assignmentData }, { data: commissionData }] = await Promise.all([
      supabase.from('order_items').select('id, quantity, price_at_purchase, products(name)').eq('order_id', order.id),
      supabase.from('delivery_assignments').select('id, courier_user_id, status').eq('order_id', order.id).maybeSingle(),
      supabase.from('order_commissions').select('id, final_amount, calculated_amount, manual_override_amount').eq('order_id', order.id).maybeSingle(),
    ]);
    setItems((itemsData as any) ?? []);
    setAssignment(assignmentData ?? null);
    setCommission(commissionData ?? null);
  };

  const assignCourier = async (courierId: string) => {
    if (!selected) return;
    setAssigning(true);
    if (assignment) {
      const { error } = await supabase
        .from('delivery_assignments')
        .update({ courier_user_id: courierId, status: 'assigned' })
        .eq('id', assignment.id);
      setAssigning(false);
      if (error) {
        alert('No se pudo asignar: ' + error.message);
        return;
      }
      setAssignment({ ...assignment, courier_user_id: courierId, status: 'assigned' });
    } else {
      const { data, error } = await supabase
        .from('delivery_assignments')
        .insert({ order_id: selected.id, courier_user_id: courierId, status: 'assigned' })
        .select('id, courier_user_id, status')
        .single();
      setAssigning(false);
      if (error) {
        alert('No se pudo asignar: ' + error.message);
        return;
      }
      setAssignment(data);
    }
  };

  const assignSeller = async (staffId: string) => {
    if (!selected) return;
    setAssigningSeller(true);
    const { error } = await supabase.from('orders').update({ sold_by_staff_id: staffId || null }).eq('id', selected.id);
    setAssigningSeller(false);
    if (error) {
      alert('No se pudo asignar el vendedor: ' + error.message);
      return;
    }
    setSelected({ ...selected, sold_by_staff_id: staffId || null });
    setOrders((os) => os.map((o) => (o.id === selected.id ? { ...o, sold_by_staff_id: staffId || null } : o)));
  };

  // El cálculo automático de comisión solo corre cuando el pedido PASA
  // a "pagado" por primera vez (lo dispara un trigger en la base de
  // datos). Si el vendedor se asigna después, o si no había una regla
  // parametrizada en ese momento, acá se puede cargar el monto a mano
  // — queda guardado igual en order_commissions, marcado como manual.
  const saveManualCommission = async () => {
    if (!selected || !selected.sold_by_staff_id) return;
    const amount = Number(manualCommission);
    if (!amount || amount <= 0) {
      alert('Ingresá un monto válido.');
      return;
    }
    setSavingCommission(true);
    const { data, error } = await supabase
      .from('order_commissions')
      .insert({
        order_id: selected.id,
        staff_id: selected.sold_by_staff_id,
        manual_override_amount: amount,
        final_amount: amount,
        breakdown: { manual: true, assigned_by: profile?.id ?? null },
      })
      .select('id, final_amount, calculated_amount, manual_override_amount')
      .single();
    setSavingCommission(false);
    if (error) {
      alert('No se pudo guardar la comisión: ' + error.message);
      return;
    }
    setCommission(data);
    setManualCommission('');
  };

  const updateStatus = async (newStatus: string) => {
    if (!selected) return;
    setUpdating(true);
    const extra: Record<string, any> = {};
    if (newStatus === 'shipped') extra.shipped_at = new Date().toISOString();
    if (newStatus === 'delivered') extra.delivered_at = new Date().toISOString();
    const { error } = await supabase.from('orders').update({ status: newStatus, ...extra }).eq('id', selected.id);
    setUpdating(false);
    if (error) {
      alert('No se pudo actualizar: ' + error.message);
      return;
    }
    setSelected({ ...selected, status: newStatus });
    loadOrders();
  };

  const saveNotes = async () => {
    if (!selected) return;
    setSavingNotes(true);
    const { error } = await supabase.from('orders').update({ order_notes: notesDraft || null }).eq('id', selected.id);
    setSavingNotes(false);
    if (error) {
      alert('No se pudo guardar la ubicación/nota: ' + error.message);
      return;
    }
    setSelected({ ...selected, order_notes: notesDraft || null });
    setOrders((os) => os.map((o) => (o.id === selected.id ? { ...o, order_notes: notesDraft || null } : o)));
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const address = selected?.shipping_address ?? {};
  const currentStageIndex = selected ? STATUS_FLOW.indexOf(selected.status as any) : -1;
  const sellerName = (id: string | null) => {
    if (!id) return null;
    const s = staff.find((x) => x.id === id);
    return s?.name || s?.email || null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-ink-950 tracking-tight">Ventas y envíos</h1>
        <p className="text-ink-500">{totalCount} {totalCount === 1 ? 'pedido' : 'pedidos'}</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => { setPage(0); setStatusFilter(''); }}
          className={`text-xs font-bold px-4 py-2 rounded-full transition-colors ${statusFilter === '' ? 'bg-ink-900 text-cream-50' : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50'}`}
        >
          Todos
        </button>
        {Object.entries(STATUS_LABELS).map(([key, val]) => (
          <button
            key={key}
            onClick={() => { setPage(0); setStatusFilter(key); }}
            className={`text-xs font-bold px-4 py-2 rounded-full transition-colors ${statusFilter === key ? 'bg-ink-900 text-cream-50' : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50'}`}
          >
            {val.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-ink-400" /></div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <Package size={40} className="text-ink-300 mb-4" />
            <p className="text-ink-500 font-medium">No hay pedidos que coincidan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-[10px] font-black text-ink-400 uppercase tracking-widest">
                  <th className="px-5 py-4">Pedido</th>
                  <th className="px-5 py-4">Cliente</th>
                  <th className="px-5 py-4">Vendedor</th>
                  <th className="px-5 py-4">Fecha</th>
                  <th className="px-5 py-4">Total</th>
                  <th className="px-5 py-4">Estado</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const status = STATUS_LABELS[o.status] ?? { label: o.status, className: 'bg-ink-100 text-ink-600' };
                  return (
                    <tr key={o.id} onClick={() => openOrder(o)} className="border-b border-ink-50 last:border-0 hover:bg-cream-50 transition-colors cursor-pointer">
                      <td className="px-5 py-4 font-bold text-ink-900">#{o.invoice_number}</td>
                      <td className="px-5 py-4 text-ink-600">{o.users?.name || o.users?.email || (o.shipping_address?.nombre ?? 'Invitado')}</td>
                      <td className="px-5 py-4 text-ink-500 text-xs">
                        {sellerName(o.sold_by_staff_id) || <span className="italic text-ink-300">Sin asignar</span>}
                      </td>
                      <td className="px-5 py-4 text-ink-500 text-xs">{formatDate(o.created_at)}</td>
                      <td className="px-5 py-4 font-semibold text-ink-900">{money(o.total_amount)}</td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${status.className}`}>{status.label.toUpperCase()}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="p-2 border border-ink-200 rounded-lg disabled:opacity-40 hover:bg-ink-50 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-ink-500 font-medium">Página {page + 1} de {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-2 border border-ink-200 rounded-lg disabled:opacity-40 hover:bg-ink-50 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="sticky top-0 bg-white border-b border-ink-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="font-serif text-xl text-ink-900">Pedido #{selected.invoice_number}</h2>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-ink-50 rounded-full text-ink-500"><X size={18} /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* SEGUIMIENTO ESTILO "AMAZON" */}
              {selected.status === 'cancelled' ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-red-100 text-red-700">PEDIDO CANCELADO</span>
                </div>
              ) : (
                <div className="bg-cream-50 rounded-2xl p-5 border border-ink-100">
                  <div className="flex items-center justify-between">
                    {TRACKING_STAGES.map((stage, i) => {
                      const done = i <= currentStageIndex;
                      const isCurrent = i === currentStageIndex;
                      const Icon = stage.icon;
                      return (
                        <div key={stage.key} className="flex-1 flex flex-col items-center relative">
                          {i > 0 && (
                            <div
                              className={`absolute top-4 right-1/2 w-full h-0.5 -z-0 ${i <= currentStageIndex ? 'bg-emerald-400' : 'bg-ink-200'}`}
                            />
                          )}
                          <button
                            disabled={updating}
                            onClick={() => updateStatus(stage.key)}
                            className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                              done
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'bg-white border-ink-200 text-ink-300 hover:border-gold-400'
                            } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}
                            title={`Marcar como ${stage.label}`}
                          >
                            <Icon size={14} />
                          </button>
                          <span className={`mt-2 text-[10px] font-bold text-center leading-tight ${done ? 'text-ink-900' : 'text-ink-400'}`}>
                            {stage.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    disabled={updating}
                    onClick={() => confirm('¿Cancelar este pedido?') && updateStatus('cancelled')}
                    className="text-xs font-bold text-red-500 hover:text-red-600 mt-4"
                  >
                    Cancelar pedido
                  </button>
                </div>
              )}

              {/* UBICACIÓN / NOTA DE ENVÍO */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin size={12} /> Dónde se encuentra / nota de envío
                </p>
                <div className="flex gap-2">
                  <input
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder="Ej. En bodega, esperando repartidor / En camino a Alajuela centro"
                    className="w-full h-10 px-3 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
                  />
                  <button
                    onClick={saveNotes}
                    disabled={savingNotes || notesDraft === (selected.order_notes ?? '')}
                    className="shrink-0 flex items-center gap-1.5 text-xs font-bold bg-ink-900 text-cream-50 px-4 rounded-xl disabled:opacity-40"
                  >
                    {savingNotes ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  </button>
                </div>
              </div>

              <div className="bg-cream-50 rounded-2xl p-4 border border-ink-100 space-y-1 text-sm">
                <p className="font-semibold text-ink-900">{selected.users?.name || address.nombre || 'Cliente invitado'}</p>
                <p className="text-ink-500">{selected.users?.email || address.correo}</p>
                {address.telefono && <p className="text-ink-500">{address.telefono}</p>}
                {address.direccion && <p className="text-ink-500 text-xs pt-1">{address.direccion}</p>}
              </div>

              <div className="space-y-2">
                {items.map((it) => (
                  <div key={it.id} className="flex justify-between text-sm">
                    <span className="text-ink-600">{it.products?.name ?? 'Producto'} <span className="text-ink-400">×{it.quantity}</span></span>
                    <span className="font-semibold text-ink-900">{money(it.price_at_purchase * it.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-3 border-t border-ink-100">
                  <span className="font-bold text-ink-900">Total</span>
                  <span className="font-bold text-ink-900">{money(selected.total_amount)}</span>
                </div>
              </div>

              {/* VENDEDOR / ASESOR + COMISIÓN */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest flex items-center gap-1.5">
                  <UserCircle2 size={12} /> ¿De quién es esta venta?
                </p>
                <select
                  disabled={assigningSeller}
                  value={selected.sold_by_staff_id ?? ''}
                  onChange={(e) => assignSeller(e.target.value)}
                  className="w-full h-10 px-3 bg-cream-50 border border-ink-200 rounded-xl text-sm"
                >
                  <option value="">Sin asignar</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>{s.name || s.email}</option>
                  ))}
                </select>

                {selected.sold_by_staff_id && (
                  <div className="bg-gold-50 border border-gold-200 rounded-xl p-3 space-y-2">
                    <p className="text-[10px] font-bold text-gold-700 uppercase tracking-widest flex items-center gap-1.5">
                      <Percent size={12} /> Comisión
                    </p>
                    {commission ? (
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-ink-900">{money(commission.final_amount)}</p>
                        <span className="text-[10px] font-black text-ink-400 uppercase">
                          {commission.manual_override_amount != null && commission.calculated_amount == null ? 'Asignada a mano' : 'Calculada por regla'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={manualCommission}
                          onChange={(e) => setManualCommission(e.target.value)}
                          placeholder="Sin parametrizar — monto en CRC"
                          className="w-full h-9 px-3 bg-white border border-ink-200 rounded-lg text-sm"
                        />
                        <button
                          onClick={saveManualCommission}
                          disabled={savingCommission || !manualCommission}
                          className="shrink-0 text-xs font-bold bg-ink-900 text-cream-50 px-3 rounded-lg disabled:opacity-40"
                        >
                          {savingCommission ? '...' : 'Asignar'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* REPARTIDOR */}
              {selected.status !== 'cancelled' && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Bike size={12} /> Repartidor
                  </p>
                  {couriers.length === 0 ? (
                    <p className="text-xs text-ink-400">
                      Todavía no tenés repartidores en tu equipo. Agregalos desde <span className="font-semibold">Equipo</span>.
                    </p>
                  ) : (
                    <select
                      disabled={assigning}
                      value={assignment?.courier_user_id ?? ''}
                      onChange={(e) => e.target.value && assignCourier(e.target.value)}
                      className="w-full h-10 px-3 bg-cream-50 border border-ink-200 rounded-xl text-sm"
                    >
                      <option value="">Sin asignar</option>
                      {couriers.map((c) => (
                        <option key={c.id} value={c.id}>{c.name || c.email}</option>
                      ))}
                    </select>
                  )}
                  {assignment && (
                    <p className="text-xs text-ink-400">Estado de entrega: {assignment.status}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
