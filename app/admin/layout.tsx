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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Nuevo estado
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row font-sans">
      
      {/* HEADER MÓVIL */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-zinc-200 p-4 sticky top-0 z-40">
        <span className="text-xl font-black text-zinc-950 tracking-tighter">Cirelia<span className="text-sky-600">Admin</span></span>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg"><Menu size={24} /></button>
      </div>

      {/* SIDEBAR */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-50 h-screen bg-white border-r border-zinc-100 flex flex-col transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
        ${isSidebarOpen ? 'md:w-64' : 'md:w-20'}
      `}>
        {/* Header del Sidebar */}
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center shrink-0">
          {isSidebarOpen && <Link href="/admin" className="text-2xl font-black text-zinc-950 tracking-tighter">Cirelia<span className="text-sky-600">.</span></Link>}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-1.5 text-zinc-400 hover:bg-zinc-100 rounded-lg transition"
          >
            {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          {isSidebarOpen && <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2 mb-4">Menú Principal</p>}
          
          {adminLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;
            
            return (
              <Link 
                key={link.name} 
                href={link.href}
                title={!isSidebarOpen ? link.name : ''}
                className={`flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center'} py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                  isActive ? 'bg-sky-50 text-sky-700' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-sky-600' : 'text-zinc-400'} />
                {isSidebarOpen && <span>{link.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-zinc-100">
          <Link href="/" className="flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm text-zinc-500 hover:text-red-600">
            <LogOut size={18} />
            {isSidebarOpen && <span>Salir</span>}
          </Link>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className={`flex-1 w-full min-h-screen transition-all duration-300`}>
        {/* Eliminamos el max-w-7xl y usamos px-6 o p-8 para que respire */}
        <div className="p-4 sm:p-8 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}