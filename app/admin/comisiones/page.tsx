'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/app/providers';
import { Loader2, Percent, Plus, Trash2 } from 'lucide-react';

type Staff = { id: string; name: string | null; email: string | null };
type Category = { id: string; name: string };
type ProductOption = { id: string; name: string };

type Rule = {
  id: string;
  name: string;
  scope_type: 'global' | 'advisor' | 'product' | 'category';
  advisor_id: string | null;
  product_id: string | null;
  category_id: string | null;
  rate_type: 'percentage' | 'fixed';
  rate_value: number;
  is_active: boolean;
  goal_threshold: number | null;
  goal_period: string | null;
};

const GOAL_PERIOD_LABELS: Record<string, string> = { day: 'diaria', week: 'semanal', month: 'mensual' };

type CommissionRow = {
  id: string;
  final_amount: number;
  created_at: string;
  orders: { invoice_number: number } | null;
  staff: { name: string | null; email: string | null } | null;
};

const SCOPE_LABELS: Record<string, string> = {
  global: 'General (toda venta)',
  advisor: 'Por asesor específico',
  product: 'Por producto (referencia)',
  category: 'Por categoría (referencia)',
};

const BLANK_RULE = {
  name: '',
  scope_type: 'global' as Rule['scope_type'],
  advisor_id: null as string | null,
  product_id: null as string | null,
  category_id: null as string | null,
  rate_type: 'percentage' as Rule['rate_type'],
  rate_value: 0,
  goal_threshold: null as number | null,
  goal_period: 'month' as string,
};

function money(amount: number) {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(amount);
}

