// components/RelatedProducts.tsx
import { supabase } from '@/lib/supabase';
import ProductCard from './ProductCard';

export default async function RelatedProducts({ categoryId, currentProductId }: { categoryId: string, currentProductId: string }) {
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', categoryId)
    .neq('id', currentProductId)
    .limit(4);

  if (!products || products.length === 0) return null;

  return (
    <section className="py-16">
      <h3 className="text-2xl font-black mb-8">También te puede interesar</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((p: any) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}