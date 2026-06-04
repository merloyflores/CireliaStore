'use client'; // <-- Esto le dice a Next.js que este archivo es interactivo

import { useRouter, useSearchParams } from 'next/navigation';

export default function SortSelector({ currentSort }: { currentSort: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (value: string) => {
    // Creamos una nueva URL con el filtro seleccionado
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('sort', value);
    else params.delete('sort');
    
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-zinc-400">Ordenar:</span>
      <select 
        onChange={(e) => handleSortChange(e.target.value)}
        className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-sky-500 cursor-pointer"
        defaultValue={currentSort}
      >
        <option value="">Novedades</option>
        <option value="price_asc">Precio: Menor a Mayor</option>
        <option value="price_desc">Precio: Mayor a Menor</option>
      </select>
    </div>
  );
}