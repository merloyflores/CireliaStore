'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../lib/supabase/client';
import { ORDER_STATUS_CONFIG, ACTIVE_ORDER_STATUSES, getOrderStatusInfo } from '../../lib/orderStatus';
import {
  ShoppingBagIcon,
  MapPinIcon,
  CreditCardIcon,
  ArrowRightIcon,
  LifebuoyIcon,
  TruckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

function formatCRC(amount: number) {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMemberSince(isoDate: string) {
  return new Intl.DateTimeFormat('es-CR', { month: 'long', year: 'numeric' }).format(new Date(isoDate));
}

function formatOrderDate(isoDate: string) {
  return new Intl.DateTimeFormat('es-CR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(isoDate));
}

interface RecentOrder {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  delivery_method: string | null;
}

export default function DashboardPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [userData, setUserData] = useState<{ name?: string; email?: string; memberSince?: string } | null>(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [recentOrder, setRecentOrder] = useState<RecentOrder | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          if (mounted) {
            setLoadError(true);
            setLoading(false);
          }
          return;
        }

        const { data: dbUser } = await supabase
          .from('users')
          .select('name, email, image')
          .eq('id', user.id)
          .maybeSingle();

        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id, status, total_amount, created_at, delivery_method')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        if (mounted) {
          setUserData({
            name: dbUser?.name || user.user_metadata?.full_name || user.user_metadata?.name || 'Usuario',
            email: dbUser?.email || user.email,
            memberSince: user.created_at,
          });

          const allOrders = orders || [];
          setTotalOrders(allOrders.length);
          setActiveOrders(allOrders.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status)).length);
          setRecentOrder(allOrders[0] || null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error cargando el panel:', err);
        if (mounted) {
          setLoadError(true);
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <p className="text-sm font-bold text-ink-700">No pudimos cargar tu panel.</p>
        <button
          onClick={() => window.location.reload()}
          className="text-xs font-bold text-ink-950 underline underline-offset-4"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const statusInfo = recentOrder ? getOrderStatusInfo(recentOrder.status) : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      <div>
        <h1 className="text-2xl font-black text-ink-950 tracking-tighter">
          Bienvenido de vuelta, {userData?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-ink-500 font-medium mt-1">
          Gestioná tus compras, seguí tus envíos y revisá tu historial.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-cream-50 border border-ink-100">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBagIcon className="w-5 h-5 text-gold-600" />
            <p className="text-[10px] font-black uppercase text-ink-400 tracking-wider">Total Pedidos</p>
          </div>
          <h4 className="text-3xl font-black text-ink-950">{totalOrders}</h4>
        </div>

        <div className="p-6 rounded-2xl bg-cream-50 border border-ink-100">
          <div className="flex items-center gap-3 mb-2">
            <TruckIcon className="w-5 h-5 text-gold-600" />
            <p className="text-[10px] font-black uppercase text-ink-400 tracking-wider">Pedidos Activos</p>
          </div>
          <h4 className="text-3xl font-black text-ink-950">{activeOrders}</h4>
        </div>

        <div className="p-6 rounded-2xl bg-cream-50 border border-ink-100">
          <div className="flex items-center gap-3 mb-2">
            <ClockIcon className="w-5 h-5 text-gold-600" />
            <p className="text-[10px] font-black uppercase text-ink-400 tracking-wider">Miembro desde</p>
          </div>
          <h4 className="text-xl font-black text-ink-950 mt-1 capitalize">
            {userData?.memberSince ? formatMemberSince(userData.memberSince) : '—'}
          </h4>
        </div>
      </div>

      {recentOrder ? (
        <div className="bg-ink-950 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-white font-bold">Tu pedido más reciente</h3>
              {statusInfo && (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusInfo.styles}`}>
                  {statusInfo.label}
                </span>
              )}
            </div>
            <p className="text-ink-400 text-xs">
              {formatOrderDate(recentOrder.created_at)} · {formatCRC(recentOrder.total_amount)}
            </p>
          </div>
          <Link
            href="/profile/pedidos"
            className="bg-white text-ink-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-ink-200 transition-colors shrink-0"
          >
            Ver Pedidos <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="bg-ink-950 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-white font-bold">Todavía no tenés pedidos</h3>
            <p className="text-ink-400 text-xs mt-1">Cuando compres algo, lo vas a ver reflejado acá.</p>
          </div>
          <Link
            href="/"
            className="bg-white text-ink-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-ink-200 transition-colors shrink-0"
          >
            Explorar Catálogo <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      )}

      <div className="border border-ink-100 rounded-2xl p-6">
        <h3 className="text-sm font-black text-ink-900 mb-4">¿Qué te gustaría hacer hoy?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/profile/direcciones" className="p-4 border border-ink-100 rounded-xl hover:border-gold-500 transition-colors text-xs font-bold text-ink-600 hover:text-gold-600 flex items-center gap-2">
            <MapPinIcon className="w-4 h-4" />
            Gestionar Direcciones
          </Link>
          <Link href="/profile/pagos" className="p-4 border border-ink-100 rounded-xl hover:border-gold-500 transition-colors text-xs font-bold text-ink-600 hover:text-gold-600 flex items-center gap-2">
            <CreditCardIcon className="w-4 h-4" />
            Pagos y Facturas
          </Link>
          <Link href="/profile/soporte" className="p-4 border border-ink-100 rounded-xl hover:border-gold-500 transition-colors text-xs font-bold text-ink-600 hover:text-gold-600 flex items-center gap-2">
            <LifebuoyIcon className="w-4 h-4" />
            Abrir un Ticket
          </Link>
        </div>
      </div>

    </div>
  );
}