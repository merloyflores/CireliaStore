'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  const router = useRouter(); 

  if (pathname === '/admin/login') {
    return <div className="min-h-dvh bg-zinc-50 font-sans">{children}</div>;
  }

  const handleLogout = () => {
    document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setIsMobileMenuOpen(false);
    window.location.href = '/'; 
  };

  return (
    <div className="min-h-dvh bg-zinc-50 flex flex-col min-[1386px]:flex-row font-sans">
      
      {/* HEADER FLOTANTE (Visible hasta 1385px) */}
      <div className="min-[1386px]:hidden flex items-center justify-between bg-white border-b border-zinc-200 p-4 sticky top-0 z-40">
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

      {/* OVERLAY OSCURO (Oculto a partir de 1386px) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-40 min-[1386px]:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR (Flotante < 1386px, Fijo >= 1386px) */}
      <aside className={`
        fixed min-[1386px]:sticky top-0 left-0 z-50 h-dvh bg-white border-r border-zinc-100 flex flex-col transition-all duration-300 ease-in-out
        w-64 ${isSidebarOpen ? 'min-[1386px]:w-64' : 'min-[1386px]:w-20'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full min-[1386px]:translate-x-0'}
      `}>
        {/* Header del Sidebar */}
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center shrink-0 h-18.25">
          <Link 
            href="/admin" 
            onClick={() => setIsMobileMenuOpen(false)}
            className={`text-2xl font-black text-zinc-950 tracking-tighter ${!isSidebarOpen ? 'min-[1386px]:hidden' : ''}`}
          >
            Cirelia<span className="text-sky-600">.</span>
          </Link>
          
          {!isSidebarOpen && (
            <div className="hidden min-[1386px]:flex w-full justify-center">
              <span className="text-2xl font-black text-sky-600">C.</span>
            </div>
          )}

          {/* Botón colapsable para Escritorio */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="hidden min-[1386px]:block p-1.5 text-zinc-400 hover:bg-zinc-100 rounded-lg transition absolute -right-3 bg-white border border-zinc-200"
          >
            {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>

          {/* Botón cerrar para Móvil/Tablet */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="min-[1386px]:hidden p-1.5 text-zinc-400 hover:bg-zinc-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Links de Navegación */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
          <p className={`text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2 mb-4 ${!isSidebarOpen ? 'min-[1386px]:hidden' : ''}`}>
            Menú Principal
          </p>
          
          {adminLinks.map((link) => {
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
                className={`flex items-center py-3 rounded-xl font-bold text-sm transition-all duration-200 
                  ${!isSidebarOpen ? 'min-[1386px]:justify-center px-3' : 'px-3'}
                  ${isActive ? 'bg-sky-50 text-sky-700' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}
                `}
              >
                <Icon size={18} className={`shrink-0 ${isActive ? 'text-sky-600' : 'text-zinc-400'}`} />
                <span className={`ml-3 ${!isSidebarOpen ? 'min-[1386px]:hidden' : ''}`}>
                  {link.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-zinc-100">
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center py-3 rounded-xl font-bold text-sm text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors
              ${!isSidebarOpen ? 'min-[1386px]:justify-center px-3' : 'px-3'}
            `}
            title={!isSidebarOpen ? 'Salir de Admin' : ''}
          >
            <LogOut size={18} className="shrink-0" />
            <span className={`ml-3 ${!isSidebarOpen ? 'min-[1386px]:hidden' : ''}`}>
              Salir
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