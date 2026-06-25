'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function CategoryMultiFilter({ categories }: { categories: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Obtenemos las categorías activas mapeadas en un Array
  const currentCategories = searchParams.get('category') ? searchParams.get('category')!.split(',') : [];

  const toggleCategory = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1'); // Reset de página al filtrar

    if (slug === 'todos') {
      params.delete('category');
    } else {
      let updatedCats = [...currentCategories];
      
      if (updatedCats.includes(slug)) {
        // Si ya está, la quitamos
        updatedCats = updatedCats.filter(c => c !== slug);
      } else {
        // Si no está, la agregamos
        updatedCats.push(slug);
      }

      if (updatedCats.length === 0) {
        params.delete('category');
      } else {
        params.set('category', updatedCats.join(','));
      }
    }

    router.push(`/shop?${params.toString()}`, { scroll: false });
  };

  const isTodosActive = currentCategories.length === 0;

  return (
    <div className="w-full">
      <span className="text-xs font-black text-zinc-400 uppercase tracking-wider block mb-3">
        Filtrar por Categorías ({currentCategories.length} seleccionadas)
      </span>
      
      {/* Contenedor con scroll horizontal en móviles para que nunca rompa el diseño */}
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => toggleCategory('todos')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            isTodosActive 
              ? 'bg-zinc-950 text-white shadow-md scale-102' 
              : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          Ver Todos
        </button>

        {categories?.map((cat) => {
          const isActive = currentCategories.includes(cat.slug);
          return (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.slug)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                isActive 
                  ? 'bg-sky-600 text-white shadow-md border border-sky-700 scale-102' 
                  : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              {isActive && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}