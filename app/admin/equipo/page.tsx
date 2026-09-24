'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/app/providers';
import { Loader2, UserCog, Search, Shield, Plus, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { PERMISSION_KEYS } from '@/lib/permissions';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  moderator: 'Moderador',
  delivery: 'Repartidor',
  customer: 'Cliente',
};

type StaffMember = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  role_id: string | null;
  reports_to: string | null;
};

type StaffRole = { id: string; name: string; permissions: Record<string, boolean> };

export default function EquipoPage() {
  const supabase = createClient();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<StaffMember | null | 'not_found'>(null);
  const [searching, setSearching] = useState(false);

  const [newRoleName, setNewRoleName] = useState('');
  const [newRolePerms, setNewRolePerms] = useState<Record<string, boolean>>({});
  const [creatingRole, setCreatingRole] = useState(false);
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [{ data: staffData }, { data: rolesData }] = await Promise.all([
      supabase
        .from('users')
        .select('id, name, email, role, role_id, reports_to')
        .eq('tenant_id', tenantId)
        .in('role', ['admin', 'moderator', 'delivery'])
        .order('name'),
      supabase.from('staff_roles').select('id, name, permissions').eq('tenant_id', tenantId).order('name'),
    ]);
    setStaff(staffData ?? []);
    setRoles(rolesData ?? []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = async () => {
    if (!searchEmail.trim() || !tenantId) return;
    setSearching(true);
    const { data } = await supabase
      .from('users')
      .select('id, name, email, role, role_id, reports_to')
      .eq('tenant_id', tenantId)
      .ilike('email', searchEmail.trim())
      .maybeSingle();
    setSearchResult(data ?? 'not_found');
    setSearching(false);
  };

  const promote = async (userId: string, role: string) => {
    const { error } = await supabase.from('users').update({ role }).eq('id', userId);
    if (error) {
      alert('No se pudo promover: ' + error.message);
      return;
    }
    setSearchResult(null);
    setSearchEmail('');
    load();
  };

  const updateMember = async (id: string, patch: Partial<StaffMember>) => {
    setStaff((s) => s.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    const { error } = await supabase.from('users').update(patch).eq('id', id);
    if (error) alert('No se pudo actualizar: ' + error.message);
  };

  const removeFromStaff = async (id: string) => {
    if (!confirm('¿Quitar a esta persona del equipo? Vuelve a rol "cliente".')) return;
    await updateMember(id, { role: 'customer', role_id: null });
    load();
  };

  const createRole = async () => {
    if (!newRoleName.trim() || !tenantId) return;
    setCreatingRole(true);
    const { data, error } = await supabase
      .from('staff_roles')
      .insert({ tenant_id: tenantId, name: newRoleName.trim(), permissions: newRolePerms })
      .select('*')
      .single();
    setCreatingRole(false);
    if (error) {
      alert('No se pudo crear el rol: ' + error.message);
      return;
    }
    setRoles((r) => [...r, data]);
    setNewRoleName('');
    setNewRolePerms({});
  };

  // Cambia un permiso de un rol YA CREADO — antes solo se podían
  // marcar permisos al crear el rol; una vez creado quedaban fijos.
  const toggleRolePermission = async (role: StaffRole, key: string) => {
    const nextPerms = { ...role.permissions, [key]: !role.permissions?.[key] };
    setRoles((rs) => rs.map((r) => (r.id === role.id ? { ...r, permissions: nextPerms } : r)));
    const { error } = await supabase.from('staff_roles').update({ permissions: nextPerms }).eq('id', role.id);
    if (error) alert('No se pudo actualizar el permiso: ' + error.message);
  };

  const deleteRole = async (id: string) => {
    if (!confirm('¿Eliminar este rol? El personal que lo tenga asignado quedará sin rol personalizado.')) return;
    const { error } = await supabase.from('staff_roles').delete().eq('id', id);
    if (error) {
      alert('No se pudo eliminar: ' + error.message);
      return;
    }
    setRoles((r) => r.filter((x) => x.id !== id));
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
        <h1 className="text-3xl font-black text-ink-950 tracking-tight">Equipo</h1>
        <p className="text-ink-500">Administrá quién tiene acceso al panel y qué puede hacer cada quien.</p>
      </div>

      {/* PROMOVER A ALGUIEN */}
      <section className="bg-white rounded-2xl border border-ink-100 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <UserCog size={18} className="text-gold-600" />
          <h2 className="font-serif text-xl text-ink-900">Agregar al equipo</h2>
        </div>
        <p className="text-xs text-ink-500">
          Buscá por correo a alguien que ya tenga cuenta creada en tu tienda (como cliente) para darle acceso de staff.
        </p>
        <div className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="correo@ejemplo.com"
              className="w-full h-10 pl-9 pr-3 bg-cream-50 border border-ink-200 rounded-lg text-sm focus:outline-none focus:border-gold-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="text-xs font-bold bg-ink-900 text-cream-50 px-4 rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-60"
          >
            {searching ? <Loader2 size={14} className="animate-spin" /> : 'Buscar'}
          </button>
        </div>

        {searchResult === 'not_found' && (
          <p className="text-xs text-amber-600 font-medium">
            No encontramos a nadie con ese correo. La persona necesita crear su cuenta primero (como cliente) en tu tienda.
          </p>
        )}
        {searchResult && searchResult !== 'not_found' && (
          <div className="bg-cream-50 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold text-ink-900 text-sm">{searchResult.name || 'Sin nombre'}</p>
              <p className="text-xs text-ink-400">{searchResult.email}</p>
            </div>
            {searchResult.role !== 'customer' ? (
              <span className="text-xs font-bold text-ink-500">Ya es {ROLE_LABELS[searchResult.role]}</span>
            ) : (
              <div className="flex gap-2">
                {(['moderator', 'delivery', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => promote(searchResult.id, r)}
                    className="text-xs font-bold border border-ink-200 px-3 py-2 rounded-lg hover:border-gold-400 hover:text-gold-700 transition-colors"
                  >
                    Hacer {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* LISTA DE STAFF */}
      <section className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        {staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <Shield size={36} className="text-ink-300 mb-3" />
            <p className="text-ink-500 font-medium">Todavía no tenés personal asignado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-[10px] font-black text-ink-400 uppercase tracking-widest bg-cream-50">
                  <th className="px-5 py-4">Persona</th>
                  <th className="px-5 py-4">Rol</th>
                  <th className="px-5 py-4">Rol personalizado</th>
                  <th className="px-5 py-4">Reporta a</th>
                  <th className="px-5 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {staff.map((m) => (
                  <tr key={m.id} className="border-b border-ink-50 last:border-0">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-ink-900">{m.name || 'Sin nombre'}</p>
                      <p className="text-xs text-ink-400">{m.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={m.role}
                        onChange={(e) => updateMember(m.id, { role: e.target.value })}
                        className="h-9 px-2 bg-cream-50 border border-ink-200 rounded-lg text-xs font-bold"
                      >
                        {(['admin', 'moderator', 'delivery'] as const).map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={m.role_id ?? ''}
                        onChange={(e) => updateMember(m.id, { role_id: e.target.value || null })}
                        className="h-9 px-2 bg-cream-50 border border-ink-200 rounded-lg text-xs"
                      >
                        <option value="">Sin rol personalizado</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={m.reports_to ?? ''}
                        onChange={(e) => updateMember(m.id, { reports_to: e.target.value || null })}
                        className="h-9 px-2 bg-cream-50 border border-ink-200 rounded-lg text-xs"
                      >
                        <option value="">—</option>
                        {staff.filter((s) => s.id !== m.id).map((s) => (
                          <option key={s.id} value={s.id}>{s.name || s.email}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => removeFromStaff(m.id)} className="p-2 text-ink-400 hover:text-red-500">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ROLES PERSONALIZADOS */}
      <section className="bg-white rounded-2xl border border-ink-100 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-gold-600" />
          <h2 className="font-serif text-xl text-ink-900">Roles personalizados</h2>
        </div>
        <p className="text-xs text-ink-500 -mt-2">
          Creá roles a medida (ej. "Vendedor de piso", "Encargado de bodega") y marcá qué secciones del panel puede
          usar cada uno. Al asignarle un rol personalizado a alguien en la tabla de arriba, su menú del admin se
          ajusta automáticamente a esos permisos.
        </p>

        <div className="space-y-3">
          {roles.map((role) => {
            const isOpen = expandedRoleId === role.id;
            return (
              <div key={role.id} className="bg-cream-50 rounded-xl overflow-hidden">
                <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
                  <button
                    onClick={() => setExpandedRoleId(isOpen ? null : role.id)}
                    className="flex items-start gap-2 text-left min-w-0 flex-1"
                  >
                    {isOpen ? <ChevronUp size={15} className="text-ink-400 mt-0.5 shrink-0" /> : <ChevronDown size={15} className="text-ink-400 mt-0.5 shrink-0" />}
                    <div className="min-w-0">
                      <p className="font-semibold text-ink-900 text-sm">{role.name}</p>
                      <p className="text-xs text-ink-400 truncate">
                        {PERMISSION_KEYS.filter((p) => role.permissions?.[p.key]).map((p) => p.label).join(', ') || 'Sin permisos marcados — click para editar'}
                      </p>
                    </div>
                  </button>
                  <button onClick={() => deleteRole(role.id)} className="p-2 text-ink-400 hover:text-red-500 shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
                {isOpen && (
                  <div className="px-4 pb-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-ink-100 pt-3">
                    {PERMISSION_KEYS.map((p) => (
                      <label key={p.key} className="flex items-center gap-2 text-xs font-medium text-ink-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(role.permissions?.[p.key])}
                          onChange={() => toggleRolePermission(role, p.key)}
                          className="w-3.5 h-3.5 accent-gold-600"
                        />
                        {p.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-gold-50 border border-gold-200 rounded-xl p-4 space-y-3">
          <input
            placeholder="Nombre del rol (ej. Vendedor de piso)"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            className="w-full h-10 px-3 bg-white border border-ink-200 rounded-lg text-sm"
          />
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {PERMISSION_KEYS.map((p) => (
              <label key={p.key} className="flex items-center gap-2 text-xs font-medium text-ink-600">
                <input
                  type="checkbox"
                  checked={Boolean(newRolePerms[p.key])}
                  onChange={(e) => setNewRolePerms({ ...newRolePerms, [p.key]: e.target.checked })}
                  className="w-3.5 h-3.5 accent-gold-600"
                />
                {p.label}
              </label>
            ))}
          </div>
          <button
            onClick={createRole}
            disabled={creatingRole || !newRoleName.trim()}
            className="flex items-center gap-1.5 text-xs font-bold bg-ink-900 text-cream-50 px-4 py-2 rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-40"
          >
            <Plus size={14} /> Crear rol
          </button>
        </div>
      </section>
    </div>
  );
}
