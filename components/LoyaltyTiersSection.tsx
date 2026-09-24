'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../lib/supabase/client';
import { LoyaltyTier, BADGE_COLOR_OPTIONS, getBadgeStyles } from '../lib/loyaltyTiers';
import { Plus, Pencil, Trash2, X, Loader2, Save, Award } from 'lucide-react';

const emptyForm = {
  name: '',
  min_orders: 0,
  min_spent: 0,
  discount_percentage: 0,
  discount_fixed_amount: 0,
  badge_color: 'zinc',
  priority: 0,
  is_active: true,
};

function formatCRC(amount: number) {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(amount);
}

export default function LoyaltyTiersSection() {
  const supabase = createClient();

  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [loading, setLoading] = useState(true);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('loyalty_tiers').select('*').order('priority', { ascending: false });
    if (error) {
      console.error('Error cargando niveles:', error);
    } else {
      setTiers((data || []) as LoyaltyTier[]);
    }
    setLoading(false);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsPanelOpen(true);
  };

  const openEdit = (tier: LoyaltyTier) => {
    setEditingId(tier.id);
    setForm({
      name: tier.name,
      min_orders: tier.min_orders,
      min_spent: tier.min_spent,
      discount_percentage: tier.discount_percentage,
      discount_fixed_amount: tier.discount_fixed_amount,
      badge_color: tier.badge_color,
      priority: tier.priority,
      is_active: tier.is_active,
    });
    setIsPanelOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setIsSaving(true);

    try {
      if (editingId) {
        const { error } = await supabase.from('loyalty_tiers').update(form).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('loyalty_tiers').insert(form);
        if (error) throw error;
      }

      setIsPanelOpen(false);
      fetchTiers();
    } catch (err) {
      console.error('Error guardando el nivel:', err);
      alert('No se pudo guardar el nivel. Revisá la consola.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (tier: LoyaltyTier) => {
    const confirmed = confirm(
      `¿Borrar el nivel "${tier.name}"? Los clientes que calificaban acá van a recalcularse al nivel que les corresponda (o quedarán sin nivel).`
    );
    if (!confirmed) return;

    const { error } = await supabase.from('loyalty_tiers').delete().eq('id', tier.id);
    if (error) {
      console.error('Error borrando el nivel:', error);
      alert('No se pudo borrar. Revisá la consola.');
      return;
    }
    fetchTiers();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-zinc-950">Niveles de Lealtad</h3>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            Un cliente califica a un nivel cuando cumple <strong>ambas</strong> condiciones: mínimo de pedidos Y mínimo gastado.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-zinc-950 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all"
        >
          <Plus size={16} />
          Nuevo Nivel
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-zinc-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : tiers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-zinc-200 rounded-2xl">
          <Award size={32} className="text-zinc-300 mb-2" />
          <p className="text-sm font-bold text-zinc-600">Todavía no definiste ningún nivel.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tiers.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4 border border-zinc-100 rounded-2xl hover:border-zinc-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${getBadgeStyles(t.badge_color)}`}>
                  {t.name}
                </div>
                {!t.is_active && <span className="text-[10px] font-bold text-zinc-400 uppercase">Inactivo</span>}
              </div>

              <div className="hidden sm:flex items-center gap-6 text-xs text-zinc-500 font-medium">
                <span>{t.min_orders}+ pedidos</span>
                <span>{formatCRC(t.min_spent)}+ gastado</span>
                <span>
                  {t.discount_percentage > 0 && `${t.discount_percentage}% desc.`}
                  {t.discount_percentage > 0 && t.discount_fixed_amount > 0 && ' + '}
                  {t.discount_fixed_amount > 0 && `${formatCRC(t.discount_fixed_amount)} fijo`}
                  {t.discount_percentage === 0 && t.discount_fixed_amount === 0 && 'Sin beneficio'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(t)} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(t)} className="p-2 hover:bg-red-50 rounded-lg text-zinc-500 hover:text-red-600 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isPanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={() => setIsPanelOpen(false)} />

          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <h2 className="text-xl font-black text-zinc-950">{editingId ? 'Editar Nivel' : 'Nuevo Nivel'}</h2>
              <button onClick={() => setIsPanelOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-200 transition-colors">
                <X size={20} className="text-zinc-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Nombre del nivel *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej. VIP, Regular, Nuevo..."
                  className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl text-sm font-medium outline-none focus:border-zinc-950 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Mínimo de pedidos</label>
                  <input
                    type="number"
                    value={form.min_orders}
                    onChange={(e) => setForm({ ...form, min_orders: Number(e.target.value) })}
                    className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl text-sm font-medium outline-none focus:border-zinc-950 mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Mínimo gastado (₡)</label>
                  <input
                    type="number"
                    value={form.min_spent}
                    onChange={(e) => setForm({ ...form, min_spent: Number(e.target.value) })}
                    className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl text-sm font-medium outline-none focus:border-zinc-950 mt-1"
                  />
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 -mt-2">
                Un cliente necesita <strong>{form.min_orders} pedidos Y {formatCRC(form.min_spent)}</strong> gastado para calificar.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Descuento (%)</label>
                  <input
                    type="number"
                    value={form.discount_percentage}
                    onChange={(e) => setForm({ ...form, discount_percentage: Number(e.target.value) })}
                    className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl text-sm font-medium outline-none focus:border-zinc-950 mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Descuento fijo (₡)</label>
                  <input
                    type="number"
                    value={form.discount_fixed_amount}
                    onChange={(e) => setForm({ ...form, discount_fixed_amount: Number(e.target.value) })}
                    className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl text-sm font-medium outline-none focus:border-zinc-950 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Color de la etiqueta</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {BADGE_COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setForm({ ...form, badge_color: color })}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${getBadgeStyles(color)} ${form.badge_color === color ? 'ring-2 ring-offset-1 ring-zinc-950' : ''}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                  Prioridad (mayor número gana si califica para varios niveles)
                </label>
                <input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                  className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl text-sm font-medium outline-none focus:border-zinc-950 mt-1"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300"
                />
                <span className="text-xs font-bold text-zinc-700">Nivel activo</span>
              </label>
            </div>

            <div className="p-6 border-t border-zinc-200 bg-zinc-50">
              <button
                onClick={handleSave}
                disabled={!form.name.trim() || isSaving}
                className="w-full h-12 bg-zinc-950 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editingId ? 'Guardar Cambios' : 'Crear Nivel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}