import { supabase } from '@/lib/supabase';
import SectionContainer from "@/components/SectionContainer";
import ProductCard from "@/components/ProductCard";
import Link from 'next/link';
import { ChevronLeft, Star, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import ProductActions from "@/components/ProductActions"; 

export const dynamic = 'force-dynamic';
export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (!product) {
    return (
      <div className="py-40 text-center bg-zinc-50">
        <h1 className="text-2xl font-black text-zinc-950">Producto no encontrado</h1>
        <Link href="/shop" className="text-sky-600 font-bold hover:underline mt-4 inline-block">Volver a la tienda</Link>
      </div>
    );
  }

  const { data: relatedProducts } = await supabase
    .from('products')
    .select('*')
    .eq('category', product.category)
    .not('id', 'eq', id)
    .limit(4);

  return (
    <div className="bg-white min-h-screen pb-20">
      <SectionContainer>
        <Link href="/shop" className="flex items-center gap-2 text-zinc-400 hover:text-sky-600 transition py-8 text-xs font-bold uppercase tracking-widest">
          <ChevronLeft size={14} /> Volver al catálogo
        </Link>

        {/* CONTENEDOR PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-32">
          <div className="relative group">
            <div className="aspect-4/5 bg-zinc-100 rounded-[2.5rem] overflow-hidden border border-zinc-100 shadow-sm transition-all duration-500 group-hover:shadow-2xl">
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-sky-50 text-sky-600 px-4 py-1 rounded-full font-bold uppercase tracking-tighter text-[10px]">
                {product.category}
              </span>
              <span className="flex items-center gap-1 text-amber-500 text-[10px] font-bold">
                <Sparkles size={12} fill="currentColor" /> NUEVA COLECCIÓN
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-zinc-950 mb-6 tracking-tighter leading-[0.95]">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-6 mb-8">
              <span className="text-4xl font-black text-zinc-950 tracking-tight">
                ${product.price?.toLocaleString()}
              </span>
              <div className="h-8 w-px bg-zinc-200"></div>
              <div className="flex items-center gap-1 text-amber-400">
                <Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" />
                <span className="text-zinc-400 text-[11px] font-bold ml-2 uppercase tracking-widest">Excelencia Cirelia</span>
              </div>
            </div>

            <p className="text-zinc-500 leading-relaxed mb-10 text-lg font-medium">
              {product.description || "Inspirado en la comodidad moderna, este diseño exclusivo de Cirelia combina materiales nobles con una estética minimalista para elevar tu espacio."}
            </p>

            <ProductActions product={product} />

            <div className="grid grid-cols-2 gap-6 pt-10 border-t border-zinc-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center shadow-sm"><Truck size={24} /></div>
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Logística</p>
                  <p className="text-xs font-bold text-zinc-900">Envío Cirelia Priority</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-950 text-white rounded-2xl flex items-center justify-center shadow-sm"><ShieldCheck size={24} /></div>
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Protección</p>
                  <p className="text-xs font-bold text-zinc-900">Garantía Cirelia 2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RELACIONADOS */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="pt-24 border-t border-zinc-100">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 gap-4">
              <div className="text-center md:text-left">
                <h2 className="text-4xl font-black text-black tracking-tighter">Artículos Similares</h2>
                <p className="text-zinc-500 font-medium">Completa tu espacio con piezas de la misma colección {product.category}</p>
              </div>
              <Link href="/shop" className="bg-zinc-100 text-zinc-900 px-6 py-3 rounded-full font-bold text-sm hover:bg-sky-600 hover:text-white transition-all">
                Ver toda la categoría
              </Link>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        )}
      </SectionContainer>
    </div>
  );
}