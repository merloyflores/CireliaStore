'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // <-- Agregamos useRouter
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
  const router = useRouter(); // <-- Inicializamos el router

  // 1. EXCEPCIÓN DEL LOGIN
  if (pathname === '/admin/login') {
    return <div className="min-h-screen bg-zinc-50 font-sans">{children}</div>;
  }

  // 2. FUNCIÓN DE CERRAR SESIÓN SEGURA
  const handleLogout = () => {
    // Destruimos la cookie poniendo su fecha de expiración en el pasado
    document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setIsMobileMenuOpen(false);
    // Forzamos una recarga limpia hacia la página de inicio
    window.location.href = '/'; 
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row font-sans">
      
      {/* HEADER MÓVIL */}
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

      {/* OVERLAY MÓVIL */}
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
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center shrink-0 h-18.25">
          <Link 
            href="/admin" 
            onClick={() => setIsMobileMenuOpen(false)}
            className={`text-2xl font-black text-zinc-950 tracking-tighter ${!isSidebarOpen ? 'md:hidden' : ''}`}
          >
            Cirelia<span className="text-sky-600">.</span>
          </Link>
          
          {!isSidebarOpen && (
            <div className="hidden md:flex w-full justify-center">
              <span className="text-2xl font-black text-sky-600">C.</span>
            </div>
          )}

          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="hidden md:block p-1.5 text-zinc-400 hover:bg-zinc-100 rounded-lg transition absolute -right-3 bg-white border border-zinc-200"
          >
            {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>

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
            // CORRECCIÓN: Lógica exacta para saber qué botón marcar
            const isActive = link.href === '/admin' 
              ? pathname === '/admin' // Si es Dashboard, tiene que ser EXACTAMENTE la raíz /admin
              : pathname === link.href || pathname.startsWith(`${link.href}/`); // Para los demás, puede ser la ruta o subrutas
            
            const Icon = link.icon;
            
            return (
              <Link 
                key={link.name} 
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
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

        {/* Footer Sidebar (Cerrar Sesión Real) */}
        <div className="p-4 border-t border-zinc-100">
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center py-3 rounded-xl font-bold text-sm text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors
              ${!isSidebarOpen ? 'md:justify-center px-3' : 'px-3'}
            `}
            title={!isSidebarOpen ? 'Salir de Admin' : ''}
          >
            <LogOut size={18} className="shrink-0" />
            <span className={`ml-3 ${!isSidebarOpen ? 'md:hidden' : ''}`}>
              Salir
            </span>
          </button>
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