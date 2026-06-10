'use client';

import { useState } from 'react';
import { 
  UserIcon, 
  ShoppingBagIcon, 
  MapPinIcon, 
  ArrowLeftOnRectangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'resumen' | 'pedidos' | 'direcciones'>('resumen');

  // Simulación de información del usuario
  const userProfile = {
    name: 'Kevin Cascante',
    email: 'kevin@nexflow.digital',
    phone: '+506 7296 1548',
  };

  const menuItems = [
    { id: 'resumen', label: 'Mi Panel', icon: UserIcon },
    { id: 'pedidos', label: 'Historial de Pedidos', icon: ShoppingBagIcon },
    { id: 'direcciones', label: 'Direcciones de Envío', icon: MapPinIcon },
  ];

  return (
    <div className="bg-zinc-50 min-h-screen text-zinc-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* RETÍCULA PRINCIPAL PANEL DE CONTROL */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* MENU COMPORTAMIENTO ADMIN (SIDEBAR DE USUARIO) */}
          <aside className="bg-white rounded-3xl p-6 border border-zinc-200/60 shadow-xs space-y-6 lg:col-span-1">
            <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 font-black text-lg">
                KC
              </div>
              <div className="overflow-hidden">
                <h2 className="text-sm font-black text-zinc-900 truncate tracking-tight">{userProfile.name}</h2>
                <p className="text-[11px] text-zinc-400 truncate">{userProfile.email}</p>
              </div>
            </div>

            {/* Listado de Opciones del Sidebar */}
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-4 h-12 rounded-xl text-xs font-bold transition-all ${
                      isSelected 
                        ? 'bg-zinc-950 text-white shadow-md shadow-zinc-950/10' 
                        : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-sky-400' : 'text-zinc-400'}`} />
                    {item.label}
                  </button>
                );
              })}
              
              {/* Botón Salir */}
              <button className="w-full flex items-center gap-3 px-4 h-12 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-colors pt-4">
                <ArrowLeftOnRectangleIcon className="w-5 h-5 text-red-400" />
                Cerrar Sesión
              </button>
            </nav>
          </aside>

          {/* CONTENEDOR PRINCIPAL DINÁMICO (Vistas de Panel) */}
          <main className="bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200/60 shadow-xs lg:col-span-3 min-h-[500px]">
            
            {/* VISTA 1: RESUMEN / DASHBOARD */}
            {activeTab === 'resumen' && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-xl font-black text-zinc-900 tracking-tighter">Bienvenido de vuelta, {userProfile.name.split(' ')[0]} 👋</h3>
                  <p className="text-xs text-zinc-400 font-medium mt-1">Controlá tus compras, envíos y preferencias desde un solo lugar administrativo.</p>
                </div>

                {/* Grid de KPIs de cliente */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Pedidos Realizados</p>
                      <h4 className="text-2xl font-black text-zinc-950 mt-1">12 compras</h4>
                    </div>
                    <ShoppingBagIcon className="w-8 h-8 text-zinc-300" />
                  </div>
                  <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Dirección Principal</p>
                      <h4 className="text-xs font-bold text-zinc-950 mt-2 truncate max-w-[180px]">Alajuela, Costa Rica</h4>
                    </div>
                    <MapPinIcon className="w-8 h-8 text-zinc-300" />
                  </div>
                </div>
              </div>
            )}

            {/* VISTA 2: HISTORIAL DE PEDIDOS */}
            {activeTab === 'pedidos' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-xl font-black text-zinc-900 tracking-tighter">Tus Pedidos</h3>
                  <p className="text-xs text-zinc-400 font-medium mt-1">Historial detallado y estados de entrega en tiempo real.</p>
                </div>

                {/* Tabla/Lista de Ordenes tipo Admin Panel */}
                <div className="border border-zinc-100 rounded-2xl overflow-hidden">
                  <div className="divide-y divide-zinc-100">
                    
                    {/* Item Pedido 1 */}
                    <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-50/50">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-zinc-900">Orden #CR-85012</p>
                        <p className="text-[11px] text-zinc-400 font-medium">Realizado el 12 de Mayo, 2026</p>
                      </div>
                      <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <CheckCircleIcon className="w-4 h-4" /> Entregado
                      </div>
                      <p className="text-sm font-black text-zinc-950">₡67,000</p>
                    </div>

                    {/* Item Pedido 2 */}
                    <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-zinc-900">Orden #CR-84930</p>
                        <p className="text-[11px] text-zinc-400 font-medium">Realizado el 08 de Junio, 2026</p>
                      </div>
                      <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <ClockIcon className="w-4 h-4" /> En Ruta de Entrega
                      </div>
                      <p className="text-sm font-black text-zinc-950">₡285,000</p>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* VISTA 3: DIRECCIONES */}
            {activeTab === 'direcciones' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-zinc-900 tracking-tighter">Direcciones Guardadas</h3>
                    <p className="text-xs text-zinc-400 font-medium mt-1">Gestioná tus locaciones para acelerar el checkout automático.</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border-2 border-dashed border-zinc-200 hover:border-sky-500 cursor-pointer transition-colors flex flex-col items-center justify-center py-10 text-center gap-2">
                  <MapPinIcon className="w-8 h-8 text-zinc-300" />
                  <p className="text-xs font-black text-zinc-800">Agregar Nueva Dirección</p>
                  <p className="text-[10px] text-zinc-400 font-medium">Casas, oficinas o sucursales de retiro.</p>
                </div>
              </div>
            )}

          </main>
        </div>

      </div>
    </div>
  );
}