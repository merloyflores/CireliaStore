'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { 
  Bars3Icon, 
  XMarkIcon, 
  ShoppingBagIcon, 
  MagnifyingGlassIcon, 
  HeartIcon,
  Cog6ToothIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon // Añadido para los menús desplegables
} from '@heroicons/react/24/outline';
import { useCartStore } from '../app/store/useCartStore'; 
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface NavLink {
  name: string;
  href: string;
}

const DEFAULT_CATEGORIES: NavLink[] = [
  { name: 'Hogar', href: '/hogar' },
  { name: 'Decoración', href: '/decoracion' },
  { name: 'Ofertas', href: '/ofertas' },
];

const ADMIN_EMAILS = [
  'merloy123@gmail.com', 
  'emaros09@gmail.com'
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  
  if (pathname.startsWith('/admin')) return null;

  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated';
  
  const isAdmin = session?.user?.email ? ADMIN_EMAILS.includes(session.user.email) : false;

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  
  // Separamos las categorías del resto de enlaces
  const [categories, setCategories] = useState<NavLink[]>([]);
  
  // Estados para los menús desplegables de categorías
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
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    async function fetchActiveCategories() {
      try {
        const { data: catData, error } = await supabase
          .from('categories')
          .select('id, name, slug')
          .order('name', { ascending: true });

        if (error) throw error;

        if (catData && catData.length > 0) {
          const dynamicLinks = catData.map((cat: any) => ({
            name: cat.name,
            href: `/${cat.slug || cat.id}` 
          }));
          setCategories(dynamicLinks);
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      } catch (error) {
        console.error('Error conectando a Supabase para las categorías:', error);
        setCategories(DEFAULT_CATEGORIES); 
      }
    }

    fetchActiveCategories();
  }, []);

  const userInitials = session?.user?.name 
    ? session.user.name.substring(0, 2).toUpperCase() 
    : 'U';

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/80 backdrop-blur-md border-b border-zinc-100 py-2 shadow-sm' 
        : 'bg-white border-b border-transparent py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="shrink-0 flex items-center">
            <Link href="/" className="text-3xl font-black text-zinc-950 tracking-tighter hover:opacity-80 transition">
              Cirelia<span className="text-sky-600">.</span>
            </Link>
          </div>

          {/* Enlaces de Escritorio (Ocultos en 1368px o menos) */}
          <div className="hidden min-[1368px]:flex items-center space-x-10 relative">
            
            {/* Enlace Fijo: Inicio */}
            <Link href="/" className="text-[13px] font-bold uppercase tracking-[0.15em] text-zinc-500 hover:text-sky-600 transition-all duration-200 relative group">
              Inicio
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-sky-600 transition-all group-hover:w-full" />
            </Link>

            {/* Menú Desplegable: Categorías */}
            <div 
              className="relative group"
              onMouseEnter={() => setIsDesktopCatOpen(true)}
              onMouseLeave={() => setIsDesktopCatOpen(false)}
            >
              <button className="flex items-center gap-1 text-[13px] font-bold uppercase tracking-[0.15em] text-zinc-500 hover:text-sky-600 transition-all duration-200 py-2">
                Categorías
                <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isDesktopCatOpen ? 'rotate-180 text-sky-600' : ''}`} />
              </button>
              
              {/* Dropdown flotante */}
              <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 w-64 transition-all duration-300 origin-top ${
                isDesktopCatOpen ? 'opacity-100 scale-y-100 visible' : 'opacity-0 scale-y-95 invisible'
              }`}>
                <div className="bg-white border border-zinc-100 shadow-xl rounded-2xl p-3 max-h-[60vh] overflow-y-auto flex flex-col gap-1 custom-scrollbar">
                  {categories.map((cat) => (
                    <Link 
                      key={cat.name} 
                      href={cat.href}
                      onClick={() => setIsDesktopCatOpen(false)}
                      className="px-4 py-2.5 text-[13px] font-bold text-zinc-600 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Enlaces Fijos Adicionales */}
            <Link href="/servicios" className="text-[13px] font-bold uppercase tracking-[0.15em] text-zinc-500 hover:text-sky-600 transition-all duration-200 relative group">
              Servicios
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-sky-600 transition-all group-hover:w-full" />
            </Link>
            <Link href="/historia" className="text-[13px] font-bold uppercase tracking-[0.15em] text-zinc-500 hover:text-sky-600 transition-all duration-200 relative group">
              Historia
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-sky-600 transition-all group-hover:w-full" />
            </Link>

          </div>

          {/* Botones de Acción (Lupa, Favoritos, Carrito, Usuario) */}
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => alert("Acá podés conectar tu modal de búsqueda")}
              className="p-2.5 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-full transition-all"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>

            <Link href="/favorites" className="p-2.5 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-full transition relative group">
              <HeartIcon className={`w-5 h-5 transition-colors ${favCount > 0 ? 'text-red-500 group-hover:fill-red-500' : ''}`} />
              {favCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-2 ring-white">
                  {favCount}
                </span>
              )}
            </Link>
            
            <Link href="/cart" className="p-2.5 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-full transition relative group">
              <ShoppingBagIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-sky-600 text-[9px] font-black text-white ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {isAdmin && (
              <button 
                onClick={() => router.push('/admin')}
                className="hidden min-[1368px]:flex p-2.5 text-sky-600 hover:text-white hover:bg-sky-600 rounded-full transition-all"
                title="Panel de Administración"
              >
                <Cog6ToothIcon className="w-5 h-5" />
              </button>
            )}

            {!isLoggedIn ? (
              <button 
                onClick={() => signIn('google')}
                className="hidden min-[1368px]:flex items-center gap-2 px-4 py-2 ml-2 bg-zinc-950 text-white rounded-full text-xs font-bold hover:bg-zinc-800 transition-all active:scale-95"
              >
                <UserIcon className="w-4 h-4" />
                Ingresar
              </button>
            ) : (
              <div className="relative hidden min-[1368px]:block ml-2">
                <button 
                  onClick={() => setIsDesktopMenuOpen(!isDesktopMenuOpen)}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-sky-50 text-sky-600 font-black text-xs border border-sky-100 hover:bg-sky-100/80 transition-all select-none active:scale-95 overflow-hidden"
                >
                  {session.user?.image ? (
                    <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    userInitials
                  )}
                </button>

                {isDesktopMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDesktopMenuOpen(false)} />
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl border border-zinc-100 shadow-xl py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-3 border-b border-zinc-50">
                        <p className="text-sm font-black text-zinc-900 truncate">{session.user?.name}</p>
                        <p className="text-[11px] text-zinc-500 font-medium truncate">{session.user?.email}</p>
                      </div>
                      <div className="p-2 space-y-0.5">
                        <Link href="/profile" className="flex items-center px-3 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 transition-all" onClick={() => setIsDesktopMenuOpen(false)}>Mi Panel de Cliente</Link>
                        <Link href="/profile?tab=pedidos" className="flex items-center px-3 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 transition-all" onClick={() => setIsDesktopMenuOpen(false)}>Historial de Pedidos</Link>
                        <div className="border-t border-zinc-100 my-1.5" />
                        <button onClick={() => { setIsDesktopMenuOpen(false); signOut({ callbackUrl: '/' }); }} className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all">
                          <ArrowRightOnRectangleIcon className="w-4 h-4" />
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Menú Hamburguesa */}
            <div className="min-[1368px]:hidden flex items-center ml-2">
              <button
                onClick={() => setIsOpen(true)}
                className="p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 transition"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL / MENÚ MÓVIL LATERAL */}
      <div className={`fixed inset-0 z-[100] min-[1368px]:hidden transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
        <div 
          className={`fixed inset-0 bg-zinc-950/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsOpen(false)}
        />
        
        <div className={`fixed top-0 right-0 bottom-0 w-full max-w-[320px] bg-white h-dvh shadow-2xl flex flex-col p-6 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          
          <div className="flex items-center justify-between pb-6 border-b border-zinc-100 shrink-0">
            <span className="text-2xl font-black text-zinc-950 tracking-tighter">
              Cirelia<span className="text-sky-600">.</span>
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 active:scale-95 transition"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Contenedor Scrollable del Menú Móvil */}
          <div className="flex-1 flex flex-col py-6 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-5">
              
              <Link href="/" className="text-2xl font-black text-zinc-900 hover:text-sky-600 transition tracking-tighter" onClick={() => setIsOpen(false)}>
                Inicio
              </Link>

              {/* Acordeón de Categorías para Móvil */}
              <div>
                <button 
                  onClick={() => setIsMobileCatOpen(!isMobileCatOpen)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className={`text-2xl font-black transition tracking-tighter ${isMobileCatOpen ? 'text-sky-600' : 'text-zinc-900'}`}>
                    Categorías
                  </span>
                  <ChevronDownIcon className={`w-6 h-6 text-zinc-400 transition-transform duration-300 ${isMobileCatOpen ? 'rotate-180 text-sky-600' : ''}`} />
                </button>
                
                {/* Lista colapsable */}
                <div className={`grid transition-all duration-300 ease-in-out ${isMobileCatOpen ? 'grid-rows-[1fr] mt-4 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="flex flex-col gap-3 pl-4 border-l-2 border-zinc-100 ml-2">
                      {categories.map((cat) => (
                        <Link
                          key={cat.name}
                          href={cat.href}
                          className="text-lg font-bold text-zinc-500 hover:text-sky-600 transition tracking-tight py-1"
                          onClick={() => setIsOpen(false)}
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Link href="/servicios" className="text-2xl font-black text-zinc-900 hover:text-sky-600 transition tracking-tighter" onClick={() => setIsOpen(false)}>
                Servicios
              </Link>
              <Link href="/historia" className="text-2xl font-black text-zinc-900 hover:text-sky-600 transition tracking-tighter" onClick={() => setIsOpen(false)}>
                Historia
              </Link>

            </div>
            
            {/* Sección Inferior del Móvil (Login / Usuario) */}
            <div className="mt-auto pt-8">
              <div className="space-y-3 pt-6 border-t border-zinc-100 shrink-0">
                {!isLoggedIn ? (
                  <button 
                    onClick={() => signIn('google')}
                    className="flex items-center justify-center gap-2 w-full bg-zinc-950 text-white h-14 rounded-2xl font-black text-center active:scale-95 hover:bg-zinc-800 transition-all text-xs uppercase tracking-wider shadow-md"
                  >
                    <UserIcon className="w-5 h-5 text-zinc-300" />
                    Iniciar Sesión
                  </button>
                ) : (
                  <div className="bg-zinc-50 rounded-3xl border border-zinc-200/50 overflow-hidden transition-all duration-300">
                    <button 
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="w-full flex items-center justify-between p-4 bg-white hover:bg-zinc-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-sky-600 font-black text-sm border border-sky-100 overflow-hidden">
                          {session.user?.image ? <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" /> : userInitials}
                        </div>
                        <div className="max-w-37.5">
                          <h4 className="text-xs font-black text-zinc-900 tracking-tight truncate">{session.user?.name}</h4>
                          <p className="text-[10px] text-zinc-400 font-medium truncate">{session.user?.email}</p>
                        </div>
                      </div>
                      <ChevronDownIcon className={`w-5 h-5 text-zinc-400 transition-transform duration-300 shrink-0 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <div className={`transition-all duration-300 overflow-hidden ${
                      isUserMenuOpen ? 'max-h-60 border-t border-zinc-100 bg-zinc-50/50' : 'max-h-0'
                    }`}>
                      <div className="p-2 space-y-1">
                        <Link href="/profile" className="flex items-center gap-3 px-3 h-10 rounded-xl text-[11px] font-bold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-all" onClick={() => { setIsOpen(false); setIsUserMenuOpen(false); }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                          Mi Panel de Cliente
                        </Link>
                        <Link href="/profile?tab=pedidos" className="flex items-center gap-3 px-3 h-10 rounded-xl text-[11px] font-bold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-all" onClick={() => { setIsOpen(false); setIsUserMenuOpen(false); }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                          Historial de Pedidos
                        </Link>
                        <button onClick={() => { setIsOpen(false); signOut({ callbackUrl: '/' }); }} className="w-full flex items-center gap-3 px-3 h-10 rounded-xl text-[11px] font-bold text-red-600 hover:bg-red-50 transition-colors text-left">
                          <ArrowRightOnRectangleIcon className="w-4 h-4 text-red-500" />
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <button 
                    onClick={() => { setIsOpen(false); router.push('/admin'); }}
                    className="w-full bg-sky-600 text-white py-3.5 rounded-xl font-black text-center shadow-md active:scale-95 transition text-xs flex items-center justify-center gap-2 mt-2"
                  >
                    <Cog6ToothIcon className="w-5 h-5 text-sky-100" />
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