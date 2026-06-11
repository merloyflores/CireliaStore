import { supabase } from '@/lib/supabase';
import SectionContainer from "@/components/SectionContainer";
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ProductCard from "@/components/ProductCard";
import SortSelector from "@/components/SortSelector";
import LimitSelector from "@/components/LimitSelector";
import CategoryDropdown from "@/components/CategoryDropdown"; // Nuevo
import Pagination from "@/components/Pagination"; // Nuevo
import Link from 'next/link';
import { Mail } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ShopProps {
  searchParams: Promise<{ 
    category?: string; 
    sort?: string; 
    page?: string; 
    limit?: string; 
  }> | any;
}

export default async function ShopPage({ searchParams }: ShopProps) {
  const resolvedParams = await searchParams;
  const categoryParam = resolvedParams.category || '';
  const currentSort = resolvedParams.sort || '';
  const currentPage = Number(resolvedParams.page) || 1;
  const currentLimit = Number(resolvedParams.limit) || 16;

  const from = (currentPage - 1) * currentLimit;
  const to = from + currentLimit - 1;

  let query = supabase
    .from('products')
    .select('*, categories!inner(slug)', { count: 'exact' });

  if (categoryParam) {
    const categoryArray = categoryParam.split(',');
    query = query.in('categories.slug', categoryArray);
  }

  if (currentSort === 'price_asc') query = query.order('price', { ascending: true });
  else if (currentSort === 'price_desc') query = query.order('price', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  query = query.range(from, to);

  const [{ data: products, count }, { data: categories }] = await Promise.all([
    query,
    supabase.from('categories').select('*')
  ]);

  const totalProducts = count || 0;
  const totalPages = Math.ceil(totalProducts / currentLimit);

  return (
    <SectionContainer>
      {/* ENCABEZADO */}
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tighter text-zinc-950">Nuestra Colección</h1>
        <p className="text-zinc-500 mt-1 text-sm font-medium">Equilibrio perfecto entre espacio, diseño y confort.</p>
      </div>

      {/* ARQUITECTURA DE FILTROS */}
      <div className="flex flex-col gap-6 bg-zinc-50 border border-zinc-200/60 rounded-3xl p-6 mb-12 shadow-xs">
        <CategoryDropdown categories={categories || []} />
        
        <div className="h-px bg-zinc-200/80 w-full" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-xs font-bold text-zinc-500 order-2 md:order-1">
            Mostrando <span className="text-zinc-950">{totalProducts === 0 ? 0 : from + 1}–{Math.min(to + 1, totalProducts)}</span> de {totalProducts} piezas.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 order-1 md:order-2 w-full md:w-auto">
            <LimitSelector currentLimit={currentLimit.toString()} />
            <SortSelector />
          </div>
        </div>
      </div>

      {/* REJILLA */}
      {products && products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Pagination totalPages={totalPages} currentPage={currentPage} />
        </>
      ) : (
        <div className="text-center py-24 bg-white border border-dashed border-zinc-200 rounded-3xl">
          <p className="text-zinc-400 font-medium">No se encontraron artículos con la combinación de filtros seleccionada.</p>
          <Link href="/shop" className="mt-4 inline-block text-xs font-black text-sky-600 uppercase tracking-wider hover:underline">
            Restablecer Catálogo
          </Link>
        </div>
      )}

      {/* CALL TO ACTION */}
      <div className="mt-32 bg-zinc-950 text-white rounded-[2.5rem] p-8 md:p-16 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-zinc-800/40 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <h2 className="text-3xl md:text-6xl font-black tracking-tighter mb-4 leading-none">
            ¿Dudas sobre dimensiones o materiales?
          </h2>
          <p className="text-zinc-400 text-base md:text-xl font-medium mb-10 max-w-xl leading-relaxed">
            Hablemos directamente. Nuestro equipo de diseño está disponible para ayudarte a elegir la pieza perfecta para tu espacio.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <a 
              href="https://wa.me/50670305676?text=Hola!%20Estoy%20en%20la%20tienda%20Cirelia%20y%20me%20gustar%C3%ADa%20recibir%20asesor%C3%ADa%20con%20un%20producto." 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-white text-zinc-950 font-black text-sm uppercase tracking-wider px-8 py-4.5 rounded-2xl w-full sm:w-auto hover:bg-zinc-100 active:scale-98 transition-all shadow-lg"
            >
              <WhatsAppIcon style={{ fontSize: 20 }} className="fill-current text-zinc-950" /> 
              Chat de WhatsApp
            </a>
            <a 
              href="mailto:info@cireliastore.com?subject=Consulta%20de%20Productos%20-%20Cirelia" 
              className="flex items-center justify-center gap-3 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-sm px-8 py-4.5 rounded-2xl w-full sm:w-auto hover:bg-zinc-800 hover:text-white transition-all"
            >
              <Mail size={18} />
              info@cireliastore.com
            </a>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}