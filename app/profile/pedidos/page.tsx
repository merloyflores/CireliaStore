'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import OrderTimeline from '@/components/OrderTimeline';

// Mapeo de estados reales
const statusMap: Record<string, { label: string, styles: string }> = {
  'paid': { label: 'Pagado', styles: 'bg-blue-100 text-blue-700 border-blue-200' },
  'packed': { label: 'Preparado', styles: 'bg-amber-100 text-amber-700 border-amber-200' },
  'shipped': { label: 'En Ruta', styles: 'bg-sky-100 text-sky-700 border-sky-200' },
  'delivered': { label: 'Entregado', styles: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  'pending': { label: 'Pendiente', styles: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
};

export default function PedidosPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    async function fetchOrders() {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      setOrders(data || []);
    }
    fetchOrders();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black tracking-tighter">Historial de Compras</h2>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="border border-zinc-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs font-black text-zinc-400 uppercase">Orden #{order.id.slice(0,8)}</p>
                <p className="text-2xl font-black text-zinc-950">₡{Number(order.total_amount).toLocaleString()}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${statusMap[order.status]?.styles || 'bg-zinc-100'}`}>
                {statusMap[order.status]?.label || 'Procesando'}
              </span>
            </div>
            
            <OrderTimeline currentStatus={order.status} />
          </div>
        ))}
      </div>
    </div>
  );
}