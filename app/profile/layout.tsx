'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  UserIcon, ShoppingBagIcon, MapPinIcon, 
  ArrowLeftOnRectangleIcon, LifebuoyIcon, CreditCardIcon
} from '@heroicons/react/24/outline';

const menuItems = [
  { id: 'resumen', label: 'Mi Panel', path: '/profile', icon: UserIcon },
  { id: 'pedidos', label: 'Historial de Pedidos', path: '/profile/pedidos', icon: ShoppingBagIcon },
  { id: 'direcciones', label: 'Direcciones', path: '/profile/direcciones', icon: MapPinIcon },
  { id: 'facturacion', label: 'Pagos y Facturas', path: '/profile/pagos', icon: CreditCardIcon },
  { id: 'soporte', label: 'Soporte', path: '/profile/soporte', icon: LifebuoyIcon },
];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="bg-zinc-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* SIDEBAR FIJO */}
          <aside className="bg-white rounded-3xl p-6 border border-zinc-200/60 shadow-xs space-y-6 lg:col-span-1">
            {/* Aquí puedes poner tu info de perfil que tenías antes */}
            <div className="pb-4 border-b border-zinc-100">
               <h2 className="text-sm font-black text-zinc-900">Kevin Cascante</h2>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                // Comparamos la ruta actual con el path del item
                const isActive = pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`w-full flex items-center gap-3 px-4 h-12 rounded-xl text-xs font-bold transition-all ${
                      isActive 
                        ? 'bg-zinc-950 text-white shadow-md shadow-zinc-950/10' 
                        : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-sky-400' : 'text-zinc-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
              
              <button className="w-full flex items-center gap-3 px-4 h-12 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-colors pt-4">
                <ArrowLeftOnRectangleIcon className="w-5 h-5 text-red-400" />
                Cerrar Sesión
              </button>
            </nav>
          </aside>

          {/* CONTENIDO DINÁMICO (Aquí aparecerá lo que esté en page.tsx) */}
          <main className="bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200/60 shadow-xs lg:col-span-3 min-h-[500px]">
            {children}
          </main>

        </div>
      </div>
    </div>
  );
}