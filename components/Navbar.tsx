'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bars3Icon, 
  XMarkIcon, 
  ShoppingBagIcon, 
  MagnifyingGlassIcon, 
  HeartIcon,
  Cog6ToothIcon // Icono elegante para la administración
} from '@heroicons/react/24/outline';
import { useCartStore } from '../app/store/useCartStore'; 
import { usePathname } from 'next/navigation';

const navLinks = [
  { name: 'Inicio', href: '/' },
  { name: 'Hogar', href: '/hogar' },
  { name: 'Decoración', href: '/decoracion' },
  { name: 'Ofertas', href: '/ofertas' },
];

export default function Navbar() {
  const pathname = usePathname();
  
  // Si estamos en cualquier ruta de /admin, el Navbar público desaparece
  if (pathname.startsWith('/admin')) return null;
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // 1. Suscripción reactiva a ambos estados
  const cart = useCartStore((state) => state.cart);
  const favorites = useCartStore((state) => state.favorites);
  
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const favCount = favorites.length;

  // 2. Efecto de vidrio (glassmorphism) al hacer scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

          {/* LINKS DE NAVEGACIÓN */}
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

          {/* ICONOS Y ACCIONES */}
          <div className="flex items-center space-x-1">
            <button className="p-2.5 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-full transition-all">
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>

            {/* FAVORITOS CON CONTADOR ANIMADO */}
            <Link href="/favorites" className="p-2.5 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-full transition relative group">
              <HeartIcon className={`w-5 h-5 transition-colors ${favCount > 0 ? 'text-red-500 group-hover:fill-red-500' : ''}`} />
              {favCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-2 ring-white animate-in zoom-in duration-300">
                  {favCount}
                </span>
              )}
            </Link>
            
            {/* CARRITO CON CONTADOR SKY */}
            <Link href="/cart" className="p-2.5 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-full transition relative group">
              <ShoppingBagIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-sky-600 text-[9px] font-black text-white ring-2 ring-white animate-in zoom-in duration-300">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* BOTÓN PANEL DE CONTROL (Escritorio) */}
            <Link 
              href="/admin/dashboard" 
              className="hidden md:flex p-2.5 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 rounded-full transition-all"
              title="Panel de Administración"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </Link>
            
            {/* MENÚ MÓVIL TRIGGER */}
            <div className="md:hidden flex items-center ml-2">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 transition"
              >
                {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MENÚ MÓVIL DESPLEGABLE */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[450px] opacity-100 border-t border-zinc-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 py-8 space-y-4 bg-white">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="block text-xl font-black text-zinc-900 hover:text-sky-600 transition tracking-tighter"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          
          <div className="pt-4 space-y-3">
            <Link 
              href="/auth" 
              className="block w-full bg-zinc-100 text-zinc-900 py-4 rounded-2xl font-bold text-center active:scale-95 transition text-sm"
              onClick={() => setIsOpen(false)}
            >
              Mi Cuenta
            </Link>

            {/* BOTÓN PANEL DE CONTROL (Móvil - Pensado para un acceso rápido y cómodo) */}
            <Link 
              href="/admin/dashboard" 
              className="block w-full bg-zinc-950 text-white py-4 rounded-2xl font-black text-center shadow-md active:scale-95 transition text-sm flex items-center justify-center gap-2"
              onClick={() => setIsOpen(false)}
            >
              <Cog6ToothIcon className="w-5 h-5 text-zinc-400" />
              Panel Administrador
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}