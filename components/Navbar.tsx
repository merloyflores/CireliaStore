'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bars3Icon,
  XMarkIcon,
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  Cog6ToothIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useCartStore } from '../app/store/useCartStore';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/app/providers';

interface NavLink {
  name: string;
  href: string;
}

const DEFAULT_CATEGORIES: NavLink[] = [
  { name: 'Ofertas', href: '/shop?sale=true' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // El rol real viene de public.users.role (resuelto una sola vez en
  // Providers), no de una lista de correos hardcodeada.
  const { user, profile, isLoading, isStaff, isPlatformAdmin } = useAuth();
  const isLoggedIn = !isLoading && !!user;
  const isAdmin = isStaff || isPlatformAdmin;

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const [categories, setCategories] = useState<NavLink[]>([]);
  const [isDesktopCatOpen, setIsDesktopCatOpen] = useState(false);
  const [isMobileCatOpen, setIsMobileCatOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const cart = useCartStore((state) => state.cart);
  const favorites = useCartStore((state) => state.favorites);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const favCount = favorites.length;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    async function fetchActiveCategories() {
      try {
        // Ojo acá: esto corre en el cliente, así que no tenemos el
        // header x-tenant-slug que arma el proxy para Server
        // Components — resolvemos el tenant por slug primero, igual
        // que en el resto de componentes cliente. Antes esta consulta
        // no filtraba por tenant_id en absoluto y mezclaba categorías
        // de TODOS los tenants en el menú.
        const tenantSlug = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || 'cirelia';
        const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).maybeSingle();
        if (!tenant) throw new Error('Tenant no encontrado');

        const { data: catData, error } = await supabase
          .from('categories')
          .select('id, name, slug')
          .eq('tenant_id', tenant.id)
          .order('name', { ascending: true });

        if (error) throw error;

        if (catData && catData.length > 0) {
          setCategories(
            catData.map((cat: any) => ({
              name: cat.name,
              // Antes esto apuntaba a /${slug}, una ruta dinámica vieja
              // que no filtraba por tenant y duplicaba /shop. El catálogo
              // ya soporta el filtro por categoría vía query param.
              href: `/shop?category=${cat.slug || cat.id}`,
            }))
          );
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      } catch (error) {
        console.error('Error cargando categorías:', error);
        setCategories(DEFAULT_CATEGORIES);
      }
    }

    fetchActiveCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userInitials = profile?.name ? profile.name.substring(0, 2).toUpperCase() : 'U';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  // El return condicional va después de todos los hooks (regla de hooks).
  if (pathname.startsWith('/admin')) return null;

  return (
    <nav
      className={`transition-all duration-300 ${
        scrolled
          ? 'bg-cream-50/90 backdrop-blur-md border-b border-ink-100 py-2 shadow-sm'
          : 'bg-cream-50 border-b border-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="shrink-0 flex items-center">
            <Link
              href="/"
              className="font-serif text-3xl font-medium text-ink-900 tracking-tight hover:opacity-80 transition"
            >
              Cirelia<span className="text-gold-500">.</span>
            </Link>
          </div>

          {/* Enlaces de escritorio */}
          <div className="hidden min-[1368px]:flex items-center space-x-10 relative">
            <Link
              href="/"
              className="text-[13px] font-semibold uppercase tracking-[0.15em] text-ink-500 hover:text-gold-600 transition-all duration-200 relative group"
            >
              Inicio
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold-500 transition-all group-hover:w-full" />
            </Link>

            <div
              className="relative group"
              onMouseEnter={() => setIsDesktopCatOpen(true)}
              onMouseLeave={() => setIsDesktopCatOpen(false)}
            >
              <button className="flex items-center gap-1 text-[13px] font-semibold uppercase tracking-[0.15em] text-ink-500 hover:text-gold-600 transition-all duration-200 py-2">
                Categorías
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isDesktopCatOpen ? 'rotate-180 text-gold-600' : ''
                  }`}
                />
              </button>

              <div
                className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 w-64 transition-all duration-300 origin-top ${
                  isDesktopCatOpen ? 'opacity-100 scale-y-100 visible' : 'opacity-0 scale-y-95 invisible'
                }`}
              >
                <div className="bg-cream-50 border border-ink-100 shadow-xl rounded-2xl p-3 max-h-[60vh] overflow-y-auto flex flex-col gap-1 custom-scrollbar">
                  {categories.map((cat) => (
                    <Link
                      key={cat.name}
                      href={cat.href}
                      onClick={() => setIsDesktopCatOpen(false)}
                      className="px-4 py-2.5 text-[13px] font-semibold text-ink-600 hover:text-gold-700 hover:bg-gold-50 rounded-xl transition-all"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href="/servicios"
              className="text-[13px] font-semibold uppercase tracking-[0.15em] text-ink-500 hover:text-gold-600 transition-all duration-200 relative group"
            >
              Servicios
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold-500 transition-all group-hover:w-full" />
            </Link>
            <Link
              href="/historia"
              className="text-[13px] font-semibold uppercase tracking-[0.15em] text-ink-500 hover:text-gold-600 transition-all duration-200 relative group"
            >
              Historia
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold-500 transition-all group-hover:w-full" />
            </Link>
          </div>

          {/* Acciones */}
          <div className="flex items-center space-x-1">
            <Link
              href="/shop"
              className="p-2.5 text-ink-500 hover:text-ink-900 hover:bg-ink-50 rounded-full transition-all"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </Link>

            <Link
              href="/favorites"
              className="p-2.5 text-ink-500 hover:text-ink-900 hover:bg-ink-50 rounded-full transition relative group"
            >
              <HeartIcon
                className={`w-5 h-5 transition-colors ${
                  favCount > 0 ? 'text-gold-600 group-hover:fill-gold-600' : ''
                }`}
              />
              {favCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold-500 text-[9px] font-black text-cream-50 ring-2 ring-cream-50">
                  {favCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              className="p-2.5 text-ink-500 hover:text-ink-900 hover:bg-ink-50 rounded-full transition relative group"
            >
              <ShoppingBagIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink-900 text-[9px] font-black text-cream-50 ring-2 ring-cream-50">
                  {cartCount}
                </span>
              )}
            </Link>

            {isAdmin && (
              <button
                onClick={() => router.push('/admin')}
                className="hidden min-[1368px]:flex p-2.5 text-gold-600 hover:text-cream-50 hover:bg-gold-600 rounded-full transition-all"
                title="Panel de Administración"
              >
                <Cog6ToothIcon className="w-5 h-5" />
              </button>
            )}

            {!isLoggedIn ? (
              <button
                onClick={() => router.push('/login')}
                className="hidden min-[1368px]:flex items-center gap-2 px-4 py-2 ml-2 bg-ink-900 text-cream-50 rounded-full text-xs font-bold hover:bg-ink-800 transition-all active:scale-95"
              >
                <UserIcon className="w-4 h-4" />
                Ingresar
              </button>
            ) : (
              <div className="relative hidden min-[1368px]:block ml-2">
                <button
                  onClick={() => setIsDesktopMenuOpen(!isDesktopMenuOpen)}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-gold-50 text-gold-700 font-black text-xs border border-gold-100 hover:bg-gold-100/80 transition-all select-none active:scale-95 overflow-hidden"
                >
                  {profile?.image ? (
                    <img src={profile.image} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    userInitials
                  )}
                </button>

                {isDesktopMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDesktopMenuOpen(false)} />
                    <div className="absolute right-0 mt-3 w-64 bg-cream-50 rounded-2xl border border-ink-100 shadow-xl py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-3 border-b border-ink-50">
                        <p className="text-sm font-black text-ink-900 truncate">{profile?.name}</p>
                        <p className="text-[11px] text-ink-500 font-medium truncate">{profile?.email}</p>
                      </div>
                      <div className="p-2 space-y-0.5">
                        <Link
                          href="/profile"
                          className="flex items-center px-3 py-2.5 rounded-xl text-xs font-bold text-ink-600 hover:text-ink-950 hover:bg-ink-50 transition-all"
                          onClick={() => setIsDesktopMenuOpen(false)}
                        >
                          Mi Panel de Cliente
                        </Link>
                        <Link
                          href="/profile/pedidos"
                          className="flex items-center px-3 py-2.5 rounded-xl text-xs font-bold text-ink-600 hover:text-ink-950 hover:bg-ink-50 transition-all"
                          onClick={() => setIsDesktopMenuOpen(false)}
                        >
                          Historial de Pedidos
                        </Link>
                        <div className="border-t border-ink-100 my-1.5" />
                        <button
                          onClick={() => {
                            setIsDesktopMenuOpen(false);
                            handleSignOut();
                          }}
                          className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all"
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4" />
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="min-[1368px]:hidden flex items-center ml-2">
              <button
                onClick={() => setIsOpen(true)}
                className="p-2 rounded-xl text-ink-600 hover:bg-ink-50 transition"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      <div
        className={`fixed inset-0 z-[100] min-[1368px]:hidden transition-all duration-300 ${
          isOpen ? 'visible' : 'invisible'
        }`}
      >
        <div
          className={`fixed inset-0 bg-ink-950/40 backdrop-blur-sm transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsOpen(false)}
        />

        <div
          className={`fixed top-0 right-0 bottom-0 w-full max-w-[320px] bg-cream-50 h-dvh shadow-2xl flex flex-col p-6 transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between pb-6 border-b border-ink-100 shrink-0">
            <span className="font-serif text-2xl font-medium text-ink-900 tracking-tight">
              Cirelia<span className="text-gold-500">.</span>
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl text-ink-500 hover:bg-ink-100 active:scale-95 transition"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 flex flex-col py-6 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-5">
              <Link
                href="/"
                className="text-2xl font-semibold text-ink-900 hover:text-gold-600 transition tracking-tight"
                onClick={() => setIsOpen(false)}
              >
                Inicio
              </Link>

              <div>
                <button
                  onClick={() => setIsMobileCatOpen(!isMobileCatOpen)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span
                    className={`text-2xl font-semibold transition tracking-tight ${
                      isMobileCatOpen ? 'text-gold-600' : 'text-ink-900'
                    }`}
                  >
                    Categorías
                  </span>
                  <ChevronDownIcon
                    className={`w-6 h-6 text-ink-400 transition-transform duration-300 ${
                      isMobileCatOpen ? 'rotate-180 text-gold-600' : ''
                    }`}
                  />
                </button>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isMobileCatOpen ? 'grid-rows-[1fr] mt-4 opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="flex flex-col gap-3 pl-4 border-l-2 border-ink-100 ml-2">
                      {categories.map((cat) => (
                        <Link
                          key={cat.name}
                          href={cat.href}
                          className="text-lg font-semibold text-ink-500 hover:text-gold-600 transition tracking-tight py-1"
                          onClick={() => setIsOpen(false)}
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href="/servicios"
                className="text-2xl font-semibold text-ink-900 hover:text-gold-600 transition tracking-tight"
                onClick={() => setIsOpen(false)}
              >
                Servicios
              </Link>
              <Link
                href="/historia"
                className="text-2xl font-semibold text-ink-900 hover:text-gold-600 transition tracking-tight"
                onClick={() => setIsOpen(false)}
              >
                Historia
              </Link>
            </div>

            <div className="mt-auto pt-8">
              <div className="space-y-3 pt-6 border-t border-ink-100 shrink-0">
                {!isLoggedIn ? (
                  <button
                    onClick={() => router.push('/login')}
                    className="flex items-center justify-center gap-2 w-full bg-ink-900 text-cream-50 h-14 rounded-2xl font-black text-center active:scale-95 hover:bg-ink-800 transition-all text-xs uppercase tracking-wider shadow-md"
                  >
                    <UserIcon className="w-5 h-5 text-cream-200" />
                    Iniciar Sesión
                  </button>
                ) : (
                  <div className="bg-cream-100 rounded-3xl border border-ink-200/50 overflow-hidden transition-all duration-300">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="w-full flex items-center justify-between p-4 bg-cream-50 hover:bg-cream-100/80 transition-colors"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-10 h-10 rounded-full bg-gold-50 flex items-center justify-center text-gold-700 font-black text-sm border border-gold-100 overflow-hidden">
                          {profile?.image ? (
                            <img src={profile.image} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            userInitials
                          )}
                        </div>
                        <div className="max-w-37.5">
                          <h4 className="text-xs font-black text-ink-900 tracking-tight truncate">
                            {profile?.name}
                          </h4>
                          <p className="text-[10px] text-ink-400 font-medium truncate">{profile?.email}</p>
                        </div>
                      </div>
                      <ChevronDownIcon
                        className={`w-5 h-5 text-ink-400 transition-transform duration-300 shrink-0 ${
                          isUserMenuOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <div
                      className={`transition-all duration-300 overflow-hidden ${
                        isUserMenuOpen ? 'max-h-60 border-t border-ink-100 bg-cream-100/50' : 'max-h-0'
                      }`}
                    >
                      <div className="p-2 space-y-1">
                        <Link
                          href="/profile"
                          className="flex items-center gap-3 px-3 h-10 rounded-xl text-[11px] font-bold text-ink-600 hover:text-ink-950 hover:bg-ink-100 transition-all"
                          onClick={() => {
                            setIsOpen(false);
                            setIsUserMenuOpen(false);
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
                          Mi Panel de Cliente
                        </Link>
                        <Link
                          href="/profile/pedidos"
                          className="flex items-center gap-3 px-3 h-10 rounded-xl text-[11px] font-bold text-ink-600 hover:text-ink-950 hover:bg-ink-100 transition-all"
                          onClick={() => {
                            setIsOpen(false);
                            setIsUserMenuOpen(false);
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-ink-300" />
                          Historial de Pedidos
                        </Link>
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            handleSignOut();
                          }}
                          className="w-full flex items-center gap-3 px-3 h-10 rounded-xl text-[11px] font-bold text-red-600 hover:bg-red-50 transition-colors text-left"
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4 text-red-500" />
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/admin');
                    }}
                    className="w-full bg-gold-600 text-cream-50 py-3.5 rounded-xl font-black text-center shadow-md active:scale-95 transition text-xs flex items-center justify-center gap-2 mt-2"
                  >
                    <Cog6ToothIcon className="w-5 h-5 text-cream-100" />
                    Panel Administrador
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
