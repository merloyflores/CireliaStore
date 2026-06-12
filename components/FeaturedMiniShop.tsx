'use client';

import { useState, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Filter } from 'lucide-react';
import ProductCard from './ProductCard';

interface FeaturedMiniShopProps {
  featuredProducts: any[];
}

export default function FeaturedMiniShop({ featuredProducts }: FeaturedMiniShopProps) {
  const [activeFilter, setActiveFilter] = useState<string>('Todos');
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Función para mover el carrusel
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth > 1024 ? clientWidth * 0.75 : clientWidth * 0.9;
      scrollRef.current.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  if (featuredProducts.length === 0) return null;

  return (
    <div className="mb-16 relative max-w-[1400px] mx-auto px-4 md:px-8">
      
      {/* HEADER PREMIUM: ALINEACIÓN ASIMÉTRICA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div className="space-y-2">
          <h2 className="text-sm font-black text-sky-600 uppercase tracking-[0.2em]">
            Selección del Editor
          </h2>
          <h3 className="text-4xl md:text-5xl font-black text-zinc-950 tracking-tighter">
            Colección <span className="italic font-serif text-zinc-400 font-normal">Destacada</span>
          </h3>
          <p className="text-zinc-500 font-medium text-sm md:text-base max-w-xl">
            Una curaduría intencional de piezas exclusivas diseñadas para aportar carácter, confort y sofisticación a tus espacios favoritos.
          </p>
        </div>

        {/* SELECTOR "PRO" INTEGRADO DESDE LA DERECHA */}
        <div className="relative group min-w-[220px] w-full md:w-auto shrink-0">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Filter size={16} className="text-zinc-400 group-hover:text-sky-500 transition-colors" />
          </div>
          <select 
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="w-full md:w-auto appearance-none bg-white border border-zinc-200 text-sm font-bold text-zinc-800 rounded-full py-3.5 pl-11 pr-12 outline-none cursor-pointer hover:border-sky-500 hover:shadow-md focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all min-w-[220px]"
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

      {/* CONTENEDOR DEL CARRUSEL Y BOTONES INTERACTIVOS */}
      <div className="relative group/carousel">
        
        {/* Botón Izquierda con efecto cristal */}
        {displayedProducts.length > 4 && (
          <button 
            onClick={() => scroll('left')} 
            className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/90 backdrop-blur-md text-zinc-700 border border-zinc-100 rounded-full shadow-xl opacity-0 group-hover/carousel:opacity-100 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all duration-300 hidden md:block"
            aria-label="Anterior"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {/* CARRUSEL DE PRODUCTOS */}
        <div 
          ref={scrollRef} 
          className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory hide-scrollbar items-stretch"
        >
          {displayedProducts.map((product) => (
            <div 
              key={product.id} 
              className="flex-none w-[85vw] sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)] snap-start h-full"
            >
              <ProductCard product={product} />
            </div>
          ))}
          
          {displayedProducts.length === 0 && (
            <div className="w-full text-center py-16 bg-white rounded-3xl border border-zinc-100 text-zinc-400 font-medium">
              No hay artículos destacados en esta categoría actualmente.
            </div>
          )}
        </div>

        {/* Botón Derecha con efecto cristal */}
        {displayedProducts.length > 4 && (
          <button 
            onClick={() => scroll('right')} 
            className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/90 backdrop-blur-md text-zinc-700 border border-zinc-100 rounded-full shadow-xl opacity-0 group-hover/carousel:opacity-100 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all duration-300 hidden md:block"
            aria-label="Siguiente"
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}