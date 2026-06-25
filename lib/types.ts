// lib/types.ts
export interface Order {
  id: string;
  invoice_number: number | null;
  status: string;
  total_amount: number;
  created_at: string;
  payment_method: string | null;
  delivery_method: string | null;
  users: { name: string } | null;
}