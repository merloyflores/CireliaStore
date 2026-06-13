import { supabase } from '@/lib/supabase';
import { AdjustmentsHorizontalIcon, SparklesIcon } from '@heroicons/react/24/outline';

import CategoryMultiFilter from '@/components/CategoryMultiFilter';
import SortSelector from '@/components/SortSelector';
import LimitSelector from '@/components/LimitSelector';
import ProductCard from '@/components/ProductCard';

// Definimos la estructura basada en tu base de datos
interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const resolvedSearchParams = await searchParams;

  // 1. Obtener todas las categorías para el filtro lateral
  const { data: allCategories } = await supabase.from('categories').select('*');

  // 2. Construcción de la consulta dinámica
  let query = supabase
    .from('products')
    .select('*, categories!inner(slug, name)')
    .eq('categories.slug', categorySlug);

  // 3. Ejecución de la consulta
  const { data: products, error } = await query;

  const titles: Record<string, { main: string; subtitle: string }> = {
    hogar: { main: 'Mobiliario & Hogar', subtitle: 'Arquitectura interna funcional y minimalista.' },
    decoracion: { main: 'Decoración de Autor', subtitle: 'Detalles mínimos que capturan miradas.' },
    ofertas: { main: 'Precios Especiales', subtitle: 'Piezas exclusivas con oportunidad de inversión limitada.' },
  };

  const currentMeta = titles[categorySlug] || { main: 'Catálogo Cirelia', subtitle: 'Colección exclusiva de piezas de diseño.' };

  return (
    <div className="bg-white min-h-screen text-zinc-950 pb-24 relative">
      {/* HEADER */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 border-b border-zinc-100">
        <h1 className="text-4xl font-black tracking-tighter sm:text-5xl text-zinc-900 capitalize">
          {currentMeta.main}
        </h1>
        <p className="text-sm text-zinc-500 mt-2 font-medium max-w-2xl">{currentMeta.subtitle}</p>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* SIDEBAR */}
          <aside className="w-full lg:w-64 shrink-0 hidden lg:block">
            <div className="sticky top-28 space-y-6">
              <div className="flex items-center gap-2 text-zinc-900 font-black text-xs uppercase tracking-wider pb-4 border-b border-zinc-100">
                <AdjustmentsHorizontalIcon className="w-4 h-4 text-zinc-500" />
                Filtros Estructurados
              </div>
              {/* Pasamos las categorías reales obtenidas del servidor */}
              <CategoryMultiFilter categories={allCategories || []} />
            </div>
          </aside>

          {/* MAIN GRID */}
          <main className="flex-1">
            {products && products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-zinc-50/50 rounded-4xl border border-zinc-100">
                <SparklesIcon className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                <h3 className="text-sm font-black text-zinc-800">No hay productos en esta categoría</h3>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}