// components/CategoryRow.tsx
import Link from 'next/link';
import ProductCard from './ProductCard';

interface CategoryRowProps {
  category: string;
  products?: any[];
}

export default function CategoryRow({ category, products = [] }: CategoryRowProps) {
  // Aseguramos que si products es undefined, use un array vacío para que slice(0, 4) nunca falle
  const showcaseItems = (products || []).slice(0, 4); 

  // Si la categoría no tiene productos, no renderizamos un contenedor vacío
  if (showcaseItems.length === 0) return null;

  return (
    <div className="mb-20">
      {/* HEADER */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-zinc-950 tracking-tighter capitalize">
            {category}
          </h2>
          <p className="text-zinc-500 font-medium">Explora nuestra selección destacada.</p>
        </div>
        <Link 
          href={`/shop?category=${encodeURIComponent(category)}`} 
          className="text-sm font-bold hover:text-sky-600 transition-colors"
        >
          Ver todo →
        </Link>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {showcaseItems.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}