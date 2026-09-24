// lib/customers.ts
// Única fuente de verdad para la forma de una fila de cliente en el
// admin, y para el vocabulario de roles de la plataforma.

import { LoyaltyTier } from './loyaltyTiers';

export type UserRole = 'customer' | 'moderator' | 'admin';

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  image: string | null;
  phone: string | null;
  dni: string | null;
  status: string | null;
  default_address: { principal: string } | null;
  manual_tier_id: string | null;
  role: UserRole;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
  tier: LoyaltyTier | null;
}

export const ROLE_STYLES: Record<UserRole, string> = {
  admin: 'bg-violet-50 text-violet-700 border border-violet-200',
  moderator: 'bg-blue-50 text-blue-700 border border-blue-200',
  customer: '',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  moderator: 'Moderador',
  customer: 'Cliente',
};