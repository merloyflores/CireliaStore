import { supabase } from '@/lib/supabase';
import SectionContainer from "@/components/SectionContainer";
import CategoryRow from "@/components/CategoryRow"; // Carrusel Premium
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

  const { data: product } = await supabase
    .from('products')
    .select('*, product_media(url), categories(name)')
    .eq('id', id)
    .single();

  if (!product) return <div className="py-40 text-center text-zinc-500">Producto no encontrado</div>;

  // Productos relacionados por categoría (UUID)
  const { data: crossSellingProducts } = await supabase
    .from('products')
    .select('*')
    .neq('id', id)
    .eq('category_id', product.category_id)
    .limit(8);

  const hasDiscount = product.is_promo && product.promo_price < product.price;

  return (
    // FORZAMOS EL FONDO AQUÍ PARA QUE NO CAMBIE A NEGRO EN MÓVILES
    <div className="bg-[#F3F3F4] min-h-screen pb-24 text-zinc-900">
      <SectionContainer>
        <div className="py-8">
          <Link href="/shop" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-950 transition text-[11px] font-bold uppercase tracking-widest">
            <ChevronLeft size={14} /> Volver al catálogo
          </Link>
        </div>

        {/* HERO SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div className="bg-white rounded-3xl p-4 border border-zinc-200 shadow-sm">
            <ProductGallery mainImage={product.image_url} productName={product.name} media={product.product_media || []} />
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
              <span className="bg-zinc-100 text-zinc-600 px-3 py-1 rounded-md text-[10px] font-bold uppercase">{product.categories?.name || 'General'}</span>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tighter mt-4 mb-6">{product.name}</h1>
              
              <div className="text-4xl font-black mb-8">
                ₡{hasDiscount ? product.promo_price?.toLocaleString() : product.price?.toLocaleString()}
              </div>

              <ProductSelectors 
                colors={product.colors} 
                sizes={product.sizes}
                isExpressDelivery={product.is_express}
                stock={product.stock}
              />
              <ProductActions product={product} />
            </div>
          </div>
        </div>

        {/* DETALLES */}
        <div className="mt-12 space-y-6">
          <ProductSpecs {...product} brand={product.brand} />
          <ProductReviews productId={product.id} />
        </div>

        {/* CARRUSEL RECOMENDADO */}
        <div className="mt-20">
          <CategoryRow 
            category={`Más de ${product.categories?.name || 'Colección'}`}
            products={crossSellingProducts || []} 
          />
        </div>
      </SectionContainer>
    </div>
  );
}