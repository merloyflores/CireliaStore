'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { ORDER_STATUS_CONFIG, ORDER_STATUS_LIST, getOrderStatusInfo } from '../../../lib/orderStatus';
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';

const FILTER_OPTIONS = [
  { value: 'all', label: 'Todos los pedidos' },
  ...ORDER_STATUS_LIST.map((statusKey) => ({ value: statusKey, label: ORDER_STATUS_CONFIG[statusKey].label })),
];

function formatCRC(amount: number) {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatOrderDate(isoDate: string) {
  return new Intl.DateTimeFormat('es-CR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(isoDate));
}

interface OrderItemRow {
  id: string;
  quantity: number;
  price_at_purchase: number;
  product: {
    id: string;
    name: string;
    image_url: string | null;
  } | null;
}

interface OrderRow {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  delivery_method: string | null;
  invoice_number: number;
  order_items: OrderItemRow[];
}

export default function OrderHistoryPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetchOrders = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          if (mounted) {
            setLoadError(true);
            setLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            status,
            total_amount,
            created_at,
            delivery_method,
            invoice_number,
            order_items (
              id,
              quantity,
              price_at_purchase,
              product:products ( id, name, image_url )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (mounted) {
          setOrders((data as unknown as OrderRow[]) || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error cargando el historial de pedidos:', err);
        if (mounted) {
          setLoadError(true);
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        term === '' ||
        String(order.invoice_number).includes(term) ||
        order.order_items.some((item) => item.product?.name.toLowerCase().includes(term));

      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-sm font-bold text-ink-700">No pudimos cargar tus pedidos.</p>
        <button
          onClick={() => window.location.reload()}
          className="text-xs font-bold text-ink-950 underline underline-offset-4"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      <div>
        <h1 className="text-2xl font-black text-ink-950 tracking-tighter">Historial de Pedidos</h1>
        <p className="text-sm text-ink-500 font-medium mt-1">
          Revisá el estado y el detalle de todas tus compras.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por número de factura o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-cream-50/50 border border-ink-200 rounded-xl text-xs font-medium focus:outline-none focus:bg-white focus:border-ink-950 focus:ring-4 focus:ring-ink-950/5 transition-all"
          />
        </div>

        <div className="relative sm:w-56">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-11 pl-4 pr-8 bg-cream-50/50 border border-ink-200 rounded-xl text-xs font-bold text-ink-700 appearance-none focus:outline-none focus:bg-white focus:border-ink-950 focus:ring-4 focus:ring-ink-950/5 transition-all cursor-pointer"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDownIcon className="w-4 h-4 text-ink-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-ink-200 rounded-2xl">
          <InboxIcon className="w-10 h-10 text-ink-300 mb-3" />
          <p className="text-sm font-bold text-ink-700">
            {orders.length === 0 ? 'Todavía no tenés pedidos.' : 'No encontramos pedidos con ese filtro.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusInfo = getOrderStatusInfo(order.status);
            const itemCount = order.order_items.reduce((acc, item) => acc + item.quantity, 0);
            const previewItems = order.order_items.slice(0, 4);

            return (
              <div key={order.id} className="border border-ink-100 rounded-2xl p-5 hover:border-ink-200 transition-colors">

                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-cream-50">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
                    <div>
                      <p className="text-[10px] font-black uppercase text-ink-400 tracking-wider">Pedido</p>
                      <p className="font-bold text-ink-900">#{order.invoice_number}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-ink-400 tracking-wider">Fecha</p>
                      <p className="font-bold text-ink-900">{formatOrderDate(order.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-ink-400 tracking-wider">Total</p>
                      <p className="font-bold text-ink-900">{formatCRC(order.total_amount)}</p>
                    </div>
                  </div>

                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${statusInfo.styles}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <div className="flex -space-x-3">
                    {previewItems.map((item) => (
                      <div
                        key={item.id}
                        className="w-12 h-12 rounded-xl border-2 border-white bg-ink-100 overflow-hidden relative shrink-0"
                        title={item.product?.name}
                      >
                        {item.product?.image_url ? (
                          <Image
                            src={item.product.image_url}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] text-ink-400 font-bold">
                            N/A
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-ink-500 font-medium">
                    {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
                    {order.order_items.length > previewItems.length && ` (+${order.order_items.length - previewItems.length} más)`}
                  </p>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}