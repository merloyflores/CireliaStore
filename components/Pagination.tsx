// components/Pagination.tsx
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function Pagination({ totalPages, currentPage }: { totalPages: number, currentPage: number }) {
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `/shop?${params.toString()}`;
  };

  return (
    <div className="flex justify-center gap-2 mt-12">
      {Array.from({ length: totalPages }).map((_, i) => {
        const page = i + 1;
        const isActive = page === currentPage;
        return (
          <Link
            key={page}
            href={createPageURL(page)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-sm transition-all ${
              isActive 
                ? 'bg-zinc-950 text-white shadow-lg' 
                : 'bg-white text-zinc-400 hover:bg-zinc-100 border border-zinc-200'
            }`}
          >
            {page}
          </Link>
        );
      })}
    </div>
  );
}