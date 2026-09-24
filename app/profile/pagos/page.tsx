'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { getOrderStatusInfo } from '../../../lib/orderStatus';
import { CreditCardIcon, InboxIcon } from '@heroicons/react/24/outline';

function formatCRC(amount: number) {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(amount);
}

function formatOrderDate(isoDate: string) {
  return new Intl.DateTimeFormat('es-CR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(isoDate));
}

interface InvoiceRow {
  id: string;
  invoice_number: number;
  total_amount: number;
  status: string;
  payment_method: string | null;
  created_at: string;
}

export default function PagosPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('orders')
        .select('id, invoice_number, total_amount, status, payment_method, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (mounted) {
        setInvoices(data ?? []);
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <CreditCardIcon className="w-5 h-5 text-gold-600" />
          <h2 className="text-xl font-black tracking-tighter text-ink-950">Pagos y facturas</h2>
        </div>
        <p className="text-xs text-ink-500 mt-1">Historial de facturación de tus pedidos.</p>
      </div>

      <div className="bg-cream-50 border border-ink-100 rounded-2xl p-5 text-xs text-ink-600 leading-relaxed">
        Hoy coordinamos el pago de cada pedido por SINPE Móvil vía WhatsApp una vez confirmado el pedido — todavía
        no tenemos pagos con tarjeta en línea. Cuando esté disponible, vas a poder pagar directo desde acá.
      </div>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-ink-200 rounded-2xl">
          <InboxIcon className="w-10 h-10 text-ink-300 mb-3" />
          <p className="text-sm font-bold text-ink-700">Todavía no tenés facturas.</p>
        </div>
      ) : (
        <div className="border border-ink-100 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-[10px] font-black text-ink-400 uppercase tracking-widest bg-cream-50">
                <th className="px-5 py-3">Factura</th>
                <th className="px-5 py-3">Fecha</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const status = getOrderStatusInfo(inv.status);
                return (
                  <tr key={inv.id} className="border-b border-ink-50 last:border-0">
                    <td className="px-5 py-4 font-bold text-ink-900">#{inv.invoice_number}</td>
                    <td className="px-5 py-4 text-ink-500 text-xs">{formatOrderDate(inv.created_at)}</td>
                    <td className="px-5 py-4 font-semibold text-ink-900">{formatCRC(inv.total_amount)}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${status.styles}`}>
                        {status.label.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
