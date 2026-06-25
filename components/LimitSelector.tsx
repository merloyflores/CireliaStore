'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

const LIMIT_OPTIONS = [
  { value: '12', label: '12 productos' },
  { value: '16', label: '16 productos' },
  { value: '24', label: '24 productos' },
  { value: '36', label: '36 productos' },
];

export default function LimitSelector({ currentLimit }: { currentLimit: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLimitChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('limit', value);
    params.set('page', '1'); // Cada vez que cambia el límite, reiniciamos a la página 1
    
    router.push(`/shop?${params.toString()}`, { scroll: false });
  };

  const currentLabel = LIMIT_OPTIONS.find(o => o.value === currentLimit)?.label || '16 productos';

  return (
    <div className="relative flex items-center justify-between sm:justify-start gap-2 bg-white px-4 py-3.5 sm:py-2.5 w-full sm:w-auto rounded-xl sm:rounded-2xl border border-zinc-200/80 shadow-xs hover:border-zinc-300 transition-all">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[10px] sm:text-xs font-black text-zinc-400 uppercase tracking-wider whitespace-nowrap">
          Ver:
        </span>
        <span className="text-sm font-bold text-zinc-800 truncate pr-6 sm:pr-2">
          {currentLabel}
        </span>
      </div>

      <ChevronDown size={16} className="text-zinc-400 pointer-events-none absolute right-4" />

      <select 
        value={currentLimit} 
        onChange={(e) => handleLimitChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 appearance-none"
      >
        {LIMIT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}