export default function ComisionesPage() {
  const supabase = createClient();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  const [rules, setRules] = useState<Rule[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [newRule, setNewRule] = useState<typeof BLANK_RULE | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [{ data: rulesData }, { data: staffData }, { data: catsData }, { data: productsData }, { data: commissionsData }] = await Promise.all([
      supabase.from('commission_rules').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
      supabase.from('users').select('id, name, email').eq('tenant_id', tenantId).in('role', ['admin', 'moderator']),
      supabase.from('categories').select('id, name').eq('tenant_id', tenantId).order('name'),
      supabase.from('products').select('id, name').eq('tenant_id', tenantId).eq('is_active', true).order('name'),
      supabase
        .from('order_commissions')
        .select('id, final_amount, created_at, orders(invoice_number), staff:staff_id(name, email)')
        .order('created_at', { ascending: false })
        .limit(30),
    ]);
    setRules(rulesData ?? []);
    setStaff(staffData ?? []);
    setCategories(catsData ?? []);
    setProducts(productsData ?? []);
    setCommissions((commissionsData as any) ?? []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  const createRule = async () => {
    if (!newRule || !tenantId || !newRule.name.trim()) return;
    if (newRule.scope_type === 'advisor' && !newRule.advisor_id) { alert('Elegí un asesor.'); return; }
    if (newRule.scope_type === 'category' && !newRule.category_id) { alert('Elegí una categoría.'); return; }
    if (newRule.scope_type === 'product' && !newRule.product_id) { alert('Elegí un producto.'); return; }
    setSaving(true);
    const specificity = newRule.scope_type === 'advisor' ? 3 : newRule.scope_type === 'product' ? 2 : newRule.scope_type === 'category' ? 1 : 0;
    const { data, error } = await supabase
      .from('commission_rules')
      .insert({ tenant_id: tenantId, ...newRule, specificity_score: specificity })
      .select('*')
      .single();
    setSaving(false);
    if (error) {
      alert('No se pudo crear la regla: ' + error.message);
      return;
    }
    setRules((r) => [data, ...r]);
    setNewRule(null);
  };

  const toggleRule = async (rule: Rule) => {
    setRules((rs) => rs.map((r) => (r.id === rule.id ? { ...r, is_active: !r.is_active } : r)));
    await supabase.from('commission_rules').update({ is_active: !rule.is_active }).eq('id', rule.id);
  };

  const deleteRule = async (id: string) => {
    if (!confirm('¿Eliminar esta regla de comisión?')) return;
    const { error } = await supabase.from('commission_rules').delete().eq('id', id);
    if (error) {
      alert('No se pudo eliminar: ' + error.message);
      return;
    }
    setRules((r) => r.filter((x) => x.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-ink-400" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black text-ink-950 tracking-tight">Comisiones</h1>
        <p className="text-ink-500">Reglas de comisión para tu equipo de ventas (pensado para ventas de mostrador/POS).</p>
      </div>

      <div className="bg-gold-50 border border-gold-200 rounded-2xl p-4 text-xs text-gold-800">
        El cálculo corre solo cuando un pedido se marca como pagado. Las reglas <strong>por producto</strong> y{' '}
        <strong>por categoría</strong> se aplican línea por línea; lo que no cubre ninguna de esas, se comisiona con la mejor
        regla <strong>general</strong> o <strong>por asesor</strong>. Una regla con meta (opcional) solo se activa cuando el
        asesor ya vendió el monto configurado en el período elegido.
      </div>

      {/* REGLAS */}
      <section className="bg-white rounded-2xl border border-ink-100 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent size={18} className="text-gold-600" />
            <h2 className="font-serif text-xl text-ink-900">Reglas</h2>
          </div>
          {!newRule && (
            <button onClick={() => setNewRule(BLANK_RULE)} className="flex items-center gap-1.5 text-xs font-bold text-gold-700 hover:text-gold-800">
              <Plus size={14} /> Nueva regla
            </button>
          )}
        </div>

        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between gap-4 bg-cream-50 rounded-xl p-4 flex-wrap">
              <div>
                <p className="font-semibold text-ink-900 text-sm">{rule.name}</p>
                <p className="text-xs text-ink-400">
                  {SCOPE_LABELS[rule.scope_type]} · {rule.rate_type === 'percentage' ? `${rule.rate_value}%` : money(rule.rate_value)}
                  {rule.scope_type === 'advisor' && staff.find((s) => s.id === rule.advisor_id) && ` · ${staff.find((s) => s.id === rule.advisor_id)?.name}`}
                  {rule.scope_type === 'product' && products.find((p) => p.id === rule.product_id) && ` · ${products.find((p) => p.id === rule.product_id)?.name}`}
                  {rule.scope_type === 'category' && categories.find((c) => c.id === rule.category_id) && ` · ${categories.find((c) => c.id === rule.category_id)?.name}`}
                </p>
                {rule.goal_threshold != null && (
                  <p className="text-[11px] text-gold-700 font-semibold mt-0.5">
                    Solo si el asesor vendió {money(rule.goal_threshold)} o más ({GOAL_PERIOD_LABELS[rule.goal_period ?? 'month'] ?? rule.goal_period} actual)
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleRule(rule)}
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full ${rule.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-ink-100 text-ink-500'}`}
                >
                  {rule.is_active ? 'ACTIVA' : 'INACTIVA'}
                </button>
                <button onClick={() => deleteRule(rule.id)} className="p-1.5 text-ink-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {rules.length === 0 && !newRule && <p className="text-sm text-ink-400 py-4 text-center">Todavía no hay reglas de comisión.</p>}
        </div>

        {newRule && (
          <div className="bg-gold-50 border border-gold-200 rounded-xl p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                placeholder="Nombre de la regla"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                className="h-10 px-3 bg-white border border-ink-200 rounded-lg text-sm"
              />
              <select
                value={newRule.scope_type}
                onChange={(e) => setNewRule({ ...newRule, scope_type: e.target.value as Rule['scope_type'], advisor_id: null, category_id: null, product_id: null })}
                className="h-10 px-3 bg-white border border-ink-200 rounded-lg text-sm"
              >
                {Object.entries(SCOPE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </div>

            {newRule.scope_type === 'advisor' && (
              <select
                value={newRule.advisor_id ?? ''}
                onChange={(e) => setNewRule({ ...newRule, advisor_id: e.target.value || null })}
                className="w-full h-10 px-3 bg-white border border-ink-200 rounded-lg text-sm"
              >
                <option value="">Elegir asesor...</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name || s.email}</option>
                ))}
              </select>
            )}

            {newRule.scope_type === 'category' && (
              <select
                value={newRule.category_id ?? ''}
                onChange={(e) => setNewRule({ ...newRule, category_id: e.target.value || null })}
                className="w-full h-10 px-3 bg-white border border-ink-200 rounded-lg text-sm"
              >
                <option value="">Elegir categoría...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            {newRule.scope_type === 'product' && (
              <select
                value={newRule.product_id ?? ''}
                onChange={(e) => setNewRule({ ...newRule, product_id: e.target.value || null })}
                className="w-full h-10 px-3 bg-white border border-ink-200 rounded-lg text-sm"
              >
                <option value="">Elegir producto...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <select
                value={newRule.rate_type}
                onChange={(e) => setNewRule({ ...newRule, rate_type: e.target.value as Rule['rate_type'] })}
                className="h-10 px-3 bg-white border border-ink-200 rounded-lg text-sm"
              >
                <option value="percentage">Porcentaje {newRule.scope_type === 'product' || newRule.scope_type === 'category' ? 'de la línea' : 'del total'}</option>
                <option value="fixed">Monto fijo {newRule.scope_type === 'product' ? 'por unidad vendida' : 'por pedido'}</option>
              </select>
              <input
                type="number"
                step="0.01"
                placeholder={newRule.rate_type === 'percentage' ? '% (ej. 5)' : 'Monto en CRC'}
                value={newRule.rate_value}
                onChange={(e) => setNewRule({ ...newRule, rate_value: Number(e.target.value) })}
                className="h-10 px-3 bg-white border border-ink-200 rounded-lg text-sm"
              />
            </div>

            <div className="border-t border-gold-200 pt-3 space-y-2">
              <p className="text-[11px] font-bold text-ink-600 uppercase tracking-wider">Meta de venta (opcional)</p>
              <p className="text-[11px] text-ink-500">Si la ponés, esta regla solo se aplica cuando el asesor ya vendió ese monto en el período elegido.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Monto meta en CRC (dejar vacío = sin meta)"
                  value={newRule.goal_threshold ?? ''}
                  onChange={(e) => setNewRule({ ...newRule, goal_threshold: e.target.value === '' ? null : Number(e.target.value) })}
                  className="h-10 px-3 bg-white border border-ink-200 rounded-lg text-sm"
                />
                <select
                  value={newRule.goal_period}
                  onChange={(e) => setNewRule({ ...newRule, goal_period: e.target.value })}
                  disabled={newRule.goal_threshold == null}
                  className="h-10 px-3 bg-white border border-ink-200 rounded-lg text-sm disabled:opacity-40"
                >
                  <option value="day">Por día</option>
                  <option value="week">Por semana</option>
                  <option value="month">Por mes</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={createRule}
                disabled={saving || !newRule.name.trim()}
                className="text-xs font-bold bg-ink-900 text-cream-50 px-4 py-2 rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-40"
              >
                {saving ? 'Creando...' : 'Crear regla'}
              </button>
              <button onClick={() => setNewRule(null)} className="text-xs font-bold text-ink-400 px-4 py-2">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* COMISIONES RECIENTES */}
      <section className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-ink-100">
          <h2 className="font-serif text-xl text-ink-900">Comisiones recientes</h2>
        </div>
        {commissions.length === 0 ? (
          <p className="text-sm text-ink-400 py-10 text-center">Todavía no se generaron comisiones.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-[10px] font-black text-ink-400 uppercase tracking-widest bg-cream-50">
                  <th className="px-5 py-3">Asesor</th>
                  <th className="px-5 py-3">Pedido</th>
                  <th className="px-5 py-3">Monto</th>
                  <th className="px-5 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((c) => (
                  <tr key={c.id} className="border-b border-ink-50 last:border-0">
                    <td className="px-5 py-4 text-ink-700">{c.staff?.name || c.staff?.email || '—'}</td>
                    <td className="px-5 py-4 font-semibold text-ink-900">#{c.orders?.invoice_number}</td>
                    <td className="px-5 py-4 font-semibold text-gold-700">{money(c.final_amount)}</td>
                    <td className="px-5 py-4 text-ink-400 text-xs">{new Date(c.created_at).toLocaleDateString('es-CR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
