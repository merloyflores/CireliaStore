'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

const SORT_OPTIONS = [
  { value: '', label: 'Novedades y Destacados' },
  { value: 'price_asc', label: 'Precio: Menor a Mayor' },
  { value: 'price_desc', label: 'Precio: Mayor a Menor' },
  { value: 'name_asc', label: 'Nombre: A - Z' },
  { value: 'rating_desc', label: 'Más Valorados' },
];

export default function SortSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // LEER DIRECTAMENTE DE LA URL (Esto arregla el bug de que no se marque)
  const currentSort = searchParams.get('sort') || '';

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value) {
      params.set('sort', value);
    } else {
      params.delete('sort');
    }
    
    router.push(`/shop?${params.toString()}`, { scroll: false });
  };

  const currentLabel = SORT_OPTIONS.find(o => o.value === currentSort)?.label;

  return (
    <div className="relative flex items-center justify-between sm:justify-start gap-2 bg-white px-4 py-3 sm:py-2.5 w-full sm:w-80 rounded-xl sm:rounded-2xl border border-zinc-200 shadow-xs hover:border-zinc-300 transition-all">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[10px] sm:text-xs font-black text-zinc-400 uppercase tracking-wider whitespace-nowrap">
          Ordenar por:
        </span>
        <span className="text-sm font-bold text-zinc-800 truncate pr-6">
          {currentLabel}
        </span>
      </div>

      <ChevronDown size={16} className="text-zinc-400 pointer-events-none absolute right-4" />

      <select 
        value={currentSort} 
        onChange={(e) => handleSortChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 appearance-none"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}