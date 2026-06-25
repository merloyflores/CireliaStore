'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Filter } from 'lucide-react';
import ProductCard from './ProductCard';

interface FeaturedMiniShopProps {
  featuredProducts: any[];
}

export default function FeaturedMiniShop({ featuredProducts }: FeaturedMiniShopProps) {
  const [activeFilter, setActiveFilter] = useState<string>('Todos');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Estados para controlar dinámicamente la visibilidad de las flechas (Solo aplican en móviles)
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Sacamos las categorías únicas de los productos destacados
  const categories = useMemo(() => {
    const cats = featuredProducts.map(p => p.category?.trim()).filter(Boolean);
    return ['Todos', ...Array.from(new Set(cats))];
  }, [featuredProducts]);

  // Aplicamos el filtro basado en el selector dinámico
  const displayedProducts = useMemo(() => {
    if (activeFilter === 'Todos') return featuredProducts;
    return featuredProducts.filter(p => p.category?.trim() === activeFilter);
  }, [featuredProducts, activeFilter]);

  // Verificar si hay espacio para hacer scroll a la izquierda o derecha en móvil
  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
    }
  };

  // Escuchar el scroll manual en dispositivos táctiles
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      checkScrollPosition();
      scrollContainer.addEventListener('scroll', checkScrollPosition);
      window.addEventListener('resize', checkScrollPosition);
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', checkScrollPosition);
      }
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [displayedProducts]);

  // Función para mover el carrusel en móvil/tablet
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.85;
      scrollRef.current.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  if (featuredProducts.length === 0) return null;

  return (
    <div className="mb-20 bg-zinc-50 rounded-4xl sm:rounded-[2.5rem] p-5 sm:p-8 md:p-12 border border-zinc-100 shadow-xl shadow-zinc-100/50">
      
      {/* HEADER PREMIUM: ALINEACIÓN ASIMÉTRICA CALCADA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 sm:mb-10 gap-6">
        <div className="space-y-1 sm:space-y-2">
          <span className="text-[10px] bg-sky-500 text-white px-2.5 py-1 rounded-full font-black tracking-widest uppercase">
            Selección del Editor
          </span>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-950 tracking-tighter mt-2">
            Colección <span className="italic font-serif text-zinc-400 font-normal">Destacada</span>
          </h3>
          <p className="text-zinc-500 font-medium text-xs sm:text-sm md:text-base max-w-xl">
            Una curaduría intencional de piezas exclusivas diseñadas para aportar carácter, confort y sofisticación a tus espacios favoritos.
          </p>
        </div>

        {/* SELECTOR "PRO" INTEGRADO DESDE LA DERECHA */}
        <div className="relative group min-w-55 w-full md:w-auto shrink-0">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Filter size={16} className="text-zinc-400 group-hover:text-sky-500 transition-colors" />
          </div>
          <select 
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="w-full appearance-none bg-white border border-zinc-200 text-sm font-bold text-zinc-800 rounded-full py-3.5 pl-11 pr-12 outline-none cursor-pointer hover:border-sky-500 hover:shadow-md focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all min-w-55"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'Todos' ? 'Todas las colecciones' : cat}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <ChevronDown size={16} className="text-zinc-400 group-hover:text-sky-500 transition-colors" />
          </div>
        </div>
      </div>

      {/* CONTENEDOR HÍBRIDO INTERACTIVO */}
      <div className="relative px-1 md:px-0">
        
        {/* Botón Izquierda Estético - Solo renderiza en móviles/tablets si hay scroll */}
        <button 
          onClick={() => scroll('left')} 
          className={`absolute -left-2 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-white/90 backdrop-blur-md text-zinc-700 border border-zinc-200/60 rounded-full shadow-md transition-all duration-300 active:scale-95 cursor-pointer md:hidden
            ${canScrollLeft ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}`}
          aria-label="Anterior"
        >
          <ChevronLeft size={18} />
        </button>

        {/* COMPONENTE HÍBRIDO: flex horizontal en móvil, grid limpio de 4 columnas en PC */}
        <div 
          ref={scrollRef} 
          className="flex overflow-x-auto md:grid md:grid-cols-2 lg:grid-cols-4 gap-5 pt-2 pb-8 md:pb-2 snap-x snap-mandatory hide-scrollbar items-start"
        >
          {displayedProducts.map((product) => (
            /* Usamos w-[265px] para calcar la estética premium de Unimart en teléfonos */
            <div 
              key={product.id} 
              className="flex-none w-66.25 md:w-auto snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
          
          {displayedProducts.length === 0 && (
            <div className="w-full text-center py-16 bg-white rounded-3xl border border-zinc-100 text-zinc-400 font-medium md:col-span-4">
              No hay artículos destacados en esta categoría actualmente.
            </div>
          )}
        </div>

        {/* Botón texturizado Derecha Estético */}
        <button 
          onClick={() => scroll('right')} 
          className={`absolute -right-2 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-white/90 backdrop-blur-md text-zinc-700 border border-zinc-200/60 rounded-full shadow-md transition-all duration-300 active:scale-95 cursor-pointer md:hidden
            ${canScrollRight ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}`}
          aria-label="Siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}