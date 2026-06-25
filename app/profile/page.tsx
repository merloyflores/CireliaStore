'use client';

import { 
  ShoppingBagIcon, 
  MapPinIcon, 
  CreditCardIcon, 
  ArrowRightIcon 
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function DashboardPage() {
  // Aquí luego conectarás con Supabase para traer datos reales
  const userStats = {
    totalOrders: 12,
    activeSupportTickets: 1,
    memberSince: 'Mayo 2026'
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Saludo y bienvenida */}
      <div>
        <h1 className="text-2xl font-black text-zinc-950 tracking-tighter">Bienvenido de vuelta, Kevin 👋</h1>
        <p className="text-sm text-zinc-500 font-medium mt-1">
          Gestioná tus compras, seguí tus envíos y revisá tu historial.
        </p>
      </div>

      {/* Grid de KPIs (Estadísticas rápidas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBagIcon className="w-5 h-5 text-sky-600" />
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Total Pedidos</p>
          </div>
          <h4 className="text-3xl font-black text-zinc-950">{userStats.totalOrders}</h4>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
          <div className="flex items-center gap-3 mb-2">
            <CreditCardIcon className="w-5 h-5 text-sky-600" />
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Tickets Activos</p>
          </div>
          <h4 className="text-3xl font-black text-zinc-950">{userStats.activeSupportTickets}</h4>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
          <div className="flex items-center gap-3 mb-2">
            <MapPinIcon className="w-5 h-5 text-sky-600" />
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Miembro desde</p>
          </div>
          <h4 className="text-xl font-black text-zinc-950 mt-1">{userStats.memberSince}</h4>
        </div>
      </div>

      {/* Tarjeta de Acción Rápida (Último pedido) */}
      <div className="bg-zinc-950 p-6 rounded-2xl flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold">¿Necesitás ayuda con tu última compra?</h3>
          <p className="text-zinc-400 text-xs mt-1">Revisá el estado detallado o contactanos.</p>
        </div>
        <Link 
          href="/perfil/pedidos" 
          className="bg-white text-zinc-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-zinc-200 transition-colors"
        >
          Ver Pedidos <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>

      {/* Sección de "Sugerencias" o "Productos Destacados" */}
      <div className="border border-zinc-100 rounded-2xl p-6">
        <h3 className="text-sm font-black text-zinc-900 mb-4">¿Qué te gustaría hacer hoy?</h3>
        <div className="grid grid-cols-2 gap-4">
          <Link href="/perfil/direcciones" className="p-4 border border-zinc-100 rounded-xl hover:border-sky-500 transition-colors text-xs font-bold text-zinc-600 hover:text-sky-600">
            Gestionar Direcciones →
          </Link>
          <Link href="/perfil/soporte" className="p-4 border border-zinc-100 rounded-xl hover:border-sky-500 transition-colors text-xs font-bold text-zinc-600 hover:text-sky-600">
            Abrir un Ticket →
          </Link>
        </div>
      </div>

    </div>
  );
}