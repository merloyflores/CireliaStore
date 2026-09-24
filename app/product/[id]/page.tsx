import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { ChevronLeft, ShieldCheck, Truck, Tag } from 'lucide-react';
import AddToCartButton from '@/components/AddToCartButton';

export const dynamic = 'force-dynamic';

function money(amount: number, currency: string = 'CRC') {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: product } = await supabase
    .from('products')
    .select('*, categories(name, slug), product_media(url, position), product_types(id, name)')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-32 text-center">
        <h1 className="font-serif text-2xl text-ink-900">Producto no encontrado</h1>
        <Link href="/shop" className="mt-4 inline-block text-sm font-bold text-gold-700 hover:underline">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  // Las características del producto son dinámicas (product.attributes jsonb)
  // según el tipo de producto (product_types / product_type_attributes) —
  // así el mismo esquema sirve para ropa, electrónica, frutas o lo que sea,
  // sin columnas hardcodeadas por vertical.
  const { data: attributeDefs } = product.product_type_id
    ? await supabase
        .from('product_type_attributes')
        .select('key, label, unit, data_type, display_order')
        .eq('product_type_id', product.product_type_id)
        .order('display_order')
    : { data: [] as any[] };

  const attributes = (product.attributes ?? {}) as Record<string, any>;
  const filledAttributes = (attributeDefs ?? []).filter(
    (def) => attributes[def.key] !== undefined && attributes[def.key] !== null && attributes[def.key] !== ''
  );

  const { data: related } = await supabase
    .from('products')
    .select('id, name, price, image_url, currency')
    .eq('category_id', product.category_id)
    .eq('is_active', true)
    .neq('id', id)
    .limit(4);

  const categoryName = product.categories?.name || 'Catálogo';
  const hasDiscount = product.is_on_sale && product.sale_price && Number(product.sale_price) < Number(product.price);
  const discountPct = hasDiscount
    ? Math.round(((Number(product.price) - Number(product.sale_price)) / Number(product.price)) * 100)
    : 0;

  const gallery = [
    ...(product.image_url ? [{ url: product.image_url }] : []),
    ...((product.product_media || []).sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))),
  ];

  return (
    <div className="bg-cream-50 min-h-screen pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <Link
            href="/shop"
            className="group flex items-center gap-2 text-ink-400 hover:text-ink-900 transition text-[11px] font-bold uppercase tracking-widest"
          >
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Volver a la tienda
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Galería */}
          <div className="w-full">
            <div className="sticky top-24 bg-cream-100 rounded-3xl p-4 border border-ink-100">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-cream-200">
                {gallery[0] ? (
                  <Image src={gallery[0].url} alt={product.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-300 font-serif text-5xl">
                    {product.name?.charAt(0)}
                  </div>
                )}
              </div>
              {gallery.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {gallery.slice(1, 5).map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-cream-200">
                      <Image src={img.url} alt="" fill className="object-cover" sizes="120px" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-6">
            <div className="bg-cream-100 p-6 sm:p-8 rounded-3xl border border-ink-100">
              <div className="flex items-center gap-3 mb-5">
                <span className="bg-ink-100 text-ink-600 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  {categoryName}
                </span>
                {hasDiscount && (
                  <span className="flex items-center gap-1.5 bg-gold-600 text-cream-50 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    <Tag size={10} fill="currentColor" /> -{discountPct}%
                  </span>
                )}
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-medium text-ink-900 leading-tight mb-6">
                {product.name}
              </h1>

              <div className="flex items-end gap-4 pb-6 border-b border-ink-200">
                <div className="flex flex-col">
                  {hasDiscount && (
                    <span className="text-ink-400 line-through text-sm">{money(product.price, product.currency)}</span>
                  )}
                  <span className="text-3xl sm:text-4xl font-bold text-ink-900">
                    {money(hasDiscount ? product.sale_price : product.price, product.currency)}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <AddToCartButton product={product} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-cream-100 border border-ink-100 p-5 rounded-2xl">
                <Truck className="w-5 h-5 text-ink-400" />
                <div>
                  <p className="text-[10px] font-bold text-ink-400 uppercase">Logística</p>
                  <p className="text-xs font-bold text-ink-900">
                    {product.requires_shipping ? 'Con envío' : 'Retiro en tienda'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-cream-100 border border-ink-100 p-5 rounded-2xl">
                <ShieldCheck className="w-5 h-5 text-ink-400" />
                <div>
                  <p className="text-[10px] font-bold text-ink-400 uppercase">Stock</p>
                  <p className="text-xs font-bold text-ink-900">
                    {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                  </p>
                </div>
              </div>
            </div>

            {product.description && (
              <div className="bg-cream-100 p-6 sm:p-8 rounded-3xl border border-ink-100">
                <h2 className="font-serif text-lg font-medium text-ink-900 mb-3">Descripción</h2>
                <p className="text-ink-600 text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {filledAttributes.length > 0 && (
              <div className="bg-cream-100 p-6 sm:p-8 rounded-3xl border border-ink-100">
                <h2 className="font-serif text-lg font-medium text-ink-900 mb-4">Características</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  {filledAttributes.map((def) => (
                    <div key={def.key} className="flex justify-between text-sm border-b border-ink-200/60 pb-2">
                      <dt className="text-ink-500">{def.label}</dt>
                      <dd className="text-ink-900 font-semibold text-right">
                        {String(attributes[def.key])}
                        {def.unit ? ` ${def.unit}` : ''}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>

        {related && related.length > 0 && (
          <div className="mt-20 pt-10 border-t border-ink-200">
            <h2 className="font-serif text-2xl font-medium text-ink-900 mb-6">
              Más de {categoryName}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {related.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="group bg-cream-100 rounded-2xl border border-ink-100 overflow-hidden hover:shadow-lg hover:shadow-ink-900/5 transition-all"
                >
                  <div className="relative aspect-square bg-cream-200">
                    {p.image_url ? (
                      <Image src={p.image_url} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, 25vw" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-300 font-serif text-3xl">
                        {p.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-ink-900 truncate">{p.name}</h3>
                    <span className="text-sm font-bold text-ink-700 mt-1 block">{money(p.price, p.currency)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
