import Link from 'next/link';
import Image from 'next/image';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getTenantSettings } from '@/lib/tenantSettings';
import { Search, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

export const dynamic = 'force-dynamic';

interface ShopProps {
  searchParams: Promise<{
    category?: string;
    q?: string;
    sort?: string;
    page?: string;
    sale?: string;
  }>;
}

function money(amount: number, currency: string = 'CRC') {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

const PAGE_SIZE = 16;

export default async function ShopPage({ searchParams }: ShopProps) {
  const supabase = await createClient();
  const headerList = await headers();
  const tenantSlug = headerList.get('x-tenant-slug') || process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || 'cirelia';

  const { category = '', q = '', sort = '', page = '1', sale = '' } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).maybeSingle();

  if (!tenant) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <p className="text-ink-400">Tienda no encontrada.</p>
      </div>
    );
  }

  const settings = await getTenantSettings(tenant.id);

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('tenant_id', tenant.id)
    .order('name');

  let query = supabase
    .from('products')
    .select('id, name, price, sale_price, is_on_sale, image_url, currency, category_id', { count: 'exact' })
    .eq('tenant_id', tenant.id)
    .eq('is_active', true);

  if (category) {
    const cat = categories?.find((c) => c.slug === category);
    if (cat) query = query.eq('category_id', cat.id);
  }

  if (q) {
    // Búsqueda simple por ahora (ilike); el plan es moverla a pg_trgm
    // para tolerancia a errores de tipeo cuando el catálogo crezca.
    query = query.ilike('name', `%${q}%`);
  }

  if (sale === 'true') {
    query = query.eq('is_on_sale', true);
  }

  if (sort === 'price_asc') query = query.order('price', { ascending: true });
  else if (sort === 'price_desc') query = query.order('price', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  const { data: products, count } = await query.range(from, to);

  const total = count || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const next = { category, q, sort, page: String(currentPage), sale, ...overrides };
    Object.entries(next).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const qs = params.toString();
    return qs ? `/shop?${qs}` : '/shop';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-ink-900">{sale === 'true' ? 'Ofertas' : 'Catálogo'}</h1>
        <p className="text-ink-500 mt-1 text-sm">
          {sale === 'true' ? 'Por tiempo limitado, no te quedes fuera.' : 'Equilibrio perfecto entre calidad y diseño.'}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-5 bg-cream-100 border border-ink-100 rounded-3xl p-5 sm:p-6 mb-10">
        <form method="GET" action="/shop" className="flex gap-2">
          {category && <input type="hidden" name="category" value={category} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Buscar productos..."
              className="w-full h-11 pl-11 pr-4 rounded-full border border-ink-200 bg-cream-50 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-gold-400"
            />
          </div>
          <button
            type="submit"
            className="h-11 px-6 rounded-full bg-ink-900 text-cream-50 text-xs font-bold uppercase tracking-wider hover:bg-gold-600 transition-colors shrink-0"
          >
            Buscar
          </button>
        </form>

        {categories && categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 -mx-1 px-1">
            <Link
              href={buildHref({ category: undefined, page: '1' })}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                !category ? 'bg-gold-600 text-cream-50' : 'bg-cream-50 text-ink-600 border border-ink-200 hover:border-gold-400'
              }`}
            >
              Todas
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={buildHref({ category: cat.slug, page: '1' })}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  category === cat.slug
                    ? 'bg-gold-600 text-cream-50'
                    : 'bg-cream-50 text-ink-600 border border-ink-200 hover:border-gold-400'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        <div className="h-px bg-ink-200/60" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs font-bold text-ink-500">
            Mostrando <span className="text-ink-900">{total === 0 ? 0 : from + 1}–{Math.min(to + 1, total)}</span> de{' '}
            {total} productos
          </p>
          <div className="flex gap-2">
            {[
              { value: '', label: 'Más recientes' },
              { value: 'price_asc', label: 'Menor precio' },
              { value: 'price_desc', label: 'Mayor precio' },
            ].map((opt) => (
              <Link
                key={opt.value}
                href={buildHref({ sort: opt.value || undefined, page: '1' })}
                className={`px-3 py-2 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors ${
                  sort === opt.value
                    ? 'bg-ink-900 text-cream-50'
                    : 'bg-cream-50 text-ink-600 border border-ink-200 hover:border-gold-400'
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Rejilla */}
      {products && products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                className="group bg-cream-50 rounded-2xl border border-ink-100 overflow-hidden hover:shadow-lg hover:shadow-ink-900/5 transition-all"
              >
                <div className="relative aspect-square bg-cream-200">
                  {p.image_url ? (
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-300 font-serif text-3xl">
                      {p.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-ink-900 truncate">{p.name}</h3>
                  {p.is_on_sale && p.sale_price ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-gold-700">{money(p.sale_price, p.currency)}</span>
                      <span className="text-xs text-ink-400 line-through">{money(p.price, p.currency)}</span>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-ink-700 mt-1 block">{money(p.price, p.currency)}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Link
                href={buildHref({ page: String(Math.max(1, currentPage - 1)) })}
                className={`p-2.5 rounded-full border border-ink-200 ${
                  currentPage === 1 ? 'opacity-30 pointer-events-none' : 'hover:border-gold-400'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
              <span className="text-xs font-bold text-ink-500 px-3">
                Página {currentPage} de {totalPages}
              </span>
              <Link
                href={buildHref({ page: String(Math.min(totalPages, currentPage + 1)) })}
                className={`p-2.5 rounded-full border border-ink-200 ${
                  currentPage === totalPages ? 'opacity-30 pointer-events-none' : 'hover:border-gold-400'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-24 bg-cream-50 border border-dashed border-ink-200 rounded-3xl">
          <p className="text-ink-400 font-medium">
            {q || category ? 'No se encontraron productos con esos filtros.' : 'Todavía no hay productos cargados.'}
          </p>
          {(q || category) && (
            <Link href="/shop" className="mt-4 inline-block text-xs font-black text-gold-700 uppercase tracking-wider hover:underline">
              Restablecer filtros
            </Link>
          )}
        </div>
      )}

      {/* CTA de asesoría */}
      <div className="mt-24 bg-ink-950 text-cream-50 rounded-[2.5rem] p-8 md:p-14 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <h2 className="font-serif text-2xl md:text-4xl font-medium mb-4 leading-tight">
            ¿Dudas sobre algún producto?
          </h2>
          <p className="text-ink-300 text-sm md:text-base mb-8 max-w-xl leading-relaxed">
            Hablemos directamente. Nuestro equipo está disponible para ayudarte a elegir lo que necesitás.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <a
              href={`https://wa.me/${settings.whatsapp_number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-cream-50 text-ink-950 font-bold text-sm px-7 py-3.5 rounded-2xl w-full sm:w-auto hover:bg-gold-100 transition-all"
            >
              <WhatsAppIcon style={{ fontSize: 18 }} />
              Chat de WhatsApp
            </a>
            <a
              href={`mailto:${settings.contact_email}`}
              className="flex items-center justify-center gap-3 bg-ink-900 border border-ink-800 text-ink-300 font-bold text-sm px-7 py-3.5 rounded-2xl w-full sm:w-auto hover:bg-ink-800 hover:text-cream-50 transition-all"
            >
              <Mail size={16} />
              {settings.contact_email}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
