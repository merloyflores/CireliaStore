'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

interface CategoryRowProps {
  category: string;
  subtitle?: string; 
  products?: any[];
}

export default function CategoryRow({ 
  category, 
  subtitle = "Explora nuestra selección destacada.", 
  products = [] 
}: CategoryRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Asegurar que showcaseItems no cambie de referencia si los productos son los mismos
  const showcaseItems = (products || []).slice(0, 8); 

  // Verificar la posición de desplazamiento real
  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
    }
  };

  // Escuchar eventos de scroll y resize
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      checkScrollPosition();
      // Un pequeño delay para esperar que las imágenes rendericen y den el ancho real
      const timer = setTimeout(checkScrollPosition, 100);

      scrollContainer.addEventListener('scroll', checkScrollPosition);
      window.addEventListener('resize', checkScrollPosition);
      
      return () => {
        clearTimeout(timer);
        scrollContainer.removeEventListener('scroll', checkScrollPosition);
        window.removeEventListener('resize', checkScrollPosition);
      };
    }
  }, [products]); // Cambiado de showcaseItems a products (referencia estable)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      // Desplazamiento inteligente basado en pantallas
      const scrollAmount = clientWidth < 640 ? clientWidth * 0.85 : clientWidth * 0.75;
      scrollRef.current.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  if (showcaseItems.length === 0) return null;

  return (
    <div className="mb-20 relative px-4 md:px-0">
      {/* HEADER */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tighter capitalize">
            {category}
          </h2>
          <p className="text-zinc-500 font-medium text-xs sm:text-sm">{subtitle}</p>
        </div>
        
        <Link 
          href={category.toLowerCase() === "tendencias del momento" ? "/shop" : `/shop?category=${encodeURIComponent(category)}`} 
          className="text-xs sm:text-sm font-bold text-zinc-600 hover:text-zinc-950 transition-colors shrink-0 bg-zinc-100 sm:bg-transparent px-4 py-2 sm:p-0 rounded-full"
        >
          Ver todo →
        </Link>
      </div>

      {/* CONTENEDOR INTERACTIVO CON BOTONES ESTÉTICOS */}
      <div className="relative group/row">
        
        {/* Flecha Izquierda */}
        <button 
          onClick={() => scroll('left')} 
          className={`absolute -left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-white/95 backdrop-blur-md text-zinc-700 border border-zinc-200/60 rounded-full shadow-md transition-all duration-300 active:scale-95 cursor-pointer
            ${canScrollLeft ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}
            sm:group-hover/row:opacity-100`}
          aria-label="Deslizar izquierda"
        >
          <ChevronLeft size={18} />
        </button>

        {/* CONTENEDOR AJUSTADO: Ahora es un carrusel fluido horizontal en todos los breakpoints */}
        <div 
          ref={scrollRef} 
          className="flex gap-5 sm:gap-6 pt-2 pb-6 overflow-x-auto snap-x snap-mandatory hide-scrollbar items-start scroll-smooth"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {showcaseItems.map((product: any) => (
            <div 
              key={product.id} 
              className="flex-none w-[265px] sm:w-[290px] md:w-[310px] lg:w-[285px] snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Flecha Derecha */}
        <button 
          onClick={() => scroll('right')} 
          className={`absolute -right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-white/95 backdrop-blur-md text-zinc-700 border border-zinc-200/60 rounded-full shadow-md transition-all duration-300 active:scale-95 cursor-pointer
            ${canScrollRight ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}
            sm:group-hover/row:opacity-100`}
          aria-label="Deslizar derecha"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}