'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/app/providers';
import {
  Loader2, Users, Search, ChevronLeft, ChevronRight, X, ShieldBan, ShieldCheck,
  Camera, Crown, MapPin, IdCard, Phone, Mail, Calendar, SlidersHorizontal,
} from 'lucide-react';

const PAGE_SIZE = 10;

function money(amount: number) {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  active: { label: 'Activo', className: 'bg-emerald-100 text-emerald-700' },
  banned: { label: 'Baneado', className: 'bg-red-100 text-red-700' },
  inactive: { label: 'Inactivo', className: 'bg-ink-100 text-ink-500' },
};

type Tier = { id: string; name: string; min_orders: number; min_spent: number; discount_percentage: number };

type CustomerRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  dni: string | null;
  image: string | null;
  status: string | null;
  created_at: string;
  manual_tier_id: string | null;
  banned_reason: string | null;
  banned_at: string | null;
  default_address: { direccion?: string; nombre?: string; telefono?: string; notas?: string } | null;
  loyalty_tiers: { name: string } | null;
};

type CustomerOrder = {
  id: string;
  invoice_number: number;
  status: string;
  total_amount: number;
  created_at: string;
};

function Avatar({ name, image, size = 40 }: { name: string | null; image: string | null; size?: number }) {
  if (image) {
    return (
      <img
        src={image}
        alt={name ?? ''}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border border-ink-100 shrink-0"
      />
    );
  }
  const initial = (name || '?').charAt(0).toUpperCase();
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="rounded-full bg-gold-100 text-gold-700 font-black flex items-center justify-center shrink-0"
    >
      {initial}
    </div>
  );
}

