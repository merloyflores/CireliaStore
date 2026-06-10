'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Bars3Icon, 
  XMarkIcon, 
  ShoppingBagIcon, 
  MagnifyingGlassIcon, 
  HeartIcon,
  Cog6ToothIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useCartStore } from '../app/store/useCartStore'; 
import { usePathname, useRouter } from 'next/navigation';

// Definimos la interfaz para TypeScript
interface NavLink {
  name: string;
  href: string;
}

const DEFAULT_LINKS: NavLink[] = [
  { name: 'Inicio', href: '/' },
  { name: 'Hogar', href: '/hogar' },
  { name: 'Decoración', href: '/decoracion' },
  { name: 'Ofertas', href: '/ofertas' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  
  if (pathname.startsWith('/admin')) return null;

  // Estados de sesión simulada para la Demo
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(true); 
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false); // Controla móvil
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false); // Controla PC

  const [navLinks, setNavLinks] = useState<NavLink[]>([{ name: 'Inicio', href: '/' }]);
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
    async function fetchActiveCategories() {
      try {
        const res = await fetch('/api/categories?has_stock=true');
        if (!res.ok) throw new Error('Error al obtener categorías');
        const categories = await res.json();
        
        const dynamicLinks = categories.map((cat: any) => ({
          name: cat.name,
          href: `/categorias/${cat.slug || cat.id}`
        }));

        setNavLinks([
          { name: 'Inicio', href: '/' },
          ...dynamicLinks
        ]);
      } catch (error) {
        console.error('Error fetching dynamic categories, using fallback:', error);
        setNavLinks(DEFAULT_LINKS);
      }
    }

    fetchActiveCategories();
  }, []);

  const handleAdminNavigation = (e: React.MouseEvent) => {
    e.preventDefault();
    const isLogged = document.cookie.includes('admin_token=autenticado');
    if (isLogged) {
      router.push('/admin');
    } else {
      router.push('/admin/login');
    }
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/80 backdrop-blur-md border-b border-zinc-100 py-2' 
        : 'bg-white border-b border-transparent py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* LOGO CIRELIA */}
          <div className="shrink-0 flex items-center">
            <Link href="/" className="text-3xl font-black text-zinc-950 tracking-tighter hover:opacity-80 transition">
              Cirelia<span className="text-sky-600">.</span>
            </Link>
          </div>

          {/* LINKS DE NAVEGACIÓN DINÁMICOS (Escritorio) */}
          <div className="hidden md:flex items-center space-x-10">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href} 
                className="text-[13px] font-bold uppercase tracking-[0.15em] text-zinc-500 hover:text-sky-600 transition-all duration-200 relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-sky-600 transition-all group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* ICONOS Y ACCIONES (Escritorio / General) */}
          <div className="flex items-center space-x-1">
            <button className="p-2.5 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-full transition-all">
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>

            {/* FAVORITOS */}
            <Link href="/favorites" className="p-2.5 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-full transition relative group">
              <HeartIcon className={`w-5 h-5 transition-colors ${favCount > 0 ? 'text-red-500 group-hover:fill-red-500' : ''}`} />
              {favCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-2 ring-white">
                  {favCount}
                </span>
              )}
            </Link>
            
            {/* CARRITO */}
            <Link href="/cart" className="p-2.5 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-full transition relative group">
              <ShoppingBagIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-sky-600 text-[9px] font-black text-white ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* BOTÓN PANEL DE CONTROL ADMIN (Escritorio) */}
            <button 
              onClick={handleAdminNavigation}
              className="hidden md:flex p-2.5 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 rounded-full transition-all"
              title="Panel de Administración"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>

            {/* =======================================================
                NUEVO: MODO USUARIO / CLIENTE PARA PC (DESKTOP DROPDOWN)
                ======================================================= */}
            {!isUserLoggedIn ? (
              <Link 
                href="/auth" 
                className="hidden md:flex p-2.5 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-full transition-all"
                title="Iniciar Sesión"
              >
                <UserIcon className="w-5 h-5" />
              </Link>
            ) : (
              <div className="relative hidden md:block ml-1">
                {/* Avatar Gatillo PC */}
                <button 
                  onClick={() => setIsDesktopMenuOpen(!isDesktopMenuOpen)}
                  className="flex items-center justify-center w-9 h-9 rounded-xl bg-sky-50 text-sky-600 font-black text-xs border border-sky-100 hover:bg-sky-100/80 transition-all select-none active:scale-95"
                >
                  KC
                </button>

                {/* Menú Flotante Suspendido */}
                {isDesktopMenuOpen && (
                  <>
                    {/* Backdrop invisible para cerrar el menú al hacer clic fuera */}
                    <div className="fixed inset-0 z-10" onClick={() => setIsDesktopMenuOpen(false)} />
                    
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-zinc-100 shadow-xl py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-2.5 border-b border-zinc-50">
                        <p className="text-xs font-black text-zinc-900 truncate">Kevin Cascante</p>
                        <p className="text-[10px] text-zinc-400 font-medium truncate">kevin@nexflow.digital</p>
                      </div>
                      
                      <div className="p-1.5 space-y-0.5">
                        <Link 
                          href="/profile" 
                          className="flex items-center px-3 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 transition-all"
                          onClick={() => setIsDesktopMenuOpen(false)}
                        >
                          Mi Panel de Control
                        </Link>
                        <Link 
                          href="/profile?tab=pedidos" 
                          className="flex items-center px-3 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 transition-all"
                          onClick={() => setIsDesktopMenuOpen(false)}
                        >
                          Historial de Pedidos
                        </Link>
                        <Link 
                          href="/profile?tab=direcciones" 
                          className="flex items-center px-3 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 transition-all"
                          onClick={() => setIsDesktopMenuOpen(false)}
                        >
                          Direcciones Guardadas
                        </Link>
                        
                        <div className="border-t border-zinc-100 my-1.5" />
                        
                        <button 
                          onClick={() => {
                            setIsUserLoggedIn(false);
                            setIsDesktopMenuOpen(false);
                          }} 
                          className="w-full text-left flex items-center px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all"
                        >
                          Cerrar Sesión (Demo)
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* TRIGGER MENÚ MÓVIL */}
            <div className="md:hidden flex items-center ml-2">
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

      {/* =======================================================
          SIDEBAR MÓVIL DINÁMICO
          ======================================================= */}
      <div className={`fixed inset-0 z-100 md:hidden transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
        <div 
          className={`fixed inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsOpen(false)}
        />
        
        <div className={`fixed top-0 right-0 bottom-0 w-full max-w-[320px] bg-white h-full shadow-2xl flex flex-col p-6 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          
          <div className="flex items-center justify-between pb-6 border-b border-zinc-100">
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

          <div className="flex-1 flex flex-col justify-between py-8 overflow-y-auto">
            <div className="space-y-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block text-2xl font-black text-zinc-900 hover:text-sky-600 transition tracking-tighter"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            
            <div className="space-y-3 pt-6 border-t border-zinc-100">
              
              {/* ACCIÓN DE CUENTA MOVIL */}
              {!isUserLoggedIn ? (
                <Link 
                  href="/auth" 
                  className="flex items-center justify-center gap-2 w-full bg-zinc-100 text-zinc-900 h-14 rounded-2xl font-black text-center active:scale-95 hover:bg-zinc-200/80 transition-all text-xs uppercase tracking-wider"
                  onClick={() => setIsOpen(false)}
                >
                  <UserIcon className="w-4 h-4 text-zinc-500" />
                  Iniciar Sesión
                </Link>
              ) : (
                <div className="bg-zinc-50 rounded-[1.5rem] border border-zinc-200/50 overflow-hidden transition-all duration-300">
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="w-full flex items-center justify-between p-4 bg-white hover:bg-zinc-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 font-black text-sm border border-sky-100">
                        KC
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-zinc-900 tracking-tight">Kevin Cascante</h4>
                        <p className="text-[10px] text-zinc-400 font-medium">kevin@nexflow.digital</p>
                      </div>
                    </div>
                    <svg 
                      className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <div className={`transition-all duration-300 overflow-hidden ${
                    isUserMenuOpen ? 'max-h-60 border-t border-zinc-100 bg-zinc-50/50' : 'max-h-0'
                  }`}>
                    <div className="p-2 space-y-1">
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-3 h-10 rounded-xl text-[11px] font-bold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-all"
                        onClick={() => { setIsOpen(false); setIsUserMenuOpen(false); }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                        Mi Panel de Control
                      </Link>
                      <Link
                        href="/profile?tab=pedidos"
                        className="flex items-center gap-3 px-3 h-10 rounded-xl text-[11px] font-bold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-all"
                        onClick={() => { setIsOpen(false); setIsUserMenuOpen(false); }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                        Historial de Pedidos
                      </Link>
                      <Link
                        href="/profile?tab=direcciones"
                        className="flex items-center gap-3 px-3 h-10 rounded-xl text-[11px] font-bold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-all"
                        onClick={() => { setIsOpen(false); setIsUserMenuOpen(false); }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                        Direcciones Guardadas
                      </Link>
                      <button
                        onClick={() => {
                          setIsUserLoggedIn(false);
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 h-10 rounded-xl text-[11px] font-bold text-red-500 hover:bg-red-50 transition-colors text-left"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        Cerrar Sesión (Demo)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button 
                onClick={(e) => {
                  setIsOpen(false);
                  handleAdminNavigation(e);
                }}
                className="w-full bg-zinc-950 text-white py-4 rounded-2xl font-black text-center shadow-md active:scale-95 transition text-sm flex items-center justify-center gap-2"
              >
                <Cog6ToothIcon className="w-5 h-5 text-zinc-400" />
                Panel Administrador
              </button>
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
}