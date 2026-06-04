import { supabase } from '@/lib/supabase';
import SectionContainer from "@/components/SectionContainer";
import ProductCard from "@/components/ProductCard";
import SortSelector from "@/components/SortSelector";
import Link from 'next/link';

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string; sort?: string };
}) {
  const selectedCategory = searchParams.category;

  // 1. Iniciamos la consulta a Supabase
  let query = supabase
    .from('products')
    .select('*, categories!inner(slug)'); // Hacemos un join con categorías

  // 2. Aplicamos filtro de categoría si existe en la URL
  if (selectedCategory && selectedCategory !== 'todos') {
    query = query.eq('categories.slug', selectedCategory);
  }

  // 3. Aplicamos el orden
  if (searchParams.sort === 'price_asc') query = query.order('price', { ascending: true });
  else if (searchParams.sort === 'price_desc') query = query.order('price', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  // Traemos los productos y las categorías por separado
  const [{ data: products }, { data: categories }] = await Promise.all([
    query,
    supabase.from('categories').select('*')
  ]);

  return (
    <SectionContainer>
      <div className="flex flex-col gap-8 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Nuestra Colección</h1>
          <p className="text-zinc-500 mt-2">Filtra por espacio y encuentra tu estilo ideal.</p>
        </div>

        {/* BARRA DE FILTROS ESTILO UNIMART/AMAZON */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-zinc-100 py-6">
          
          {/* Categorías (Pestañas) */}
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            <Link 
              href="/shop"
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${!selectedCategory || selectedCategory === 'todos' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
            >
              Todos
            </Link>
            {categories?.map((cat: any) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${selectedCategory === cat.slug ? 'bg-sky-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        
          {/* Selector de Orden (Este requiere un pequeño componente cliente o recarga de página) */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-400">Ordenar:</span>
            {/* Selector de Orden (Borramos el select viejo y dejamos solo el componente nuevo) */}
            <div className="flex items-center gap-3">
            {/* El componente SortSelector ya trae la etiqueta "Ordenar:" y el diseño adentro */}
            <SortSelector currentSort={searchParams.sort || ''} />
            </div>
          </div>
        </div>
      </div>

      {/* RESULTADOS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
        {products?.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {products?.length === 0 && (
        <div className="text-center py-20 bg-zinc-50 rounded-3xl">
          <p className="text-zinc-400">No hay productos en esta categoría todavía.</p>
        </div>
      )}
    </SectionContainer>
  );
}