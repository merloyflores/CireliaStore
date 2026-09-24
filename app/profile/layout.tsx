'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
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

interface UserProfile {
  name: string;
  avatar_url: string;
  email: string;
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Este layout ya NO decide si podés estar acá — eso es trabajo
    // exclusivo del middleware. Si llegamos a este punto, es porque
    // el middleware ya confirmó sesión válida y perfil completo.
    // Esta función solo busca datos para MOSTRAR en el sidebar.
    async function loadUserForDisplay() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !isMounted) {
          setLoading(false);
          return;
        }

        // Buscamos por 'id', igual que en todo el resto de la app
        // (no por 'email', que era la inconsistencia anterior).
        const { data: dbUser } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', user.id)
          .maybeSingle();

        if (isMounted) {
          setUserProfile({
            name: dbUser?.name || user.user_metadata?.full_name || user.user_metadata?.name || 'Usuario',
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
            email: dbUser?.email || user.email || '',
          });
        }
      } catch (err) {
        console.error('Error al cargar datos del perfil para mostrar:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadUserForDisplay();

    // Este listener sí es correcto y se queda: si el usuario cierra
    // sesión explícitamente (acá o en otra pestaña), lo mandamos a
    // /login de inmediato. A diferencia del chequeo de arriba, este
    // evento es inequívoco — no es una lectura ambigua de sesión.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && isMounted) {
        router.replace('/login');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    // No hace falta un router.push acá: signOut() dispara el evento
    // SIGNED_OUT de arriba, que ya se encarga de la redirección.
    await supabase.auth.signOut();
  };

  return (
    <div className="bg-cream-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          <aside className="bg-white rounded-3xl p-6 border border-ink-200/60 shadow-xs space-y-6 lg:col-span-1">
            <div className="pb-4 border-b border-ink-100 flex items-center gap-3">
              {loading ? (
                <div className="animate-pulse flex items-center gap-3 w-full">
                  <div className="rounded-full bg-ink-200 h-10 w-10 shrink-0"></div>
                  <div className="h-4 bg-ink-200 rounded w-24"></div>
                </div>
              ) : (
                <>
                  {userProfile?.avatar_url ? (
                    <img 
                      src={userProfile.avatar_url} 
                      alt={`Avatar de ${userProfile.name}`} 
                      className="w-10 h-10 rounded-full object-cover border border-ink-200/60 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-cream-50 flex items-center justify-center border border-ink-200 shrink-0">
                      <UserIcon className="w-5 h-5 text-ink-400" />
                    </div>
                  )}
                  <div className="flex flex-col truncate">
                    <h2 className="text-xs font-black text-ink-900 truncate max-w-37.5" title={userProfile?.name}>
                      {userProfile?.name || 'Invitado'}
                    </h2>
                    <span className="text-[10px] text-ink-400 font-medium truncate max-w-37.5">
                      {userProfile?.email}
                    </span>
                  </div>
                </>
              )}
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`w-full flex items-center gap-3 px-4 h-12 rounded-xl text-xs font-bold transition-all ${
                      isActive 
                        ? 'bg-ink-950 text-white shadow-md shadow-ink-950/10' 
                        : 'text-ink-500 hover:text-ink-950 hover:bg-ink-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-gold-400' : 'text-ink-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
              
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 h-12 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-colors pt-4"
              >
                <ArrowLeftOnRectangleIcon className="w-5 h-5 text-red-400" />
                Cerrar Sesión
              </button>
            </nav>
          </aside>

          <main className="bg-white rounded-3xl p-6 sm:p-10 border border-ink-200/60 shadow-xs lg:col-span-3 min-h-125">
            {children}
          </main>

        </div>
      </div>
    </div>
  );
}