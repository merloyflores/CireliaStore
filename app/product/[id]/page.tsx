import { supabase } from '@/lib/supabase';
import SectionContainer from "@/components/SectionContainer";
import ProductCard from "@/components/ProductCard";
import Link from 'next/link';
import { ChevronLeft, Star, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import ProductActions from "@/components/ProductActions"; 
import ProductGallery from "@/components/ProductGallery"; 
import ProductSelectors from "@/components/ProductSelectors"; 
import ProductSpecs from "@/components/ProductSpecs";
import ProductReviews from "@/components/ProductReviews";

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: product } = await supabase
    .from('products')
    .select('*, product_media(url)') // automáticamente traerá el JSONB si lo pides
    .eq('id', id)
    .single();

  if (!product) {
    return (
      <div className="py-40 text-center bg-zinc-50">
        <h1 className="text-2xl font-black text-zinc-950">Producto no encontrado</h1>
      </div>
    );
  }

  const { data: crossSellingProducts } = await supabase
    .from('products')
    .select('*')
    .not('id', 'eq', id)
    .limit(4);

  const galleryMedia = product.product_media || [];

  return (
    <div className="bg-white min-h-screen pb-20">
      <SectionContainer>
        <div className="py-8">
          <Link href="/shop" className="flex items-center gap-2 text-zinc-400 hover:text-sky-600 transition text-xs font-bold uppercase tracking-widest">
            <ChevronLeft size={14} /> Volver al catálogo
          </Link>
        </div>

        {/* 1. HERO SECTION: Reduje mb-20 a mb-12 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">
          
          <div className="lg:col-span-7">
            <div className="sticky top-24">
              <ProductGallery 
                mainImage={product.image_url} 
                productName={product.name} 
                media={galleryMedia} 
              />
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-sky-50 text-sky-600 px-4 py-1 rounded-full font-bold uppercase tracking-tighter text-[10px]">
                  {product.category}
                </span>
                <span className="flex items-center gap-1 text-amber-500 text-[10px] font-bold">
                  <Sparkles size={12} fill="currentColor" /> NUEVA COLECCIÓN
                </span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-zinc-950 tracking-tighter leading-[0.95] mb-6">
                {product.name}
              </h1>
              <div className="flex items-center gap-6">
                <span className="text-3xl font-black text-zinc-950 tracking-tight">
                  ${product.price?.toLocaleString()}
                </span>
                <div className="flex items-center gap-1 text-amber-400 border-l border-zinc-200 pl-6">
                  <Star size={14} fill="currentColor" />
                  <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Excelencia Cirelia</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
              <ProductSelectors 
                colors={product.colors} 
                isExpressDelivery={product.is_express} 
              />
              <div className="mt-6">
                 <ProductActions product={product} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center"><Truck size={18} /></div>
                <div><p className="text-[9px] font-bold text-zinc-400 uppercase">Logística</p><p className="text-xs font-bold text-zinc-900">Priority</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-950 text-white rounded-xl flex items-center justify-center"><ShieldCheck size={18} /></div>
                <div><p className="text-[9px] font-bold text-zinc-400 uppercase">Protección</p><p className="text-xs font-bold text-zinc-900">Garantía 2026</p></div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. CONTENIDO INFERIOR: Reduje pt-20 a pt-12 para cerrar el hueco visual */}
        <div className="max-w-4xl mx-auto space-y-16 border-t border-zinc-100 pt-12">
          <ProductSpecs 
            description={product.description}
            brand="Miomu"
            material={product.material}
            dimensions={product.dimensions}
            inTheBox={product.in_the_box}
            sku={product.sku}
            weight={product.weight}
            warrantyDays={product.warranty_days}
            relatedTags={product.related_tags}
            specifications={product.specifications}
          />
          
          <ProductReviews productId={product.id} />
        </div>

        {/* 3. RECOMENDACIONES: Ajusté el margen superior para que no se sienta separado */}
        {crossSellingProducts && crossSellingProducts.length > 0 && (
          <div className="pt-16 mt-16 border-t border-zinc-100">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 gap-4">
               <div className="text-center md:text-left">
                 <h2 className="text-4xl font-black text-black tracking-tighter">Otros también compraron</h2>
                 <p className="text-zinc-500 font-medium">Completa tu carrito con productos recomendados</p>
               </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {crossSellingProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        )}
      </SectionContainer>
    </div>
  );
}