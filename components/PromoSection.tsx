'use client';

import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';
import { ChevronLeft, ChevronRight, ChevronDown, Filter, PackageX } from 'lucide-react';

interface PromoSectionProps {
  promoProducts: any[]; 
  // Añadimos allProducts para sacar todas las categorías vigentes de la tienda
  allProducts?: any[]; 
}

export default function PromoSection({ promoProducts, allProducts = [] }: PromoSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [activeIndex, setActiveIndex] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);

  // 1. Extraemos las categorías de TODOS los productos (si nos los pasan) o de promoProducts como plan B
  const categories = useMemo(() => {
    const source = allProducts.length > 0 ? allProducts : promoProducts;
    const cats = source.map(p => p.category?.trim()).filter(Boolean);
    return ['Todas', ...Array.from(new Set(cats))];
  }, [allProducts, promoProducts]);

  // 2. Filtramos los productos en promoción según la categoría seleccionada
  const filteredProducts = useMemo(() => {
    const filtered = selectedCategory === 'Todas' 
      ? promoProducts 
      : promoProducts.filter(p => p.category?.trim() === selectedCategory);
    
    // Reseteamos el índice si la nueva lista es más pequeña que el índice actual
    if (activeIndex >= filtered.length) setActiveIndex(0);
    return filtered;
  }, [promoProducts, selectedCategory, activeIndex]);

  const scrollGallery = (direction: 'left' | 'right') => {
    if (galleryRef.current) {
      const scrollAmount = 250;
      galleryRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  if (promoProducts.length === 0) return null;

  const activeProduct = filteredProducts[activeIndex];

  return (
    <div className="mb-20 bg-zinc-50 rounded-[2.5rem] p-8 md:p-12 border border-zinc-100 shadow-xl shadow-zinc-100">
      
      {/* HEADER MARKETINERO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl md:text-5xl font-black text-zinc-950 tracking-tighter">Ofertas Exclusivas</h2>
          <p className="text-zinc-500 font-medium text-sm md:text-base">¡No te quedes sin tus favoritos! Diseños premium a precios que no volverán.</p>
        </div>
        
        {/* SELECTOR "PRO" */}
        <div className="relative group min-w-[200px]">
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

      <div className="grid lg:grid-cols-12 gap-8 lg:gap-10">
        {/* LADO IZQUIERDO: BANNER TIPO HISTORIA */}
        <div className="lg:col-span-5 relative rounded-[2rem] overflow-hidden min-h-[500px] shadow-lg group">
          <img src="/ofertas.png" alt="Promoción" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8 flex flex-col justify-end">
            <Link href="/ofertas" className="bg-white text-zinc-950 py-4 px-8 rounded-full font-black text-center hover:bg-sky-500 hover:text-white transition-all duration-300 transform hover:-translate-y-1 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(2,132,199,0.3)]">
              COMPRAR AHORA
            </Link>
          </div>
        </div>

        {/* LADO DERECHO: GALERÍA INTERACTIVA O ESTADO VACÍO */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {filteredProducts.length > 0 ? (
            <>
              {/* PRODUCTO ACTIVO */}
              <div className="flex-grow bg-white rounded-[2rem] p-6 border border-zinc-100 shadow-sm flex items-center justify-center transition-all duration-500 hover:shadow-md">
                <div className="w-full max-w-2xl">
                  <ProductCard product={activeProduct} />
                </div>
              </div>

              {/* GALERÍA DE MINIATURAS ESTILIZADA */}
              <div className="relative bg-white rounded-[1.5rem] p-3 border border-zinc-100 flex items-center shadow-sm">
                
                <button 
                  onClick={() => scrollGallery('left')} 
                  className="absolute left-3 z-10 p-2.5 bg-white/90 backdrop-blur-md text-zinc-700 border border-zinc-100 rounded-full hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all duration-300 shadow-md group"
                >
                  <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
                
                <div ref={galleryRef} className="flex gap-4 overflow-x-auto hide-scrollbar px-14 py-2 w-full snap-x snap-mandatory">
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
                  className="absolute right-3 z-10 p-2.5 bg-white/90 backdrop-blur-md text-zinc-700 border border-zinc-100 rounded-full hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all duration-300 shadow-md group"
                >
                  <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </>
          ) : (
            /* ESTADO VACÍO ELEGANTE CUANDO LA CATEGORÍA NO TIENE PROMOCIONES */
            <div className="flex-grow bg-white rounded-[2rem] p-8 border border-zinc-100 shadow-sm flex flex-col items-center justify-center text-center transition-all duration-500 h-full min-h-[400px]">
              <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
                <PackageX size={32} className="text-zinc-300" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 mb-2">Sin ofertas por ahora</h3>
              <p className="text-zinc-500 max-w-sm">
                No tenemos productos en promoción para la categoría <span className="font-bold text-zinc-700">"{selectedCategory}"</span> en este momento. ¡Revisa nuestras otras secciones!
              </p>
              <button 
                onClick={() => setSelectedCategory('Todas')}
                className="mt-6 px-6 py-3 bg-zinc-100 text-zinc-900 font-bold rounded-full hover:bg-sky-500 hover:text-white transition-colors text-sm"
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