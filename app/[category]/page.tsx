'use client';

import { useState, useEffect, SetStateAction } from 'react';
import { useParams } from 'next/navigation';
import { AdjustmentsHorizontalIcon, SparklesIcon } from '@heroicons/react/24/outline';

// Importación de tus componentes reales mapeados desde tu árbol de archivos
import CategoryMultiFilter from '@/components/CategoryMultiFilter';
import SortSelector from '@/components/SortSelector';
import LimitSelector from '@/components/LimitSelector';
import ProductCard from '@/components/ProductCard';

interface Product {
  id: string | number;
  name: string;
  price: number;
  oldPrice?: number;
  category: string;
  isOffer: boolean;
  images?: string[];
  slug: string;
}

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;

  // Estados de control para conectar tus componentes selectores y filtros
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [limit, setLimit] = useState<number>(12);
  const [selectedFilters, setSelectedFilters] = useState<any>({
    priceRange: [],
    subcategories: [],
  });

  // Títulos adaptados premium
  const titles: Record<string, { main: string; subtitle: string }> = {
    hogar: { main: 'Mobiliario & Hogar', subtitle: 'Arquitectura interna funcional y minimalista.' },
    decoracion: { main: 'Decoración de Autor', subtitle: 'Detalles mínimos que capturan miradas.' },
    ofertas: { main: 'Precios Especiales', subtitle: 'Piezas exclusivas con oportunidad de inversión limitada.' },
  };

  const currentMeta = titles[categorySlug] || { main: 'Catálogo Cirelia', subtitle: 'Colección exclusiva de piezas de diseño.' };

  // Efecto central para alimentar la página con tu base de datos o API real
  useEffect(() => {
    async function fetchFilteredProducts() {
      setLoading(true);
      try {
        // Construcción de la Query string usando tus estados dinámicos
        const queryParams = new URLSearchParams({
          category: categorySlug,
          sort: sortBy,
          limit: limit.toString(),
          filters: JSON.stringify(selectedFilters)
        });

        const res = await fetch(`/api/products?${queryParams.toString()}`);
        if (!res.ok) throw new Error('Error al sincronizar el catálogo');
        
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error('Error cargando los productos reales:', error);
        // Fallback sutil vacío o controlado para producción
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchFilteredProducts();
  }, [categorySlug, sortBy, limit, selectedFilters]);

  return (
    <div className="bg-white min-h-screen text-zinc-950 pb-24 relative">
      
      {/* HEADER DE CATEGORÍA */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 border-b border-zinc-100">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-black uppercase text-sky-600 tracking-[0.2em]">Colección Cirelia</span>
          {categorySlug === 'ofertas' && (
            <span className="bg-red-50 text-red-600 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Exclusivo
            </span>
          )}
        </div>
        <h1 className="text-4xl font-black tracking-tighter sm:text-5xl text-zinc-900 capitalize">
          {currentMeta.main}
        </h1>
        <p className="text-sm text-zinc-500 mt-2 font-medium max-w-2xl">
          {currentMeta.subtitle}
        </p>
      </header>

      {/* CUERPO DEL CATÁLOGO */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* BARRA DE ACCIONES SUPERIOR (Ordenamiento y Límites rápidos) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-zinc-100">
          <div className="text-xs text-zinc-500 font-bold">
            {loading ? (
              <span>Sincronizando existencias...</span>
            ) : (
              <span>Mostrando <strong className="text-zinc-900">{products.length}</strong> piezas exclusivas</span>
            )}
          </div>
          
          {/* Integración directa de tus selectores dinámicos */}
          <div className="flex items-center gap-4 self-end sm:self-auto">
            <SortSelector />
            <LimitSelector currentLimit={limit.toString()} />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* BARRA LATERAL: MultiFiltro Estructural */}
          <aside className="w-full lg:w-64 shrink-0 hidden lg:block">
            <div className="sticky top-28 space-y-6">
              <div className="flex items-center gap-2 text-zinc-900 font-black text-xs uppercase tracking-wider pb-4 border-b border-zinc-100">
                <AdjustmentsHorizontalIcon className="w-4 h-4 text-zinc-500" />
                Filtros Estructurados
              </div>
              
              {/* Tu componente real encargado de manejar estados complejos de filtrado */}
              <CategoryMultiFilter categories={[]} />
            </div>
          </aside>

          {/* REJILLA DE PRODUCTOS */}
          <main className="flex-1">
            {loading ? (
              /* Shimmer / Skeleton fluido premium para transiciones de carga */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-4 animate-pulse">
                    <div className="aspect-4/5 bg-zinc-100 rounded-3xl w-full" />
                    <div className="h-4 bg-zinc-100 rounded-md w-3/4" />
                    <div className="h-4 bg-zinc-100 rounded-md w-1/4" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              /* Estado vacío estilizado */
              <div className="text-center py-24 bg-zinc-50/50 rounded-4xl border border-zinc-100">
                <SparklesIcon className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                <h3 className="text-sm font-black text-zinc-800">No hay existencias disponibles</h3>
                <p className="text-xs text-zinc-400 font-medium mt-1">Intentá ajustando tus filtros avanzados o el ordenamiento.</p>
              </div>
            ) : (
              /* Tu componente ProductCard real inyectado perfectamente en el Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                {products.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                  />
                ))}
              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  );
}