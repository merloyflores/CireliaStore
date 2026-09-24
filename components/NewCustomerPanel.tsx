'use client';

import { useState } from 'react';
import { createClient } from '../lib/supabase/client';
import { LoyaltyTier } from '../lib/loyaltyTiers';
import { X, Loader2, UserPlus } from 'lucide-react';

interface NewCustomerPanelProps {
  isOpen: boolean;
  tiers: LoyaltyTier[];
  onClose: () => void;
  onCreated: () => void;
}

export default function NewCustomerPanel({ isOpen, tiers, onClose, onCreated }: NewCustomerPanelProps) {
  const supabase = createClient();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dni, setDni] = useState('');
  const [address, setAddress] = useState('');
  const [manualTierId, setManualTierId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setDni('');
    setAddress('');
    setManualTierId('');
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      // Cliente sin cuenta de auth (walk-in) — no le mandamos 'id', que
      // Postgres lo genere solo con gen_random_uuid(). Mismo patrón que
      // usa el flujo de "Nueva Venta" al crear clientes desde el POS.
      const { error } = await supabase.from('users').insert({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        dni: dni.trim() || null,
        default_address: address.trim() ? { principal: address.trim() } : null,
        manual_tier_id: manualTierId || null,
        role: 'customer',
        status: 'active',
      });

      if (error) throw error;

      resetForm();
      onCreated();
    } catch (err) {
      console.error('Error creando el cliente:', err);
      alert('No se pudo crear el cliente. Revisá la consola.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
          <div>
            <h2 className="text-xl font-black text-zinc-950">Nuevo Cliente</h2>
            <p className="text-xs text-zinc-500 font-medium">Alta manual desde el panel de admin</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-200 transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Nombre completo *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl text-sm font-medium outline-none focus:border-zinc-950 mt-1" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl text-sm font-medium outline-none focus:border-zinc-950 mt-1" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Teléfono</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl text-sm font-medium outline-none focus:border-zinc-950 mt-1" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Cédula / DNI</label>
            <input value={dni} onChange={(e) => setDni(e.target.value)} className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl text-sm font-medium outline-none focus:border-zinc-950 mt-1" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Dirección</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="w-full px-4 py-3 bg-zinc-50/50 border border-zinc-200 rounded-xl text-sm font-medium outline-none focus:border-zinc-950 mt-1 resize-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Nivel de lealtad</label>
            <select value={manualTierId} onChange={(e) => setManualTierId(e.target.value)} className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 outline-none focus:border-zinc-950 mt-1">
              <option value="">Automático (según reglas)</option>
              {tiers.map((t) => (
                <option key={t.id} value={t.id}>Forzar: {t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-200 bg-zinc-50">
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting}
            className="w-full h-12 bg-zinc-950 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            Crear Cliente
          </button>
        </div>

      </div>
    </div>
  );
}