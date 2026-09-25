/**
 * Permisos para roles personalizados de Equipo — y desde la migración
 * 33_role_permissions_real_rls, ya no son solo de interfaz: las mismas
 * claves (manage_content, manage_products, etc.) están replicadas en
 * políticas RLS de Supabase vía la función has_permission(key), así
 * que alguien con un rol limitado tampoco puede escribir esas tablas
 * entrando directo por la API/URL, no solo que no le aparezcan en el
 * menú.
 *
 * - Sin rol personalizado asignado (role_id null): acceso completo,
 *   tanto acá (canAccess) como en la base (has_permission) — así
 *   siguen funcionando los admins/moderadores de siempre.
 * - Con rol personalizado: solo lo que ese rol tenga marcado, en
 *   ambos lados. Si agregás una clave nueva acá, replicala también en
 *   la política RLS de la tabla correspondiente (ver esa migración).
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
