'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';
import { ChevronLeft, ChevronRight, ChevronDown, Filter, PackageX } from 'lucide-react';

interface PromoSectionProps {
  promoProducts: any[]; 
  allProducts?: any[]; 
}

export default function PromoSection({ promoProducts, allProducts = [] }: PromoSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [activeIndex, setActiveIndex] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);
  const mobileCarouselRef = useRef<HTMLDivElement>(null);

  // Control de flechas para las miniaturas en escritorio
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const categories = useMemo(() => {
    const source = allProducts.length > 0 ? allProducts : promoProducts;
    const cats = source.map(p => p.category?.trim()).filter(Boolean);
    return ['Todas', ...Array.from(new Set(cats))];
  }, [allProducts, promoProducts]);

  const filteredProducts = useMemo(() => {
    const filtered = selectedCategory === 'Todas' 
      ? promoProducts 
      : promoProducts.filter(p => p.category?.trim() === selectedCategory);
    
    if (activeIndex >= filtered.length) setActiveIndex(0);
    return filtered;
  }, [promoProducts, selectedCategory, activeIndex]);

  const checkGalleryScroll = () => {
    if (galleryRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = galleryRef.current;
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
    }
  };

  useEffect(() => {
    const scrollContainer = galleryRef.current;
    if (scrollContainer) {
      checkGalleryScroll();
      scrollContainer.addEventListener('scroll', checkGalleryScroll);
      window.addEventListener('resize', checkGalleryScroll);
    }
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', checkGalleryScroll);
      }
      window.removeEventListener('resize', checkGalleryScroll);
    };
  }, [filteredProducts]);

  const scrollGallery = (direction: 'left' | 'right') => {
    if (galleryRef.current) {
      const scrollAmount = 250;
      galleryRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  if (promoProducts.length === 0) return null;

  const activeProduct = filteredProducts[activeIndex];

  return (
    <div className="mb-20 bg-zinc-50 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 md:p-12 border border-zinc-100 shadow-xl shadow-zinc-100/50">
      
      {/* HEADER MARKETINERO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 sm:mb-10 gap-6">
        <div className="space-y-1 sm:space-y-2">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-950 tracking-tighter">Ofertas Exclusivas</h2>
          <p className="text-zinc-500 font-medium text-xs sm:text-sm md:text-base">¡No te quedes sin tus favoritos! Diseños premium a precios que no volverán.</p>
        </div>
        
        {/* SELECTOR "PRO" */}
        <div className="relative group w-full md:w-auto min-w-[200px]">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Filter size={16} className="text-zinc-400 group-hover:text-sky-500 transition-colors" />
          </div>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full appearance-none bg-white border border-zinc-200 text-sm font-bold text-zinc-800 rounded-full py-3.5 pl-11 pr-12 outline-none cursor-pointer hover:border-sky-500 hover:shadow-md focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <ChevronDown size={16} className="text-zinc-400 group-hover:text-sky-500 transition-colors" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-start">
        
        {/* BANNER ENMARCADO COMPLETO (Sufre auto-ajuste fluido en móvil/tablet y mantiene verticalidad en PC) */}
        <div className="lg:col-span-5 relative rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden w-full shadow-md group shrink-0 bg-zinc-950 lg:h-full lg:min-h-[550px]">
          
          {/* Modo Móvil y Tablet: Enmarcado perfecto con object-contain sin desbordes */}
          <Link href="/ofertas" className="block lg:hidden w-full h-full">
            <img 
              src="/ofertashorizontal.png" 
              alt="Promoción Móvil" 
              className="w-full h-auto max-h-[320px] object-contain mx-auto transition-transform duration-700 group-hover:scale-102 block" 
            />
          </Link>
          
          {/* Modo Escritorio: Mantiene la estructura vertical clásica */}
          <div className="hidden lg:block w-full h-full absolute inset-0">
            <img 
              src="/ofertas.png" 
              alt="Promoción Escritorio" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8 flex flex-col justify-end gap-4">
              <div className="text-white">
                <span className="text-[10px] bg-sky-500 px-2.5 py-1 rounded-full font-black tracking-widest uppercase">Especial</span>
                <h4 className="text-2xl font-black tracking-tight mt-2 drop-shadow-sm">Hasta -50% Off</h4>
              </div>
              <Link href="/ofertas" className="bg-white text-zinc-950 py-4 px-8 rounded-full font-black text-sm text-center hover:bg-sky-500 hover:text-white transition-all duration-300 shadow-md whitespace-nowrap">
                COMPRAR AHORA
              </Link>
            </div>
          </div>

        </div>

        {/* CONTENEDOR DE PRODUCTOS CON ESTRATEGIA HÍBRIDA */}
        <div className="lg:col-span-7 w-full">
          
          {filteredProducts.length > 0 ? (
            <>
              {/* COMPORTAMIENTO MÓVIL: Carrusel horizontal directo de tarjetas (Estilo Unimart) */}
              <div className="block lg:hidden">
                <div 
                  ref={mobileCarouselRef}
                  className="flex overflow-x-auto gap-5 pt-2 pb-8 hide-scrollbar snap-x snap-mandatory items-start"
                >
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="flex-none w-[265px] snap-start">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>

              {/* COMPORTAMIENTO PC: Vista premium de producto activo enfocado + miniaturas */}
              <div className="hidden lg:flex lg:flex-col lg:gap-6">
                {/* PRODUCTO ACTIVO */}
                <div className="bg-white rounded-[2rem] p-6 border border-zinc-100 shadow-sm flex items-center justify-center transition-all duration-500 hover:shadow-md min-h-[420px]">
                  <div className="w-full max-w-2xl">
                    <ProductCard product={activeProduct} />
                  </div>
                </div>

                {/* GALERÍA DE MINIATURAS EXCLUSIVA PC */}
                <div className="relative bg-white rounded-[1.5rem] p-3 border border-zinc-100 flex items-center shadow-sm group/gallery">
                  
                  <button 
                    onClick={() => scrollGallery('left')} 
                    className={`absolute left-3 z-10 p-2.5 bg-white/90 backdrop-blur-md text-zinc-700 border border-zinc-200/60 rounded-full transition-all duration-300 shadow-md group ${
                      canScrollLeft ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
                    }`}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  
                  <div ref={galleryRef} className="flex gap-4 overflow-x-auto hide-scrollbar px-12 py-1 w-full snap-x snap-mandatory">
                    {filteredProducts.map((p, idx) => (
                      <button 
                        key={p.id}
                        onClick={() => setActiveIndex(idx)}
                        className={`relative w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden snap-center transition-all duration-300 outline-none ${
                          activeIndex === idx 
                            ? 'ring-2 ring-offset-2 ring-sky-500 scale-105 shadow-md' 
                            : 'border border-zinc-200 hover:border-zinc-300 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={p.image_url || '/placeholder.jpg'} alt={p.name} className="w-full h-full object-cover" />
                        {activeIndex !== idx && <div className="absolute inset-0 bg-zinc-900/10 transition-opacity" />}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => scrollGallery('right')} 
                    className={`absolute right-3 z-10 p-2.5 bg-white/90 backdrop-blur-md text-zinc-700 border border-zinc-200/60 rounded-full transition-all duration-300 shadow-md group ${
                      canScrollRight ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
                    }`}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* ESTADO VACÍO ELEGANTE */
            <div className="w-full bg-white rounded-[1.5rem] sm:rounded-[2rem] p-8 border border-zinc-100 shadow-sm flex flex-col items-center justify-center text-center transition-all duration-500 min-h-[350px]">
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                <PackageX size={28} className="text-zinc-300" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 mb-1">Sin ofertas por ahora</h3>
              <p className="text-zinc-500 text-sm max-w-sm">
                No tenemos productos en promoción para la categoría <span className="font-bold text-zinc-700">"{selectedCategory}"</span>. ¡Revisa nuestras otras colecciones!
              </p>
              <button 
                onClick={() => setSelectedCategory('Todas')}
                className="mt-5 px-5 py-2.5 bg-zinc-100 text-zinc-900 font-bold rounded-full hover:bg-sky-500 hover:text-white transition-colors text-xs sm:text-sm"
              >
                Ver todas las ofertas
              </button>
            </div>
          )}
          
        </div>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}