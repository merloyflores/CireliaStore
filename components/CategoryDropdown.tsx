// components/CategoryDropdown.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function CategoryDropdown({ categories }: { categories: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category') || '';

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams);
    if (value) params.set('category', value);
    else params.delete('category');
    params.set('page', '1'); // Reset a página 1 al filtrar
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <div className="w-full md:w-64">
      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Categoría</label>
      <select 
        value={currentCategory}
        onChange={handleCategoryChange}
        className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-zinc-950 focus:outline-none focus:ring-2 focus:ring-sky-500/20 appearance-none cursor-pointer"
      >
        <option value="">Todas las piezas</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.slug}>
            {cat.name}
          </option>
        ))}
      </select>
    </div>
  );
}