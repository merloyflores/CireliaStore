// lib/loyaltyTiers.ts
// Única fuente de verdad para calcular el nivel de lealtad de un cliente.
// La usan: app/admin/clientes/page.tsx, components/CustomerProfileModal.tsx,
// components/LoyaltyTiersSection.tsx.

export interface LoyaltyTier {
  id: string;
  name: string;
  min_orders: number;
  min_spent: number;
  discount_percentage: number;
  discount_fixed_amount: number;
  badge_color: string;
  priority: number;
  is_active: boolean;
}

export const BADGE_COLOR_STYLES: Record<string, string> = {
  zinc: 'bg-zinc-100 text-zinc-600',
  sky: 'bg-sky-50 text-sky-700',
  indigo: 'bg-indigo-50 text-indigo-700',
  amber: 'bg-amber-50 text-amber-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  rose: 'bg-rose-50 text-rose-700',
  purple: 'bg-purple-50 text-purple-700',
};

export const BADGE_COLOR_OPTIONS = Object.keys(BADGE_COLOR_STYLES);

export function getBadgeStyles(color: string): string {
  return BADGE_COLOR_STYLES[color] || BADGE_COLOR_STYLES.zinc;
}

/**
 * Calcula qué nivel corresponde a un cliente según sus números reales.
 *
 * Regla elegida: debe cumplir AMBAS condiciones (mínimo de pedidos Y
 * mínimo gastado) para calificar a un nivel — la más exigente de las dos
 * opciones.
 *
 * Si hay varios niveles que sí califica, gana el de mayor 'priority'
 * (así podés tener niveles con umbrales parecidos sin ambigüedad).
 *
 * Si el cliente tiene manualTierId asignado, ese nivel gana siempre,
 * sin pasar por el cálculo automático.
 */
export function resolveCustomerTier(
  orderCount: number,
  totalSpent: number,
  tiers: LoyaltyTier[],
  manualTierId: string | null
): LoyaltyTier | null {
  if (manualTierId) {
    const manual = tiers.find((t) => t.id === manualTierId);
    if (manual) return manual;
  }

  const qualifying = tiers
    .filter((t) => t.is_active && orderCount >= t.min_orders && totalSpent >= t.min_spent)
    .sort((a, b) => b.priority - a.priority);

  return qualifying[0] || null;
}