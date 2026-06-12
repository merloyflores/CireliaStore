// components/CategoryRow.tsx
import Link from 'next/link';
import ProductCard from './ProductCard';

interface CategoryRowProps {
  category: string;
  subtitle?: string; // Hacemos el subtítulo dinámico
  products?: any[];
}

export default function CategoryRow({ 
  category, 
  subtitle = "Explora nuestra selección destacada.", 
  products = [] 
}: CategoryRowProps) {
  
  // Cambiamos a 8 para que genere 2 filas completas en escritorio (4 columnas x 2 filas)
  const showcaseItems = (products || []).slice(0, 8); 

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
          <p className="text-zinc-500 font-medium">{subtitle}</p>
        </div>
        
        {/* Usamos un condicional en el Link por si es la fila "Dinámica" que lleve al shop general */}
        <Link 
          href={category.toLowerCase() === "tendencias del momento" ? "/shop" : `/shop?category=${encodeURIComponent(category)}`} 
          className="text-sm font-bold hover:text-sky-600 transition-colors"
        >
          Ver todo →
        </Link>
      </div>

      {/* GRID (Automáticamente creará 2 filas si hay más de 4 productos) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {showcaseItems.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}