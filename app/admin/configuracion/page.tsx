'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/app/providers';
import {
  Loader2, Award, Plus, Trash2, Save,
  Phone, Mail, MapPin, Clock, Instagram, Facebook, Check, MessageCircle, CreditCard, Eye, EyeOff,
} from 'lucide-react';
import type { WhatsAppConfig } from '@/lib/blockBackground';

type PaymentConfig = { provider?: 'manual' | 'onvopay' };

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
  whatsapp_config: WhatsAppConfig;
  payment_config: PaymentConfig;
};

type PaymentProvider = {
  onvopay_public_key: string;
  onvopay_secret_key: string;
  onvopay_mode: 'test' | 'live';
};

const BLANK_PAYMENT_PROVIDER: PaymentProvider = { onvopay_public_key: '', onvopay_secret_key: '', onvopay_mode: 'test' };

const TABS = [
  { id: 'contacto', label: 'Contacto y redes', icon: Phone },
  { id: 'fidelidad', label: 'Niveles de fidelidad', icon: Award },
  { id: 'pagos', label: 'Pagos', icon: CreditCard },
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
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>(BLANK_PAYMENT_PROVIDER);
  const [hasStoredSecret, setHasStoredSecret] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentSaved, setPaymentSaved] = useState(false);
  // Feedback visual por fila: antes el guardado (onBlur) pasaba en
  // silencio — SÍ se guardaba en la base de datos, pero como no se
  // veía nada, parecía que no hacía nada. id -> 'saving' | 'saved'.
  const [tierRowStatus, setTierRowStatus] = useState<Record<string, 'saving' | 'saved'>>({});
  const [themeSaved, setThemeSaved] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [{ data: themeData }, { data: tiersData }, { data: providerData }] = await Promise.all([
      supabase.from('tenant_theme').select('*').eq('tenant_id', tenantId).maybeSingle(),
      supabase.from('loyalty_tiers').select('*').eq('tenant_id', tenantId).order('priority'),
      supabase.from('payment_provider_config').select('onvopay_public_key, onvopay_secret_key, onvopay_mode').eq('tenant_id', tenantId).maybeSingle(),
    ]);
    setTheme(
      themeData
        ? { ...themeData, payment_config: (themeData.payment_config as PaymentConfig) ?? {} }
        : {
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
            whatsapp_config: {},
            payment_config: {},
          }
    );
    setTiers(tiersData ?? []);
    // La llave secreta nunca se vuelve a mostrar en texto plano una vez
    // guardada — solo indicamos que YA hay una guardada (hasStoredSecret)
    // y dejamos el campo vacío; si el admin escribe algo nuevo, se
    // reemplaza, y si lo deja vacío, se conserva la que ya había.
    setPaymentProvider({
      onvopay_public_key: providerData?.onvopay_public_key ?? '',
      onvopay_secret_key: '',
      onvopay_mode: (providerData?.onvopay_mode as 'test' | 'live') ?? 'test',
    });
    setHasStoredSecret(Boolean(providerData?.onvopay_secret_key));
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

  const savePaymentConfig = async (nextPaymentConfig: PaymentConfig) => {
    if (!theme || !tenantId) return;
    const next = { ...theme, payment_config: nextPaymentConfig };
    setTheme(next);
    await supabase.from('tenant_theme').upsert({ tenant_id: tenantId, ...next });
  };

  const savePaymentProvider = async () => {
    if (!tenantId) return;
    setSavingPayment(true);
    setPaymentSaved(false);
    const patch: Record<string, any> = {
      tenant_id: tenantId,
      onvopay_public_key: paymentProvider.onvopay_public_key || null,
      onvopay_mode: paymentProvider.onvopay_mode,
    };
    // Solo mandamos la llave secreta si el admin escribió una nueva —
    // así un guardado sin tocar ese campo no borra la que ya había.
    if (paymentProvider.onvopay_secret_key.trim()) {
      patch.onvopay_secret_key = paymentProvider.onvopay_secret_key.trim();
    }
    const { error } = await supabase.from('payment_provider_config').upsert(patch);
    setSavingPayment(false);
    if (error) {
      alert('No se pudo guardar la pasarela de pago: ' + error.message);
      return;
    }
    if (paymentProvider.onvopay_secret_key.trim()) {
      setHasStoredSecret(true);
      setPaymentProvider((p) => ({ ...p, onvopay_secret_key: '' }));
    }
    setPaymentSaved(true);
    setTimeout(() => setPaymentSaved(false), 2500);
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

        {/* WIDGET DE WHATSAPP — el botón flotante que ven los clientes en
            toda la tienda: de qué lado va, su color, y qué dice. */}
        <div className="pt-2 border-t border-ink-100 space-y-4">
          <div className="flex items-center gap-2">
            <MessageCircle size={16} className="text-emerald-600" />
            <div>
              <p className="text-xs font-black text-ink-900 uppercase tracking-wider">Widget de WhatsApp</p>
              <p className="text-[11px] text-ink-500 mt-0.5">El botón flotante de chat que ven tus clientes en toda la tienda.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Posición</label>
              <div className="flex gap-2">
                {(['right', 'left'] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setTheme({ ...theme, whatsapp_config: { ...theme.whatsapp_config, position: pos } })}
                    className={`flex-1 h-11 rounded-xl text-xs font-bold border transition-colors ${
                      (theme.whatsapp_config?.position ?? 'right') === pos
                        ? 'bg-ink-950 text-cream-50 border-ink-950'
                        : 'border-ink-200 text-ink-600 hover:border-ink-400'
                    }`}
                  >
                    {pos === 'right' ? 'Derecha' : 'Izquierda'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Color (opcional)</label>
              <div className="flex items-center gap-2 h-11">
                <input
                  type="color"
                  value={theme.whatsapp_config?.color || '#10b981'}
                  onChange={(e) => setTheme({ ...theme, whatsapp_config: { ...theme.whatsapp_config, color: e.target.value } })}
                  className="w-11 h-11 rounded-xl border border-ink-200 cursor-pointer shrink-0"
                />
                {theme.whatsapp_config?.color && (
                  <button
                    onClick={() => setTheme({ ...theme, whatsapp_config: { ...theme.whatsapp_config, color: null } })}
                    className="text-[11px] font-bold text-ink-500 hover:text-ink-900 underline"
                  >
                    Quitar y usar el verde de siempre
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Texto del botón (móvil)</label>
              <input
                value={theme.whatsapp_config?.button_text ?? ''}
                onChange={(e) => setTheme({ ...theme, whatsapp_config: { ...theme.whatsapp_config, button_text: e.target.value || null } })}
                placeholder="¿Dudas? Conversemos en vivo"
                className="w-full h-11 px-4 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Mensaje de saludo</label>
              <input
                value={theme.whatsapp_config?.greeting ?? ''}
                onChange={(e) => setTheme({ ...theme, whatsapp_config: { ...theme.whatsapp_config, greeting: e.target.value || null } })}
                placeholder="Estoy listo para ayudarte. Escribe tu consulta abajo."
                className="w-full h-11 px-4 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
              />
            </div>
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

      {/* PAGOS — manual (WhatsApp/SINPE, el de siempre) u ONVOPay, la
          pasarela costarricense elegida tras comparar comisiones con
          PayPal/Stripe (ver la sección de pendientes del plan). */}
      <section className={`bg-white rounded-2xl border border-ink-100 p-6 sm:p-8 space-y-6 ${tab !== 'pagos' ? 'hidden' : ''}`}>
        <div className="flex items-center gap-2">
          <CreditCard size={18} className="text-gold-600" />
          <h2 className="font-serif text-xl text-ink-900">Pagos</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <button
            onClick={() => savePaymentConfig({ ...theme.payment_config, provider: 'manual' })}
            className={`text-left p-4 rounded-xl border-2 transition-colors ${
              (theme.payment_config.provider ?? 'manual') === 'manual' ? 'border-ink-900 bg-ink-950 text-cream-50' : 'border-ink-100 hover:border-ink-300'
            }`}
          >
            <p className="text-sm font-bold">Manual (WhatsApp/SINPE)</p>
            <p className={`text-[11px] mt-1 leading-snug ${(theme.payment_config.provider ?? 'manual') === 'manual' ? 'text-cream-200' : 'text-ink-500'}`}>
              El de siempre: el pedido se crea y coordinás el pago por WhatsApp. No necesita nada más.
            </p>
          </button>
          <button
            onClick={() => savePaymentConfig({ ...theme.payment_config, provider: 'onvopay' })}
            className={`text-left p-4 rounded-xl border-2 transition-colors ${
              theme.payment_config.provider === 'onvopay' ? 'border-ink-900 bg-ink-950 text-cream-50' : 'border-ink-100 hover:border-ink-300'
            }`}
          >
            <p className="text-sm font-bold">ONVOPay</p>
            <p className={`text-[11px] mt-1 leading-snug ${theme.payment_config.provider === 'onvopay' ? 'text-cream-200' : 'text-ink-500'}`}>
              Tarjeta y SINPE Móvil dentro del checkout, sin salir a WhatsApp. Necesita una cuenta gratuita en ONVOPay.
            </p>
          </button>
        </div>

        {theme.payment_config.provider === 'onvopay' && (
          <div className="pt-2 border-t border-ink-100 space-y-4">
            <div className="bg-gold-50 border border-gold-200 rounded-2xl p-4 text-xs text-gold-800 space-y-1.5">
              <p>
                1. Creá una cuenta gratis en{' '}
                <a href="https://onvopay.com" target="_blank" rel="noopener noreferrer" className="font-bold underline">
                  onvopay.com
                </a>{' '}
                (no cuesta nada abrirla — ONVOPay solo cobra comisión por cada venta que sí se cobre, hoy 1.5% con SINPE Móvil o 3.9% + $0.35 con tarjeta).
              </p>
              <p>2. Copiá tus llaves de API (Desarrolladores → API keys) y pegalas abajo.</p>
              <p>3. Usá llaves "test" primero para probar un pago de prueba antes de pasar a "live".</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Llave pública (public key)</label>
                <input
                  value={paymentProvider.onvopay_public_key}
                  onChange={(e) => setPaymentProvider((p) => ({ ...p, onvopay_public_key: e.target.value }))}
                  placeholder="onvo_test_pk_..."
                  className="w-full h-11 px-4 bg-cream-50 border border-ink-200 rounded-xl text-sm font-mono focus:outline-none focus:border-gold-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Modo</label>
                <div className="flex gap-2">
                  {(['test', 'live'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentProvider((p) => ({ ...p, onvopay_mode: m }))}
                      className={`flex-1 h-11 rounded-xl text-xs font-bold border transition-colors ${
                        paymentProvider.onvopay_mode === m ? 'bg-ink-950 text-cream-50 border-ink-950' : 'border-ink-200 text-ink-600 hover:border-ink-400'
                      }`}
                    >
                      {m === 'test' ? 'Prueba (test)' : 'Real (live)'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">
                  Llave secreta (secret key) {hasStoredSecret && <span className="text-emerald-600 normal-case">— ya hay una guardada</span>}
                </label>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={paymentProvider.onvopay_secret_key}
                    onChange={(e) => setPaymentProvider((p) => ({ ...p, onvopay_secret_key: e.target.value }))}
                    placeholder={hasStoredSecret ? 'Dejar vacío para conservar la actual' : 'onvo_test_sk_...'}
                    className="w-full h-11 pl-4 pr-11 bg-cream-50 border border-ink-200 rounded-xl text-sm font-mono focus:outline-none focus:border-gold-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                  >
                    {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-[10px] text-ink-400 pl-1">Nunca se muestra de nuevo una vez guardada — solo se puede reemplazar.</p>
              </div>
            </div>

            <button
              onClick={savePaymentProvider}
              disabled={savingPayment}
              className="flex items-center gap-2 bg-ink-900 text-cream-50 h-11 px-6 rounded-xl font-bold hover:bg-gold-600 transition-colors disabled:opacity-60"
            >
              {savingPayment ? <Loader2 size={16} className="animate-spin" /> : paymentSaved ? <Check size={16} /> : <Save size={16} />}
              {paymentSaved ? 'Guardado' : 'Guardar llaves de ONVOPay'}
            </button>

            <p className="text-[11px] text-ink-400">
              Configurá también la URL de webhook en tu panel de ONVOPay apuntando a{' '}
              <code className="bg-cream-100 px-1.5 py-0.5 rounded">tu-dominio.com/api/webhooks/onvopay</code> para que los pedidos se marquen
              pagados automáticamente.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

