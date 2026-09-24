'use client';

import { useState } from 'react';
import { createClient } from '../lib/supabase/client';
import { LoyaltyTier, getBadgeStyles } from '../lib/loyaltyTiers';
import { CustomerRow, UserRole, ROLE_LABELS } from '../lib/customers';
import {
  X,
  Loader2,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Wallet,
  Pencil,
  Save,
  Star,
  Lock,
} from 'lucide-react';

interface CustomerProfileModalProps {
  customer: CustomerRow;
  tiers: LoyaltyTier[];
  currentUserRole: UserRole;
  initialEditMode: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function formatCRC(amount: number) {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CustomerProfileModal({
  customer,
  tiers,
  currentUserRole,
  initialEditMode,
  onClose,
  onSaved,
}: CustomerProfileModalProps) {
  const supabase = createClient();

  // Un moderador no puede editar la ficha de un admin existente —
  // ni siquiera intentarlo tiene sentido, porque la política de RLS
  // ya lo va a rechazar. Mejor no ofrecer el botón que confundir con
  // un guardado que en realidad no hizo nada.
  const canEdit = currentUserRole === 'admin' || customer.role !== 'admin';

  const [isEditing, setIsEditing] = useState(initialEditMode && canEdit);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState(customer.name || '');
  const [phone, setPhone] = useState(customer.phone || '');
  const [dni, setDni] = useState(customer.dni || '');
  const [status, setStatus] = useState(customer.status || 'active');
  const [address, setAddress] = useState(customer.default_address?.principal || '');
  const [manualTierId, setManualTierId] = useState(customer.manual_tier_id || '');
  const [role, setRole] = useState<UserRole>(customer.role);

  // Un moderador solo puede dejar a alguien como Cliente o Moderador,
  // nunca como Admin — coincide exactamente con lo que permite RLS.
  const assignableRoles: UserRole[] =
    currentUserRole === 'admin' ? ['customer', 'moderator', 'admin'] : ['customer', 'moderator'];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name,
          phone: phone || null,
          dni: dni || null,
          status,
          default_address: address ? { principal: address } : customer.default_address,
          manual_tier_id: manualTierId || null,
          role,
        })
        .eq('id', customer.id);

      if (error) throw error;

      onSaved();
    } catch (err) {
      console.error('Error guardando el perfil del cliente:', err);
      alert('No se pudo guardar. Revisá la consola.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden shrink-0 border border-zinc-200">
              {customer.image ? (
                <img src={customer.image} alt={customer.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-sm font-black text-zinc-500">{customer.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-black text-zinc-950">{customer.name}</h2>
              <p className="text-xs text-zinc-500 font-medium">{ROLE_LABELS[customer.role]}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-200 transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {!canEdit && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
              <Lock size={14} />
              Solo un admin puede editar la ficha de otro admin.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
              <div className="flex items-center gap-2 mb-1 text-zinc-400">
                <ShoppingBag size={14} />
                <p className="text-[10px] font-black uppercase tracking-wider">Pedidos</p>
              </div>
              <p className="text-xl font-black text-zinc-950">{customer.orderCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
              <div className="flex items-center gap-2 mb-1 text-zinc-400">
                <Wallet size={14} />
                <p className="text-[10px] font-black uppercase tracking-wider">Total Gastado</p>
              </div>
              <p className="text-xl font-black text-zinc-950">{formatCRC(customer.totalSpent)}</p>
            </div>
          </div>

          {/* Rol de staff */}
          <section className="space-y-2">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Rol en la Plataforma</h3>

            {isEditing ? (
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 outline-none focus:border-zinc-950"
              >
                {assignableRoles.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-bold text-zinc-700">{ROLE_LABELS[customer.role]}</span>
            )}
          </section>

          {/* Nivel de lealtad — ya no depende de si es admin o no */}
          <section className="space-y-2">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Nivel de Lealtad</h3>

            {isEditing ? (
              <div className="space-y-2">
                <select
                  value={manualTierId}
                  onChange={(e) => setManualTierId(e.target.value)}
                  className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 outline-none focus:border-zinc-950"
                >
                  <option value="">Automático (según reglas)</option>
                  {tiers.map((t) => (
                    <option key={t.id} value={t.id}>Forzar: {t.name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-400">
                  Dejalo en "Automático" para que el nivel se calcule solo según pedidos y gasto real.
                </p>
              </div>
            ) : (
              <div>
                {customer.tier ? (
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${getBadgeStyles(customer.tier.badge_color)}`}>
                    {customer.manual_tier_id && <Star size={12} fill="currentColor" />}
                    {customer.tier.name}
                  </div>
                ) : (
                  <span className="text-xs font-bold text-zinc-400">Sin nivel asignado todavía</span>
                )}
                {customer.tier && (customer.tier.discount_percentage > 0 || customer.tier.discount_fixed_amount > 0) && (
                  <p className="text-[11px] text-zinc-500 mt-2">
                    Beneficios: {customer.tier.discount_percentage > 0 && `${customer.tier.discount_percentage}% de descuento`}
                    {customer.tier.discount_percentage > 0 && customer.tier.discount_fixed_amount > 0 && ' + '}
                    {customer.tier.discount_fixed_amount > 0 && `${formatCRC(customer.tier.discount_fixed_amount)} fijo`}
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Datos de Contacto</h3>

            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Nombre</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl text-sm font-medium outline-none focus:border-zinc-950 mt-1" />
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
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Estado</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl text-sm font-bold outline-none focus:border-zinc-950 mt-1">
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 text-zinc-700"><Mail size={14} className="text-zinc-400" /> {customer.email}</p>
                {customer.phone && <p className="flex items-center gap-2 text-zinc-700"><Phone size={14} className="text-zinc-400" /> {customer.phone}</p>}
                {customer.default_address?.principal && (
                  <p className="flex items-start gap-2 text-zinc-700"><MapPin size={14} className="text-zinc-400 mt-0.5" /> {customer.default_address.principal}</p>
                )}
                {!customer.phone && !customer.default_address?.principal && (
                  <p className="text-xs text-zinc-400">Sin más datos de contacto registrados.</p>
                )}
              </div>
            )}
          </section>

        </div>

        {canEdit && (
          <div className="p-6 border-t border-zinc-200 bg-zinc-50">
            {isEditing ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 h-12 rounded-xl font-bold text-sm text-zinc-600 border border-zinc-200 hover:bg-zinc-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 h-12 bg-zinc-950 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Guardar Cambios
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full h-12 bg-zinc-950 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
              >
                <Pencil size={16} />
                Editar Cliente
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}