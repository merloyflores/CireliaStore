'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Package, Truck, Users, MessageSquare, 
  Settings2, LogOut, Menu, X, ChevronLeft, ChevronRight
} from 'lucide-react';

const adminLinks = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Inventario', href: '/admin/inventario', icon: Package },
  { name: 'Ventas y Envíos', href: '/admin/ventas', icon: Truck },
  { name: 'Clientes', href: '/admin/clientes', icon: Users },
  { name: 'Mensajes', href: '/admin/mensajes', icon: MessageSquare },
  { name: 'Configuración', href: '/admin/configuracion', icon: Settings2 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  // 1. EXCEPCIÓN DEL LOGIN: Si estamos en la ruta de login, devolvemos solo el contenido sin el Sidebar.
  if (pathname === '/admin/login') {
    return <div className="min-h-screen bg-zinc-50 font-sans">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row font-sans">
      
      {/* HEADER MÓVIL (Solo visible en celulares) */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-zinc-200 p-4 sticky top-0 z-40">
        <span className="text-xl font-black text-zinc-950 tracking-tighter">
          Cirelia<span className="text-sky-600">Admin</span>
        </span>
        <button 
          onClick={() => setIsMobileMenuOpen(true)} 
          className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* OVERLAY MÓVIL: Fondo oscuro que permite cerrar el menú al hacer clic afuera */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-50 h-screen bg-white border-r border-zinc-100 flex flex-col transition-all duration-300 ease-in-out
        w-64 ${isSidebarOpen ? 'md:w-64' : 'md:w-20'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header del Sidebar */}
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center shrink-0 h-[73px]">
          {/* Logo (Se oculta en desktop si está contraído, pero en móvil siempre se ve) */}
          <Link 
            href="/admin" 
            onClick={() => setIsMobileMenuOpen(false)}
            className={`text-2xl font-black text-zinc-950 tracking-tighter ${!isSidebarOpen ? 'md:hidden' : ''}`}
          >
            Cirelia<span className="text-sky-600">.</span>
          </Link>
          
          {/* Icono C solo visible cuando el sidebar está contraído en desktop */}
          {!isSidebarOpen && (
            <div className="hidden md:flex w-full justify-center">
              <span className="text-2xl font-black text-sky-600">C.</span>
            </div>
          )}

          {/* Botón de contraer/expandir (Solo Desktop) */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="hidden md:block p-1.5 text-zinc-400 hover:bg-zinc-100 rounded-lg transition absolute -right-3 bg-white border border-zinc-200"
          >
            {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>

          {/* Botón de cerrar (Solo Móvil) */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="md:hidden p-1.5 text-zinc-400 hover:bg-zinc-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Links de Navegación */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
          <p className={`text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2 mb-4 ${!isSidebarOpen ? 'md:hidden' : ''}`}>
            Menú Principal
          </p>
          
          {adminLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;
            
            return (
              <Link 
                key={link.name} 
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)} // Cierra el menú en móvil al hacer clic
                title={!isSidebarOpen ? link.name : ''}
                className={`flex items-center py-3 rounded-xl font-bold text-sm transition-all duration-200 
                  ${!isSidebarOpen ? 'md:justify-center px-3' : 'px-3'}
                  ${isActive ? 'bg-sky-50 text-sky-700' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}
                `}
              >
                <Icon size={18} className={`shrink-0 ${isActive ? 'text-sky-600' : 'text-zinc-400'}`} />
                <span className={`ml-3 ${!isSidebarOpen ? 'md:hidden' : ''}`}>
                  {link.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar (Cerrar Sesión) */}
        <div className="p-4 border-t border-zinc-100">
          <Link 
            href="/" 
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center py-3 rounded-xl font-bold text-sm text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors
              ${!isSidebarOpen ? 'md:justify-center px-3' : 'px-3'}
            `}
            title={!isSidebarOpen ? 'Salir de Admin' : ''}
          >
            <LogOut size={18} className="shrink-0" />
            <span className={`ml-3 ${!isSidebarOpen ? 'md:hidden' : ''}`}>
              Salir
            </span>
          </Link>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 w-full min-h-screen transition-all duration-300">
        <div className="p-4 sm:p-8 w-full max-w-[100vw] overflow-x-hidden">
          {children}
        </div>
      </main>
      
    </div>
  );
}