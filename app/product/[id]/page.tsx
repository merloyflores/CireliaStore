import { supabase } from '@/lib/supabase';
import SectionContainer from "@/components/SectionContainer";
import CategoryRow from "@/components/CategoryRow"; 
import Link from 'next/link';
import { ChevronLeft, ShieldCheck, Truck, Tag } from 'lucide-react';
import ProductActions from "@/components/ProductActions"; 
import ProductGallery from "@/components/ProductGallery"; 
import ProductSelectors from "@/components/ProductSelectors"; 
import ProductSpecs from "@/components/ProductSpecs";
import ProductReviews from "@/components/ProductReviews";

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Obtener producto actual + JOIN con la tabla categories para sacar el nombre real
  const { data: product } = await supabase
    .from('products')
    // Agregamos categories(name) para traer el texto de la categoría relacional
    .select('*, product_media(url), categories(name)') 
    .eq('id', id)
    .single();

  if (!product) {
    return (
      <div className="py-40 text-center bg-zinc-50">
        <h1 className="text-2xl font-black text-zinc-950">Producto no encontrado</h1>
      </div>
    );
  }

  // Extraemos el nombre de la categoría de forma segura
  const categoryName = product.categories?.name || "esta categoría";

  // 2. Lógica de productos relacionados usando el category_id (UUID) correcto
  let { data: crossSellingProducts } = await supabase
    .from('products')
    .select('*, categories(name)') // Traemos también sus nombres de categoría si los ocupás luego
    .neq('id', id) 
    .eq('category_id', product.category_id); // <-- ¡Aquí estaba el error! Ahora usamos category_id

  // Lógica de precios y promociones
  const hasDiscount = product.is_promo === true && product.promo_price && product.promo_price < product.price;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.price - product.promo_price) / product.price) * 100) 
    : 0;

  return (
    <div className="bg-zinc-50 min-h-screen pb-24">
      <SectionContainer>
        {/* Breadcrumb */}
        <div className="py-8">
          <Link href="/shop" className="group flex items-center gap-2 text-zinc-400 hover:text-zinc-950 transition text-[11px] font-bold uppercase tracking-widest">
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Volver a la tienda
          </Link>
        </div>

        {/* HERO SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div className="w-full">
            <div className="sticky top-24 bg-white rounded-3xl p-4 border border-zinc-100 shadow-sm">
              <ProductGallery 
                mainImage={product.image_url} 
                productName={product.name} 
                media={product.product_media || []} 
              />
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm">
               <div className="flex items-center gap-3 mb-6">
                <span className="bg-zinc-100 text-zinc-600 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  {/* Mostramos el nombre relacional */}
                  {categoryName}
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
                  colors={product.colors as any} 
                  sizes={product.sizes as any}
                  isExpressDelivery={!!product.is_express}
                  stock={product.stock ? Number(product.stock) : 0}
                />
                <div className="mt-6">
                  <ProductActions product={product} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-white border border-zinc-100 p-5 rounded-2xl shadow-sm">
                <div className="text-zinc-400"><Truck size={20} /></div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Logística</p>
                  <p className="text-xs font-bold text-zinc-950">Envío Priority</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white border border-zinc-100 p-5 rounded-2xl shadow-sm">
                <div className="text-zinc-400"><ShieldCheck size={20} /></div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Protección</p>
                  <p className="text-xs font-bold text-zinc-950">Garantía 2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>

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

        {/* --- EL CARRUSEL MAGICO --- */}
        <div className="mt-24 pt-12 border-t border-zinc-200">
          <CategoryRow 
            category={`Más de ${categoryName}`}
            subtitle="Productos seleccionados de la misma colección que te podrían interesar."
            products={crossSellingProducts || []} 
          />
        </div>

      </SectionContainer>
    </div>
  );
}