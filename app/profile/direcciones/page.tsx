'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { MapPinIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Address {
  nombre?: string;
  telefono?: string;
  direccion?: string;
  notas?: string;
}

export default function DireccionesPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [address, setAddress] = useState<Address>({});

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) setLoading(false);
        return;
      }
      const { data } = await supabase.from('users').select('default_address').eq('id', user.id).maybeSingle();
      if (mounted) {
        setAddress((data?.default_address as Address) ?? {});
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }
    const { error } = await supabase.from('users').update({ default_address: address }).eq('id', user.id);
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MapPinIcon className="w-5 h-5 text-gold-600" />
        <h2 className="text-xl font-black tracking-tighter text-ink-950">Mi dirección de envío</h2>
      </div>
      <p className="text-xs text-ink-500 -mt-4">
        Guardá tu dirección principal para que se precargue automáticamente cuando hagas un pedido.
      </p>

      <form onSubmit={handleSave} className="space-y-4 max-w-lg">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Nombre de contacto</label>
          <input
            value={address.nombre ?? ''}
            onChange={(e) => setAddress({ ...address, nombre: e.target.value })}
            className="w-full h-11 px-4 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Teléfono</label>
          <input
            value={address.telefono ?? ''}
            onChange={(e) => setAddress({ ...address, telefono: e.target.value })}
            placeholder="+506 8888 8888"
            className="w-full h-11 px-4 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Dirección exacta</label>
          <textarea
            rows={3}
            value={address.direccion ?? ''}
            onChange={(e) => setAddress({ ...address, direccion: e.target.value })}
            placeholder="Provincia, cantón, distrito, señas exactas..."
            className="w-full px-4 py-3 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500 resize-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Notas de entrega (opcional)</label>
          <input
            value={address.notas ?? ''}
            onChange={(e) => setAddress({ ...address, notas: e.target.value })}
            className="w-full h-11 px-4 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-ink-950 text-white px-6 h-11 rounded-xl text-xs font-bold hover:bg-gold-600 transition-colors disabled:opacity-60"
        >
          {saved ? <CheckIcon className="w-4 h-4" /> : null}
          {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar dirección'}
        </button>
      </form>
    </div>
  );
}
