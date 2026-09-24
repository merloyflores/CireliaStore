'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, Truck, Users, MessageSquare,
  Settings2, LogOut, Menu, X, ChevronLeft, ChevronRight, Layout, UserCog, Percent, SlidersHorizontal, ExternalLink
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/app/providers';
import { NAV_PERMISSION, canAccess } from '@/lib/permissions';

const adminLinks = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Diseño', href: '/admin/inicio', icon: Layout },
  { name: 'Inventario', href: '/admin/inventario', icon: Package },
  { name: 'Características', href: '/admin/caracteristicas', icon: SlidersHorizontal },
  { name: 'Ventas y Envíos', href: '/admin/ventas', icon: Truck },
  { name: 'Clientes', href: '/admin/clientes', icon: Users },
  { name: 'Equipo', href: '/admin/equipo', icon: UserCog },
  { name: 'Comisiones', href: '/admin/comisiones', icon: Percent },
  { name: 'Mensajes', href: '/admin/mensajes', icon: MessageSquare },
  { name: 'Configuración', href: '/admin/configuracion', icon: Settings2 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { profile, rolePermissions } = useAuth();

  // Si esta persona tiene un rol personalizado asignado (Equipo → Roles
  // personalizados), el menú solo muestra las secciones que ese rol
  // tiene marcadas — así "Vendedor de piso" no ve Configuración ni
  // Comisiones, por ejemplo. Sin rol personalizado, ve todo, como antes.
  const visibleLinks = adminLinks.filter((link) =>
    canAccess(NAV_PERMISSION[link.href] ?? null, profile?.role_id ?? null, rolePermissions)
  );

  // La sesión y el rol ya se verifican en el servidor (middleware.ts)
  // antes de que este layout se renderice; no hace falta gating extra
  // acá ni una ruta /admin/login aparte con credenciales hardcodeadas.
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMobileMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-dvh bg-cream-100 flex flex-col min-[1386px]:flex-row font-sans">
      
      {/* HEADER FLOTANTE (Visible hasta 1385px) — colores del menú son
          fijos (slate/indigo), NUNCA los del "Primario" que el admin
          elige en Diseño: el menú es una herramienta de trabajo, no
          parte de la marca de la tienda. */}
      <div className="min-[1386px]:hidden flex items-center justify-between bg-slate-950 border-b border-slate-800 p-4 sticky top-0 z-40">
        <span className="text-xl font-black text-white tracking-tighter">
          Cirelia<span className="text-indigo-400">Admin</span>
        </span>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* OVERLAY OSCURO (Oculto a partir de 1386px) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 min-[1386px]:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR (Flotante < 1386px, Fijo >= 1386px) */}
      <aside className={`
        fixed min-[1386px]:sticky top-0 left-0 z-50 h-dvh bg-slate-950 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out
        w-64 ${isSidebarOpen ? 'min-[1386px]:w-64' : 'min-[1386px]:w-20'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full min-[1386px]:translate-x-0'}
      `}>
        {/* Header del Sidebar */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center shrink-0 h-18.25">
          <Link
            href="/admin"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`text-2xl font-black text-white tracking-tighter ${!isSidebarOpen ? 'min-[1386px]:hidden' : ''}`}
          >
            Cirelia<span className="text-indigo-400">.</span>
          </Link>

          {!isSidebarOpen && (
            <div className="hidden min-[1386px]:flex w-full justify-center">
              <span className="text-2xl font-black text-indigo-400">C.</span>
            </div>
          )}

          {/* Botón colapsable para Escritorio */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden min-[1386px]:block p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition absolute -right-3 bg-slate-900 border border-slate-700"
          >
            {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>

          {/* Botón cerrar para Móvil/Tablet */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="min-[1386px]:hidden p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Links de Navegación */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          <p className={`text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-4 ${!isSidebarOpen ? 'min-[1386px]:hidden' : ''}`}>
            Menú Principal
          </p>

          {visibleLinks.map((link) => {
            const isActive = link.href === '/admin'
              ? pathname === '/admin'
              : pathname === link.href || pathname.startsWith(`${link.href}/`);

            const Icon = link.icon;

            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                title={!isSidebarOpen ? link.name : ''}
                className={`relative flex items-center py-3 rounded-xl font-bold text-sm transition-all duration-200
                  ${!isSidebarOpen ? 'min-[1386px]:justify-center px-3' : 'px-3'}
                  ${isActive ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'}
                `}
              >
                {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-indigo-400" />}
                <Icon size={18} className={`shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span className={`ml-3 ${!isSidebarOpen ? 'min-[1386px]:hidden' : ''}`}>
                  {link.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-800 space-y-1.5">
          {/* Sale del panel SIN cerrar sesión: vuelve a la tienda normal */}
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`w-full flex items-center py-3 rounded-xl font-bold text-sm text-slate-400 hover:bg-slate-800/70 hover:text-white transition-colors
              ${!isSidebarOpen ? 'min-[1386px]:justify-center px-3' : 'px-3'}
            `}
            title={!isSidebarOpen ? 'Ver tienda' : ''}
          >
            <ExternalLink size={18} className="shrink-0 text-slate-500" />
            <span className={`ml-3 ${!isSidebarOpen ? 'min-[1386px]:hidden' : ''}`}>
              Ver tienda
            </span>
          </Link>

          {/* Cierra sesión de verdad */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center py-3 rounded-xl font-bold text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors
              ${!isSidebarOpen ? 'min-[1386px]:justify-center px-3' : 'px-3'}
            `}
            title={!isSidebarOpen ? 'Cerrar sesión' : ''}
          >
            <LogOut size={18} className="shrink-0" />
            <span className={`ml-3 ${!isSidebarOpen ? 'min-[1386px]:hidden' : ''}`}>
              Cerrar sesión
            </span>
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 w-full min-h-dvh transition-all duration-300">
        <div className="p-4 sm:p-8 w-full max-w-[100vw] overflow-x-hidden">
          {children}
        </div>
      </main>
      
    </div>
  );
}