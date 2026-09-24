/**
 * Permisos "de referencia" para roles personalizados de Equipo. No
 * reemplazan el rol base (admin/moderator/delivery), que es lo que
 * sigue mandando en la base de datos (RLS: is_staff() = admin o
 * moderator puede tocar todo lo de su tienda). Esto es una capa
 * ADICIONAL, a nivel de interfaz: cuando alguien tiene un rol
 * personalizado asignado (role_id), su menú del admin solo muestra
 * las secciones para las que ese rol tiene permiso — así un "Vendedor
 * de piso" no ve ni le aparece Configuración o Comisiones, aunque
 * técnicamente siga siendo "moderador" por dentro.
 *
 * Si en algún momento se necesita que esto sea una restricción de
 * seguridad real (no solo de interfaz) — es decir, que ni siquiera
 * pueda entrar tecleando la URL — hay que llevar estos mismos permisos
 * a políticas RLS en Supabase. Por ahora es control de qué se VE y se
 * ofrece en el panel, que es lo que pidió el dueño de la tienda.
 */
export const PERMISSION_KEYS = [
  { key: 'manage_content', label: 'Diseño (tema, hero y piezas del home)' },
  { key: 'manage_products', label: 'Inventario y características' },
  { key: 'manage_orders', label: 'Ventas y envíos' },
  { key: 'manage_customers', label: 'Clientes' },
  { key: 'manage_team', label: 'Equipo' },
  { key: 'manage_commissions', label: 'Comisiones' },
  { key: 'manage_messages', label: 'Mensajes' },
  { key: 'manage_settings', label: 'Configuración' },
  { key: 'view_reports', label: 'Dashboard / reportes' },
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number]['key'];

/** A qué permiso corresponde cada link del sidebar de admin. `null` = siempre visible para cualquier staff. */
export const NAV_PERMISSION: Record<string, PermissionKey | null> = {
  '/admin': 'view_reports',
  '/admin/inicio': 'manage_content',
  '/admin/inventario': 'manage_products',
  '/admin/caracteristicas': 'manage_products',
  '/admin/ventas': 'manage_orders',
  '/admin/clientes': 'manage_customers',
  '/admin/equipo': 'manage_team',
  '/admin/comisiones': 'manage_commissions',
  '/admin/mensajes': 'manage_messages',
  '/admin/configuracion': 'manage_settings',
};

/**
 * true = puede ver/usar esa sección.
 * - Sin rol personalizado asignado (role_id null): acceso completo,
 *   como siempre (esto es lo que ya tenía todo el equipo).
 * - Con rol personalizado: solo lo que ese rol tenga marcado.
 */
export function canAccess(
  permission: PermissionKey | null,
  roleId: string | null,
  rolePermissions: Record<string, boolean> | null
): boolean {
  if (!permission) return true;
  if (!roleId) return true;
  return Boolean(rolePermissions?.[permission]);
}
