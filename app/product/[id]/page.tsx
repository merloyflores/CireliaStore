import { supabase } from '@/lib/supabase';
import SectionContainer from "@/components/SectionContainer";
import ProductCard from "@/components/ProductCard";
import Link from 'next/link';
import { ChevronLeft, Star, ShieldCheck, Truck, Sparkles, Tag } from 'lucide-react';
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
    .select('*, product_media(url)')
    .eq('id', id)
    .single();

  if (!product) {
    return (
      <div className="py-40 text-center bg-zinc-50">
        <h1 className="text-2xl font-black text-zinc-950">Producto no encontrado</h1>
      </div>
    );
  }

  // Lógica de productos relacionados
  let { data: crossSellingProducts } = await supabase
    .from('products')
    .select('*')
    .neq('id', id)
    .eq('category', product.category)
    .limit(4);

  // Lógica de precios
  const hasDiscount = product.is_promo === true && product.promo_price && product.promo_price < product.price;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.price - product.promo_price) / product.price) * 100) 
    : 0;

  return (
    <div className="bg-zinc-50 min-h-screen pb-24">
      <SectionContainer>
        {/* Breadcrumb minimalista */}
        <div className="py-8">
          <Link href="/shop" className="group flex items-center gap-2 text-zinc-400 hover:text-zinc-950 transition text-[11px] font-bold uppercase tracking-widest">
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Volver a la tienda
          </Link>
        </div>

        {/* HERO SECTION - Consistente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Gallery */}
          <div className="w-full">
            <div className="sticky top-24 bg-white rounded-3xl p-4 border border-zinc-100 shadow-sm">
              <ProductGallery 
                mainImage={product.image_url} 
                productName={product.name} 
                media={product.product_media || []} 
              />
            </div>
          </div>

          {/* Info Column */}
          <div className="flex flex-col gap-8">
            <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm">
               <div className="flex items-center gap-3 mb-6">
                <span className="bg-zinc-100 text-zinc-600 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  {product.category}
                </span>
                {hasDiscount && (
                  <span className="flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    <Tag size={10} fill="currentColor" /> Oferta -{discountPercentage}%
                  </span>
                )}
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-black text-zinc-950 tracking-tighter leading-[0.9] mb-8">
                {product.name}
              </h1>

              {/* Bloque de Precio */}
              <div className="flex items-end gap-4 pb-8 border-b border-zinc-100">
                <div className="flex flex-col">
                  {hasDiscount && (
                    <span className="text-zinc-400 line-through text-sm font-medium">₡{product.price?.toLocaleString()}</span>
                  )}
                  <span className="text-5xl font-black text-zinc-950 tracking-tighter">
                    ₡{hasDiscount ? product.promo_price?.toLocaleString() : product.price?.toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="mt-8">
                <ProductSelectors 
                  colors={product.colors} 
                  sizes={product.sizes}
                  isExpressDelivery={product.is_express} 
                />
                <div className="mt-6">
                  <ProductActions product={product} />
                </div>
              </div>
            </div>

            {/* Info rápida */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-white border border-zinc-100 p-5 rounded-2xl shadow-sm">
                <div className="text-zinc-400"><Truck size={20} /></div>
                <div><p className="text-[10px] font-bold text-zinc-400 uppercase">Logística</p><p className="text-xs font-bold text-zinc-950">Envío Priority</p></div>
              </div>
              <div className="flex items-center gap-3 bg-white border border-zinc-100 p-5 rounded-2xl shadow-sm">
                <div className="text-zinc-400"><ShieldCheck size={20} /></div>
                <div><p className="text-[10px] font-bold text-zinc-400 uppercase">Protección</p><p className="text-xs font-bold text-zinc-950">Garantía 2026</p></div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENIDO INFERIOR - Ancho unificado */}
        <div className="mt-20 space-y-16">
          <div className="bg-white p-8 lg:p-16 rounded-3xl border border-zinc-100 shadow-sm">
             <ProductSpecs 
                description={product.description}
                colors={product.colors}
                sizes={product.sizes}
                brand={product.brand || "Cirelia"}
                material={product.material}
                dimensions={product.dimensions}
                inTheBox={product.in_the_box}
                sku={product.sku}
                weight={product.weight}
                warrantyDays={product.warranty_days}
                relatedTags={product.related_tags}
                specifications={product.specifications}
              />
          </div>
          
          <div className="bg-white p-8 lg:p-16 rounded-3xl border border-zinc-100 shadow-sm">
            <ProductReviews productId={product.id} />
          </div>
        </div>

        {/* RECOMENDACIONES */}
        {crossSellingProducts && crossSellingProducts.length > 0 && (
          <div className="mt-24 pt-24 border-t border-zinc-200">
             <h2 className="text-3xl font-black text-zinc-950 tracking-tighter mb-12">Productos que te podrían interesar</h2>
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
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