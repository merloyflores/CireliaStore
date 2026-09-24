'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/app/providers';
import {
  Loader2, Award, Plus, Trash2, Save,
  Phone, Mail, MapPin, Clock, Instagram, Facebook, Check,
} from 'lucide-react';

type Theme = {
  color_primary: string;
  color_secondary: string;
  color_accent: string;
  color_bg: string;
  color_text: string;
  font: string;
  logo_url: string | null;
  banner_url: string | null;
  whatsapp_number: string;
  contact_email: string;
  address: string | null;
  business_hours: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
};

const TABS = [
  { id: 'contacto', label: 'Contacto y redes', icon: Phone },
  { id: 'fidelidad', label: 'Niveles de fidelidad', icon: Award },
] as const;

type Tier = {
  id: string;
  name: string;
  min_orders: number;
  min_spent: number;
  discount_percentage: number;
  badge_color: string;
  priority: number;
  is_active: boolean;
};

const BLANK_TIER: Omit<Tier, 'id'> = {
  name: '',
  min_orders: 0,
  min_spent: 0,
  discount_percentage: 0,
  badge_color: 'gold',
  priority: 0,
  is_active: true,
};

export default function ConfiguracionPage() {
  const supabase = createClient();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  const [theme, setTheme] = useState<Theme | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('contacto');
  const [savingTheme, setSavingTheme] = useState(false);
  const [newTier, setNewTier] = useState<Omit<Tier, 'id'> | null>(null);
  const [savingTier, setSavingTier] = useState(false);
  // Feedback visual por fila: antes el guardado (onBlur) pasaba en
  // silencio — SÍ se guardaba en la base de datos, pero como no se
  // veía nada, parecía que no hacía nada. id -> 'saving' | 'saved'.
  const [tierRowStatus, setTierRowStatus] = useState<Record<string, 'saving' | 'saved'>>({});
  const [themeSaved, setThemeSaved] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [{ data: themeData }, { data: tiersData }] = await Promise.all([
      supabase.from('tenant_theme').select('*').eq('tenant_id', tenantId).maybeSingle(),
      supabase.from('loyalty_tiers').select('*').eq('tenant_id', tenantId).order('priority'),
    ]);
    setTheme(
      themeData ?? {
        color_primary: '#a9813f',
        color_secondary: '#3d6b66',
        color_accent: '#a9813f',
        color_bg: '#f6f3ec',
        color_text: '#211d16',
        font: 'Inter',
        logo_url: null,
        banner_url: null,
        whatsapp_number: '',
        contact_email: '',
        address: null,
        business_hours: null,
        instagram_url: null,
        facebook_url: null,
        tiktok_url: null,
      }
    );
    setTiers(tiersData ?? []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveTheme = async () => {
    if (!theme || !tenantId) return;
    setSavingTheme(true);
    setThemeSaved(false);
    const { error } = await supabase.from('tenant_theme').upsert({ tenant_id: tenantId, ...theme });
    setSavingTheme(false);
    if (error) {
      alert('No se pudo guardar el tema: ' + error.message);
      return;
    }
    setThemeSaved(true);
    setTimeout(() => setThemeSaved(false), 2500);
  };

  const addTier = async () => {
    if (!newTier || !tenantId) return;
    setSavingTier(true);
    const { data, error } = await supabase.from('loyalty_tiers').insert({ tenant_id: tenantId, ...newTier }).select('*').single();
    setSavingTier(false);
    if (error) {
      alert('No se pudo crear el nivel: ' + error.message);
      return;
    }
    setTiers((t) => [...t, data].sort((a, b) => a.priority - b.priority));
    setNewTier(null);
  };

  const updateTier = async (tier: Tier) => {
    setTierRowStatus((s) => ({ ...s, [tier.id]: 'saving' }));
    const { error } = await supabase
      .from('loyalty_tiers')
      .update({
        name: tier.name,
        min_orders: tier.min_orders,
        min_spent: tier.min_spent,
        discount_percentage: tier.discount_percentage,
        badge_color: tier.badge_color,
        priority: tier.priority,
        is_active: tier.is_active,
      })
      .eq('id', tier.id);
    if (error) {
      alert('No se pudo actualizar: ' + error.message);
      setTierRowStatus((s) => {
        const next = { ...s };
        delete next[tier.id];
        return next;
      });
      return;
    }
    setTierRowStatus((s) => ({ ...s, [tier.id]: 'saved' }));
    setTimeout(() => {
      setTierRowStatus((s) => {
        const next = { ...s };
        if (next[tier.id] === 'saved') delete next[tier.id];
        return next;
      });
    }, 1800);
  };

  const deleteTier = async (id: string) => {
    if (!confirm('¿Eliminar este nivel de fidelidad?')) return;
    const { error } = await supabase.from('loyalty_tiers').delete().eq('id', id);
    if (error) {
      alert('No se pudo eliminar: ' + error.message);
      return;
    }
    setTiers((t) => t.filter((x) => x.id !== id));
  };

  if (loading || !theme) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-ink-400" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black text-ink-950 tracking-tight">Configuración</h1>
        <p className="text-ink-500">
          Contacto, redes y niveles de fidelidad. ¿Buscás colores, tipografía, logo o el hero de tu tienda? Eso se
          mudó a <a href="/admin/inicio" className="text-gold-700 font-bold hover:underline">Diseño</a>.
        </p>
      </div>

      {/* TABS */}
      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 -mx-1 px-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                tab === t.id ? 'bg-ink-950 text-cream-50' : 'bg-white border border-ink-200 text-ink-600 hover:border-gold-400'
              }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* CONTACTO Y REDES */}
      <section className={`bg-white rounded-2xl border border-ink-100 p-6 sm:p-8 space-y-6 ${tab !== 'contacto' ? 'hidden' : ''}`}>
        <div className="flex items-center gap-2">
          <Phone size={18} className="text-gold-600" />
          <h2 className="font-serif text-xl text-ink-900">Contacto y redes</h2>
        </div>
        <p className="text-xs text-ink-500 -mt-4">
          Estos datos alimentan el widget de WhatsApp, el pie de página y los botones de contacto en toda la tienda.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
              <Phone size={11} /> WhatsApp (con código de país, sin +)
            </label>
            <input
              value={theme.whatsapp_number}
              onChange={(e) => setTheme({ ...theme, whatsapp_number: e.target.value })}
              placeholder="50672961548"
              className="w-full h-11 px-4 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
              <Mail size={11} /> Correo de contacto
            </label>
            <input
              type="email"
              value={theme.contact_email}
              onChange={(e) => setTheme({ ...theme, contact_email: e.target.value })}
              placeholder="info@tutienda.com"
              className="w-full h-11 px-4 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
              <MapPin size={11} /> Dirección
            </label>
            <input
              value={theme.address ?? ''}
              onChange={(e) => setTheme({ ...theme, address: e.target.value || null })}
              placeholder="San José, Costa Rica"
              className="w-full h-11 px-4 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
              <Clock size={11} /> Horario de atención
            </label>
            <input
              value={theme.business_hours ?? ''}
              onChange={(e) => setTheme({ ...theme, business_hours: e.target.value || null })}
              placeholder="Lun-Vie 9am-6pm"
              className="w-full h-11 px-4 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
              <Instagram size={11} /> Instagram
            </label>
            <input
              value={theme.instagram_url ?? ''}
              onChange={(e) => setTheme({ ...theme, instagram_url: e.target.value || null })}
              placeholder="https://instagram.com/tutienda"
              className="w-full h-11 px-4 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
              <Facebook size={11} /> Facebook
            </label>
            <input
              value={theme.facebook_url ?? ''}
              onChange={(e) => setTheme({ ...theme, facebook_url: e.target.value || null })}
              placeholder="https://facebook.com/tutienda"
              className="w-full h-11 px-4 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">TikTok</label>
            <input
              value={theme.tiktok_url ?? ''}
              onChange={(e) => setTheme({ ...theme, tiktok_url: e.target.value || null })}
              placeholder="https://tiktok.com/@tutienda"
              className="w-full h-11 px-4 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
            />
          </div>
        </div>

        <button
          onClick={saveTheme}
          disabled={savingTheme}
          className="flex items-center gap-2 bg-ink-900 text-cream-50 h-11 px-6 rounded-xl font-bold hover:bg-gold-600 transition-colors disabled:opacity-60"
        >
          {savingTheme ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Guardar contacto
        </button>
      </section>

      {/* NIVELES DE FIDELIDAD */}
      <section className={`bg-white rounded-2xl border border-ink-100 p-6 sm:p-8 space-y-5 ${tab !== 'fidelidad' ? 'hidden' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-gold-600" />
            <h2 className="font-serif text-xl text-ink-900">Niveles de fidelidad</h2>
          </div>
          {!newTier && (
            <button
              onClick={() => setNewTier(BLANK_TIER)}
              className="flex items-center gap-1.5 text-xs font-bold text-gold-700 hover:text-gold-800"
            >
              <Plus size={14} /> Nuevo nivel
            </button>
          )}
        </div>
        <p className="text-[11px] text-ink-400 -mt-3">
          Cada campo se guarda solo al salir de él (sin necesidad de botón) — vas a ver un check verde confirmando.
        </p>

        <div className="space-y-3">
          {tiers.map((tier) => (
            <div key={tier.id} className={`bg-cream-50 rounded-xl p-3 border space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:gap-3 transition-colors ${
              tierRowStatus[tier.id] === 'saved' ? 'border-emerald-300' : 'border-ink-100'
            }`}>
              <input
                value={tier.name}
                onChange={(e) => setTiers((ts) => ts.map((t) => (t.id === tier.id ? { ...t, name: e.target.value } : t)))}
                onBlur={() => updateTier(tier)}
                className="w-full sm:flex-1 h-9 px-3 bg-white border border-ink-200 rounded-lg text-sm font-semibold"
              />
              <div className="grid grid-cols-3 gap-2 sm:flex sm:w-auto sm:shrink-0">
                <label className="space-y-0.5">
                  <span className="block text-[9px] font-bold text-ink-400 uppercase tracking-wider">Pedidos</span>
                  <input
                    type="number"
                    value={tier.min_orders}
                    onChange={(e) => setTiers((ts) => ts.map((t) => (t.id === tier.id ? { ...t, min_orders: Number(e.target.value) } : t)))}
                    onBlur={() => updateTier(tier)}
                    className="w-full sm:w-20 h-9 px-2 bg-white border border-ink-200 rounded-lg text-sm"
                  />
                </label>
                <label className="space-y-0.5">
                  <span className="block text-[9px] font-bold text-ink-400 uppercase tracking-wider">Gasto ₡</span>
                  <input
                    type="number"
                    value={tier.min_spent}
                    onChange={(e) => setTiers((ts) => ts.map((t) => (t.id === tier.id ? { ...t, min_spent: Number(e.target.value) } : t)))}
                    onBlur={() => updateTier(tier)}
                    className="w-full sm:w-24 h-9 px-2 bg-white border border-ink-200 rounded-lg text-sm"
                  />
                </label>
                <label className="space-y-0.5">
                  <span className="block text-[9px] font-bold text-ink-400 uppercase tracking-wider">Desc %</span>
                  <input
                    type="number"
                    value={tier.discount_percentage}
                    onChange={(e) => setTiers((ts) => ts.map((t) => (t.id === tier.id ? { ...t, discount_percentage: Number(e.target.value) } : t)))}
                    onBlur={() => updateTier(tier)}
                    className="w-full sm:w-20 h-9 px-2 bg-white border border-ink-200 rounded-lg text-sm"
                  />
                </label>
              </div>
              <div className="flex items-center gap-1 self-end sm:self-auto shrink-0 w-16 justify-end">
                {tierRowStatus[tier.id] === 'saving' && <Loader2 size={13} className="animate-spin text-ink-400" />}
                {tierRowStatus[tier.id] === 'saved' && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                    <Check size={13} /> Listo
                  </span>
                )}
                <button onClick={() => deleteTier(tier.id)} className="p-2 text-ink-400 hover:text-red-500">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}

          {newTier && (
            <div className="bg-gold-50 rounded-xl p-3 border border-gold-200 space-y-2.5">
              <input
                autoFocus
                placeholder="Nombre del nivel"
                value={newTier.name}
                onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
                className="w-full h-9 px-3 bg-white border border-ink-200 rounded-lg text-sm"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  placeholder="Pedidos mín."
                  value={newTier.min_orders}
                  onChange={(e) => setNewTier({ ...newTier, min_orders: Number(e.target.value) })}
                  className="h-9 px-2 bg-white border border-ink-200 rounded-lg text-sm w-full"
                />
                <input
                  type="number"
                  placeholder="Gasto mín."
                  value={newTier.min_spent}
                  onChange={(e) => setNewTier({ ...newTier, min_spent: Number(e.target.value) })}
                  className="h-9 px-2 bg-white border border-ink-200 rounded-lg text-sm w-full"
                />
                <input
                  type="number"
                  placeholder="% desc."
                  value={newTier.discount_percentage}
                  onChange={(e) => setNewTier({ ...newTier, discount_percentage: Number(e.target.value) })}
                  className="h-9 px-2 bg-white border border-ink-200 rounded-lg text-sm w-full"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setNewTier(null)} className="text-xs font-bold text-ink-500 px-3 py-1.5">
                  Cancelar
                </button>
                <button
                  onClick={addTier}
                  disabled={savingTier || !newTier.name}
                  className="flex items-center gap-1.5 text-xs font-bold text-cream-50 bg-ink-900 disabled:opacity-40 px-4 py-1.5 rounded-lg"
                >
                  {savingTier ? <Loader2 size={14} className="animate-spin" /> : 'Crear nivel'}
                </button>
              </div>
            </div>
          )}

          {tiers.length === 0 && !newTier && (
            <p className="text-sm text-ink-400 py-6 text-center">Todavía no hay niveles de fidelidad configurados.</p>
          )}
        </div>
      </section>
    </div>
  );
}