export default function ClientesPage() {
  const supabase = createClient();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [sort, setSort] = useState<'recent' | 'oldest' | 'name_asc'>('recent');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [selected, setSelected] = useState<CustomerRow | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [stats, setStats] = useState<{ totalSpent: number; orderCount: number } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [banningOpen, setBanningOpen] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [savingBan, setSavingBan] = useState(false);
  const [savingTier, setSavingTier] = useState(false);

  const loadTiers = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await supabase.from('loyalty_tiers').select('id, name, min_orders, min_spent, discount_percentage').eq('tenant_id', tenantId).order('priority', { ascending: false });
    setTiers(data ?? []);
  }, [tenantId]);

  const loadCustomers = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    let query = supabase
      .from('users')
      .select('id, name, email, phone, dni, image, status, created_at, manual_tier_id, banned_reason, banned_at, default_address, loyalty_tiers(name)', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('role', 'customer')
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (search.trim()) {
      const q = search.trim();
      query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,dni.ilike.%${q}%`);
    }
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (tierFilter === 'none') query = query.is('manual_tier_id', null);
    else if (tierFilter !== 'all') query = query.eq('manual_tier_id', tierFilter);

    if (sort === 'recent') query = query.order('created_at', { ascending: false });
    else if (sort === 'oldest') query = query.order('created_at', { ascending: true });
    else query = query.order('name', { ascending: true });

    const { data, count } = await query;
    setCustomers((data as any) ?? []);
    setTotalCount(count ?? 0);
    setLoading(false);
  }, [tenantId, page, search, statusFilter, tierFilter, sort]);

  useEffect(() => {
    loadTiers();
  }, [loadTiers]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const openCustomer = async (customer: CustomerRow) => {
    setSelected(customer);
    setOrders([]);
    setStats(null);
    setBanningOpen(false);
    setBanReason('');
    const { data } = await supabase
      .from('orders')
      .select('id, invoice_number, status, total_amount, created_at')
      .eq('user_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(10);
    const list = (data as any) ?? [];
    setOrders(list);
    const totalSpent = list.filter((o: CustomerOrder) => o.status !== 'cancelled').reduce((acc: number, o: CustomerOrder) => acc + Number(o.total_amount), 0);
    setStats({ totalSpent, orderCount: list.length });
  };

  const resolvedTier = useMemo(() => {
    if (!selected || !stats) return null;
    if (selected.manual_tier_id) {
      const t = tiers.find((t) => t.id === selected.manual_tier_id);
      return t ? { ...t, automatic: false } : null;
    }
    const match = tiers
      .filter((t) => stats.orderCount >= t.min_orders && stats.totalSpent >= t.min_spent)
      .sort((a, b) => b.min_spent - a.min_spent)[0];
    return match ? { ...match, automatic: true } : null;
  }, [selected, stats, tiers]);

  const setManualTier = async (tierId: string | null) => {
    if (!selected) return;
    setSavingTier(true);
    setSelected({ ...selected, manual_tier_id: tierId });
    const { error } = await supabase.from('users').update({ manual_tier_id: tierId }).eq('id', selected.id);
    setSavingTier(false);
    if (error) {
      alert('No se pudo actualizar el nivel: ' + error.message);
      return;
    }
    setCustomers((cs) => cs.map((c) => (c.id === selected.id ? { ...c, manual_tier_id: tierId } : c)));
  };

  const uploadAvatar = async (file: File) => {
    if (!selected || !tenantId) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${tenantId}/${selected.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('products').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: pub } = supabase.storage.from('products').getPublicUrl(path);
      const { error } = await supabase.from('users').update({ image: pub.publicUrl }).eq('id', selected.id);
      if (error) throw error;
      setSelected({ ...selected, image: pub.publicUrl });
      setCustomers((cs) => cs.map((c) => (c.id === selected.id ? { ...c, image: pub.publicUrl } : c)));
    } catch (err: any) {
      alert('No se pudo subir la foto: ' + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const confirmBan = async () => {
    if (!selected) return;
    setSavingBan(true);
    const { error } = await supabase
      .from('users')
      .update({ status: 'banned', banned_at: new Date().toISOString(), banned_reason: banReason || null })
      .eq('id', selected.id);
    setSavingBan(false);
    if (error) {
      alert('No se pudo banear: ' + error.message);
      return;
    }
    const patch = { status: 'banned', banned_at: new Date().toISOString(), banned_reason: banReason || null };
    setSelected({ ...selected, ...patch });
    setCustomers((cs) => cs.map((c) => (c.id === selected.id ? { ...c, ...patch } : c)));
    setBanningOpen(false);
    setBanReason('');
  };

  const unban = async () => {
    if (!selected) return;
    if (!confirm(`¿Quitarle el baneo a ${selected.name}?`)) return;
    setSavingBan(true);
    const { error } = await supabase.from('users').update({ status: 'active', banned_at: null, banned_reason: null }).eq('id', selected.id);
    setSavingBan(false);
    if (error) {
      alert('No se pudo actualizar: ' + error.message);
      return;
    }
    setSelected({ ...selected, status: 'active', banned_at: null, banned_reason: null });
    setCustomers((cs) => cs.map((c) => (c.id === selected.id ? { ...c, status: 'active', banned_at: null, banned_reason: null } : c)));
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const activeFilterCount = [statusFilter !== 'all', tierFilter !== 'all', sort !== 'recent'].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-ink-950 tracking-tight">Clientes</h1>
          <p className="text-ink-500">{totalCount} {totalCount === 1 ? 'cliente registrado' : 'clientes registrados'}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => { setPage(0); setSearch(e.target.value); }}
            placeholder="Buscar por nombre, correo, teléfono o cédula..."
            className="w-full h-11 pl-11 pr-4 bg-white border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-sm font-bold transition-colors shrink-0 ${
            showFilters || activeFilterCount > 0 ? 'bg-ink-950 text-cream-50' : 'bg-white border border-ink-200 text-ink-600 hover:border-gold-400'
          }`}
        >
          <SlidersHorizontal size={15} /> Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white border border-ink-100 rounded-2xl p-4 grid sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => { setPage(0); setStatusFilter(e.target.value); }}
              className="w-full h-10 px-3 bg-cream-50 border border-ink-200 rounded-lg text-sm"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="banned">Baneados</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Nivel asignado manualmente</label>
            <select
              value={tierFilter}
              onChange={(e) => { setPage(0); setTierFilter(e.target.value); }}
              className="w-full h-10 px-3 bg-cream-50 border border-ink-200 rounded-lg text-sm"
            >
              <option value="all">Todos</option>
              <option value="none">Sin nivel manual</option>
              {tiers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Ordenar por</label>
            <select
              value={sort}
              onChange={(e) => { setPage(0); setSort(e.target.value as any); }}
              className="w-full h-10 px-3 bg-cream-50 border border-ink-200 rounded-lg text-sm"
            >
              <option value="recent">Más recientes</option>
              <option value="oldest">Más antiguos</option>
              <option value="name_asc">Nombre A-Z</option>
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-ink-100 flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-ink-400" />
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-ink-100 flex flex-col items-center justify-center py-20 text-center px-4">
          <Users size={40} className="text-ink-300 mb-4" />
          <p className="text-ink-500 font-medium">No hay clientes que coincidan.</p>
        </div>
      ) : (
        <>
          {/* TARJETAS — móvil */}
          <div className="grid sm:hidden gap-3">
            {customers.map((c) => {
              const status = STATUS_META[c.status ?? 'active'] ?? STATUS_META.active;
              return (
                <button key={c.id} onClick={() => openCustomer(c)} className="bg-white rounded-2xl border border-ink-100 p-4 flex items-center gap-3 text-left">
                  <Avatar name={c.name} image={c.image} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-ink-900 text-sm truncate">{c.name || 'Sin nombre'}</p>
                      <span className={`shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full ${status.className}`}>{status.label.toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-ink-400 truncate">{c.email}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-ink-500">
                      {c.loyalty_tiers?.name && (
                        <span className="flex items-center gap-1 text-gold-700 font-bold"><Crown size={11} /> {c.loyalty_tiers.name}</span>
                      )}
                      <span>{formatDate(c.created_at)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* TABLA — sm+ */}
          <div className="hidden sm:block bg-white rounded-2xl border border-ink-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-[10px] font-black text-ink-400 uppercase tracking-widest">
                    <th className="px-5 py-4">Cliente</th>
                    <th className="px-5 py-4">Teléfono</th>
                    <th className="px-5 py-4">Nivel</th>
                    <th className="px-5 py-4">Registrado</th>
                    <th className="px-5 py-4">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => {
                    const status = STATUS_META[c.status ?? 'active'] ?? STATUS_META.active;
                    return (
                      <tr key={c.id} onClick={() => openCustomer(c)} className="border-b border-ink-50 last:border-0 hover:bg-cream-50 transition-colors cursor-pointer">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar name={c.name} image={c.image} />
                            <div className="min-w-0">
                              <p className="font-semibold text-ink-900 truncate">{c.name || 'Sin nombre'}</p>
                              <p className="text-xs text-ink-400 truncate">{c.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-ink-600">{c.phone || '—'}</td>
                        <td className="px-5 py-4">
                          {c.loyalty_tiers?.name ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-gold-700"><Crown size={12} /> {c.loyalty_tiers.name}</span>
                          ) : (
                            <span className="text-ink-300 text-xs italic">Automático</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-ink-500 text-xs">{formatDate(c.created_at)}</td>
                        <td className="px-5 py-4">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${status.className}`}>{status.label.toUpperCase()}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

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
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="sticky top-0 bg-white border-b border-ink-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="font-serif text-xl text-ink-900 truncate pr-3">{selected.name || 'Cliente'}</h2>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-ink-50 rounded-full text-ink-500 shrink-0"><X size={18} /></button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="relative group shrink-0">
                  <Avatar name={selected.name} image={selected.image} size={72} />
                  <label className="absolute inset-0 rounded-full bg-ink-950/0 group-hover:bg-ink-950/50 flex items-center justify-center cursor-pointer transition-colors">
                    {uploadingAvatar ? (
                      <Loader2 size={16} className="text-white animate-spin" />
                    ) : (
                      <Camera size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingAvatar}
                      onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
                    />
                  </label>
                </div>
                <div className="min-w-0">
                  {resolvedTier ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-gold-700 bg-gold-50 px-2.5 py-1 rounded-full">
                      <Crown size={12} /> {resolvedTier.name} {resolvedTier.automatic ? '(automático)' : '(manual)'}
                    </span>
                  ) : (
                    <span className="text-xs text-ink-400 italic">Sin nivel de fidelidad</span>
                  )}
                  <p className="text-[11px] text-ink-400 mt-1">Tocá la foto para cambiarla</p>
                </div>
              </div>

              {selected.status === 'banned' && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-1">
                  <p className="text-xs font-black text-red-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldBan size={13} /> Cliente baneado
                  </p>
                  {selected.banned_reason && <p className="text-sm text-red-700">{selected.banned_reason}</p>}
                  {selected.banned_at && <p className="text-[11px] text-red-500">Desde {formatDate(selected.banned_at)}</p>}
                </div>
              )}

              <div className="bg-cream-50 rounded-2xl p-4 border border-ink-100 space-y-2 text-sm">
                {selected.email && <p className="flex items-center gap-2 text-ink-600"><Mail size={13} className="text-ink-400 shrink-0" /> {selected.email}</p>}
                {selected.phone && <p className="flex items-center gap-2 text-ink-600"><Phone size={13} className="text-ink-400 shrink-0" /> {selected.phone}</p>}
                {selected.dni && <p className="flex items-center gap-2 text-ink-600"><IdCard size={13} className="text-ink-400 shrink-0" /> {selected.dni}</p>}
                {selected.default_address?.direccion && (
                  <p className="flex items-center gap-2 text-ink-600"><MapPin size={13} className="text-ink-400 shrink-0" /> {selected.default_address.direccion}</p>
                )}
                <p className="flex items-center gap-2 text-ink-400 text-xs pt-1"><Calendar size={12} /> Cliente desde {formatDate(selected.created_at)}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Nivel de fidelidad manual</label>
                <select
                  value={selected.manual_tier_id ?? ''}
                  disabled={savingTier}
                  onChange={(e) => setManualTier(e.target.value || null)}
                  className="w-full h-10 px-3 bg-white border border-ink-200 rounded-lg text-sm focus:outline-none focus:border-gold-500"
                >
                  <option value="">Automático (según sus compras)</option>
                  {tiers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {stats && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border border-ink-100 rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest">Total gastado</p>
                    <p className="text-lg font-black text-ink-950">{money(stats.totalSpent)}</p>
                  </div>
                  <div className="bg-white border border-ink-100 rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest">Pedidos</p>
                    <p className="text-lg font-black text-ink-950">{stats.orderCount}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-2">Historial de pedidos</p>
                {orders.length === 0 ? (
                  <p className="text-sm text-ink-400 py-4 text-center">Todavía no tiene pedidos.</p>
                ) : (
                  <div className="space-y-2">
                    {orders.map((o) => (
                      <div key={o.id} className="flex justify-between items-center text-sm bg-cream-50 rounded-xl p-3">
                        <span className="font-semibold text-ink-900">#{o.invoice_number}</span>
                        <span className="text-ink-500 text-xs">{formatDate(o.created_at)}</span>
                        <span className="font-semibold text-ink-900">{money(o.total_amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-ink-100">
                {selected.status === 'banned' ? (
                  <button
                    onClick={unban}
                    disabled={savingBan}
                    className="w-full flex items-center justify-center gap-2 h-11 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-60"
                  >
                    {savingBan ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                    Quitar baneo
                  </button>
                ) : banningOpen ? (
                  <div className="space-y-2">
                    <textarea
                      autoFocus
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      placeholder="Motivo del baneo (opcional, queda registrado)"
                      rows={2}
                      className="w-full px-3 py-2 bg-cream-50 border border-ink-200 rounded-lg text-sm resize-none focus:outline-none focus:border-red-400"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setBanningOpen(false)} className="flex-1 h-10 border border-ink-200 rounded-xl text-sm font-bold text-ink-600">
                        Cancelar
                      </button>
                      <button
                        onClick={confirmBan}
                        disabled={savingBan}
                        className="flex-1 flex items-center justify-center gap-2 h-10 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-60"
                      >
                        {savingBan ? <Loader2 size={14} className="animate-spin" /> : <ShieldBan size={14} />}
                        Confirmar baneo
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setBanningOpen(true)}
                    className="w-full flex items-center justify-center gap-2 h-11 border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors"
                  >
                    <ShieldBan size={15} /> Banear cliente
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
