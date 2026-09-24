import Link from 'next/link';
import Image from 'next/image';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { ArrowRight, Truck, ShieldCheck, MessageCircle } from 'lucide-react';
import { isValidHex } from '@/lib/themeColors';

export const revalidate = 60;

async function getHomeData() {
  const supabase = await createClient();
  const headerList = await headers();
  const tenantSlug = headerList.get('x-tenant-slug') || process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || 'cirelia';

  const { data: tenant } = await supabase.from('tenants').select('id, name').eq('slug', tenantSlug).maybeSingle();

  if (!tenant) {
    return { tenant: null, categories: [], featured: [], onSale: [], blocks: [], heroStyle: 'classic' as const, heroConfig: {} };
  }

  const nowIso = new Date().toISOString();

  const [{ data: categories }, { data: featured }, { data: onSale }, { data: blocksRaw }, { data: heroTheme }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, slug, image_url')
      .eq('tenant_id', tenant.id)
      .is('parent_id', null)
      .order('name')
      .limit(8),
    supabase
      .from('products')
      .select('id, name, price, image_url, currency')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .eq('is_featured', true)
      .limit(8),
    supabase
      .from('products')
      .select('id, name, price, sale_price, image_url, currency')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .eq('is_on_sale', true)
      .limit(8),
    // Bloques configurables desde /admin/inicio. Filtramos activos y
    // dentro de su ventana de vigencia (starts_at/ends_at) acá mismo,
    // no solo en el admin, por si el admin des-activa algo después de
    // que ya pasó su fecha.
    supabase
      .from('content_blocks')
      .select('id, type, position, config, starts_at, ends_at')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('position'),
    // Qué plantilla de hero eligió el admin en /admin/inicio, y sus
    // datos (título/subtítulo/imagen/color secundario según el estilo).
    supabase
      .from('tenant_theme')
      .select('hero_style, hero_config')
      .eq('tenant_id', tenant.id)
      .maybeSingle(),
  ]);

  const blocks = (blocksRaw ?? []).filter((b) => {
    if (b.starts_at && b.starts_at > nowIso) return false;
    if (b.ends_at && b.ends_at < nowIso) return false;
    return true;
  });

  // Los bloques de tipo "category_spotlight" necesitan sus propios
  // productos; los resolvemos en paralelo acá para no hacerlo en el
  // componente (que no puede ser async dentro del render de la lista).
  const spotlightBlocks = blocks.filter((b) => b.type === 'category_spotlight' && b.config?.category_id);
  const spotlightProducts: Record<string, any[]> = {};
  if (spotlightBlocks.length > 0) {
    await Promise.all(
      spotlightBlocks.map(async (b) => {
        const { data } = await supabase
          .from('products')
          .select('id, name, price, sale_price, image_url, currency')
          .eq('tenant_id', tenant.id)
          .eq('category_id', b.config.category_id)
          .eq('is_active', true)
          .limit(4);
        spotlightProducts[b.id] = data ?? [];
      })
    );
  }

  return {
    tenant,
    categories: categories ?? [],
    featured: featured ?? [],
    onSale: onSale ?? [],
    blocks,
    spotlightProducts,
    heroStyle: (heroTheme?.hero_style ?? 'classic') as HeroStyle,
    heroConfig: (heroTheme?.hero_config ?? {}) as HeroConfig,
  };
}

type HeroStyle = 'classic' | 'minimal' | 'full_image' | 'gradient' | 'split' | 'editorial';
type HeroConfig = {
  title?: string;
  subtitle?: string;
  image_url?: string;
  gradient_color?: string;
  accent_color?: string;
};

function money(amount: number, currency: string = 'CRC') {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export default async function Home() {
  const { tenant, categories, featured, onSale, blocks, spotlightProducts, heroStyle, heroConfig } = await getHomeData();

  return (
    <div className="flex flex-col w-full">
      <Hero style={heroStyle} config={heroConfig} tenantName={tenant?.name} featured={featured} />

      {/* BLOQUES CONFIGURABLES (desde /admin/inicio) */}
      {(blocks ?? []).map((block: any) => (
        <ContentBlock key={block.id} block={block} spotlightProducts={spotlightProducts?.[block.id] ?? []} />
      ))}

      {/* CATEGORÍAS */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-ink-900">Categorías</h2>
              <p className="text-ink-500 text-sm mt-1">Encontrá justo lo que buscás.</p>
            </div>
            <Link href="/shop" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-gold-700 hover:text-gold-800">
              Ver todo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {categories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  className="group relative aspect-square rounded-3xl overflow-hidden bg-cream-200 border border-ink-100"
                >
                  {cat.image_url ? (
                    <Image
                      src={cat.image_url}
                      alt={cat.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cream-200 to-gold-100">
                      <span className="font-serif text-2xl text-gold-700">{cat.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />
                  <span className="absolute bottom-4 left-4 text-cream-50 font-bold text-sm">{cat.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Todavía no hay categorías cargadas"
              subtitle="En cuanto el equipo cargue el catálogo, aparecerán acá."
            />
          )}
        </div>
      </section>

      {/* DESTACADOS */}
      {featured.length > 0 && (
        <section className="py-16 sm:py-20 bg-cream-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-ink-900">Destacados</h2>
              <p className="text-ink-500 text-sm mt-1">Selección especial del equipo.</p>
            </div>
            <ProductGrid products={featured} />
          </div>
        </section>
      )}

      {/* OFERTAS */}
      {onSale.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-ink-900">Ofertas</h2>
              <p className="text-ink-500 text-sm mt-1">Por tiempo limitado.</p>
            </div>
            <ProductGrid products={onSale} showSale />
          </div>
        </section>
      )}

      {/* VALORES */}
      <section className="py-16 sm:py-20 bg-ink-950 text-cream-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-xs font-bold text-gold-400 uppercase tracking-[0.25em] mb-3">Nuestra promesa</h3>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium">Más que productos, experiencias.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Truck, title: 'Envío confiable', desc: 'Logística cuidadosa para que tu pedido llegue impecable y a tiempo.' },
              { icon: ShieldCheck, title: 'Calidad garantizada', desc: 'Seleccionamos cada producto con altos estándares de calidad.' },
              { icon: MessageCircle, title: 'Asesoría cercana', desc: 'Nuestro equipo te acompaña en cada elección, sin compromiso.' },
            ].map((item) => (
              <div
                key={item.title}
                className="p-6 bg-ink-900 rounded-3xl border border-ink-800 hover:border-gold-500/40 transition-all"
              >
                <item.icon className="w-8 h-8 text-gold-400 mb-4" />
                <h4 className="text-base font-bold mb-2">{item.title}</h4>
                <p className="text-ink-300 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * El hero (la franja grande de arriba del home) tiene 4 plantillas
 * elegibles desde /admin/inicio — hero_style + hero_config en
 * tenant_theme. El mismo componente EXACTO se usa acá y en la vista
 * previa del admin (ver PreviewHero en admin/inicio/page.tsx), solo
 * que ahí no hay productos destacados reales para el showcase.
 */
function Hero({
  style,
  config,
  tenantName,
  featured,
}: {
  style: HeroStyle;
  config: HeroConfig;
  tenantName?: string | null;
  featured: any[];
}) {
  const title = config.title || 'Piezas que cuentan';
  const titleAccent = config.title ? '' : 'historias.';
  const subtitle = config.subtitle || 'Una selección curada, calidad excepcional y un servicio que se nota en cada detalle. Tu espacio, tu estilo.';
  // Color de acento opcional por hero (además del "Primario" global de
  // Configuración): si el admin elige uno acá, pisa el dorado solo en
  // el botón principal y en la palabra destacada del título de ESTE hero.
  const accent = isValidHex(config.accent_color) ? config.accent_color : null;

  const CTAs = ({ dark }: { dark: boolean }) => (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mb-10">
      <Link href="/shop" className="w-full sm:w-auto">
        <button
          className="w-full sm:w-auto group flex items-center justify-center gap-3 bg-gold-500 text-ink-950 px-8 py-4 rounded-full font-bold hover:brightness-95 transition-all duration-300 shadow-xl shadow-gold-500/20"
          style={accent ? { backgroundColor: accent } : undefined}
        >
          Explorar catálogo
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </Link>
      <Link href="/shop?sale=true" className="w-full sm:w-auto">
        <button
          className={`w-full sm:w-auto flex items-center justify-center bg-transparent border-2 px-8 py-4 rounded-full font-bold transition-all duration-300 ${
            dark ? 'border-ink-700 text-cream-50 hover:border-gold-400 hover:text-gold-400' : 'border-ink-300 text-ink-900 hover:border-gold-500 hover:text-gold-700'
          }`}
        >
          Ver ofertas
        </button>
      </Link>
    </div>
  );

  const TrustRow = ({ dark }: { dark: boolean }) => (
    <div className={`flex flex-wrap items-center gap-x-8 gap-y-3 border-t pt-7 w-full ${dark ? 'border-ink-800' : 'border-ink-200'}`}>
      {[
        { icon: ShieldCheck, label: 'Calidad garantizada' },
        { icon: Truck, label: 'Envío confiable' },
        { icon: MessageCircle, label: 'Asesoría cercana' },
      ].map((item) => (
        <div key={item.label} className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${dark ? 'text-ink-400' : 'text-ink-500'}`}>
          <item.icon className="w-4 h-4 text-gold-500" />
          {item.label}
        </div>
      ))}
    </div>
  );

  // ---- MINIMALISTA: fondo claro, todo centrado, sin showcase flotante ----
  if (style === 'minimal') {
    return (
      <section className="relative w-full bg-cream-50 border-b border-ink-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 flex flex-col items-center text-center">
          <h1 className="font-serif text-4xl sm:text-6xl font-medium tracking-tight text-ink-950 mb-6 leading-[1.05]">
            {title} {titleAccent && <span className="italic text-gold-600" style={accent ? { color: accent } : undefined}>{titleAccent}</span>}
          </h1>
          <p className="text-ink-500 text-base sm:text-lg max-w-xl mb-10 leading-relaxed">{subtitle}</p>
          <div className="flex justify-center w-full"><CTAs dark={false} /></div>
          <div className="w-full max-w-lg"><TrustRow dark={false} /></div>
        </div>
      </section>
    );
  }

  // ---- IMAGEN COMPLETA: fondo personalizado a todo lo ancho, texto encima ----
  if (style === 'full_image') {
    return (
      <section className="relative w-full overflow-hidden bg-ink-950 min-h-[560px] flex items-center">
        {config.image_url && (
          <Image src={config.image_url} alt="" fill priority className="object-cover opacity-70" sizes="100vw" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-ink-950/10" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-24 flex flex-col items-center text-center w-full">
          <h1 className="font-serif text-4xl sm:text-6xl font-medium tracking-tight text-cream-50 mb-6 leading-[1.05]">
            {title} {titleAccent && <span className="italic text-gold-400" style={accent ? { color: accent } : undefined}>{titleAccent}</span>}
          </h1>
          <p className="text-ink-200 text-base sm:text-lg max-w-xl mb-10 leading-relaxed">{subtitle}</p>
          <div className="flex justify-center w-full"><CTAs dark={true} /></div>
        </div>
      </section>
    );
  }

  // ---- DEGRADADO: colores intensos, la opción "loca" que pidió ----
  if (style === 'gradient') {
    const from = '#b8904e';
    const to = config.gradient_color || '#7c3aed';
    return (
      <section
        className="relative w-full overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
      >
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 20%, white 0%, transparent 40%), radial-gradient(circle at 80% 70%, white 0%, transparent 35%)',
          }}
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-24 sm:py-32 flex flex-col items-center text-center">
          <h1 className="font-serif text-4xl sm:text-6xl font-medium tracking-tight text-white mb-6 leading-[1.05] drop-shadow-sm">
            {title} {titleAccent && <span className="italic">{titleAccent}</span>}
          </h1>
          <p className="text-white/90 text-base sm:text-lg max-w-xl mb-10 leading-relaxed">{subtitle}</p>
          <Link href="/shop">
            <button className="group flex items-center justify-center gap-3 bg-white text-ink-950 px-8 py-4 rounded-full font-bold hover:bg-cream-100 transition-all duration-300 shadow-xl shadow-black/10">
              Explorar catálogo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>
      </section>
    );
  }

  // ---- DIVIDIDO: texto a un lado, tu imagen ocupando el otro lado completo ----
  if (style === 'split') {
    return (
      <section className="relative w-full bg-cream-50 border-b border-ink-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 min-h-[520px]">
          <div className="flex flex-col justify-center px-4 sm:px-6 lg:px-16 py-16 sm:py-20 order-2 lg:order-1">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-ink-950 mb-6 leading-[1.05]">
              {title} {titleAccent && <span className="italic text-gold-600" style={accent ? { color: accent } : undefined}>{titleAccent}</span>}
            </h1>
            <p className="text-ink-500 text-base sm:text-lg max-w-md mb-10 leading-relaxed">{subtitle}</p>
            <CTAs dark={false} />
          </div>
          <div className="relative order-1 lg:order-2 min-h-[280px] lg:min-h-0 bg-cream-200">
            {config.image_url && (
              <Image src={config.image_url} alt="" fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
            )}
          </div>
        </div>
      </section>
    );
  }

  // ---- EDITORIAL: tipografía grande y protagonista, sin foto, fondo suave ----
  if (style === 'editorial') {
    return (
      <section className="relative w-full bg-cream-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-24 sm:pt-36 sm:pb-32 flex flex-col items-center text-center">
          <div className="w-12 h-px mb-8" style={{ backgroundColor: accent ?? '#b8904e' }} />
          <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-medium tracking-tight text-ink-950 mb-8 leading-[0.95]">
            {title} {titleAccent && <span className="italic text-gold-600" style={accent ? { color: accent } : undefined}>{titleAccent}</span>}
          </h1>
          <p className="text-ink-500 text-base sm:text-lg max-w-lg mb-10 leading-relaxed">{subtitle}</p>
          <Link href="/shop" className="group inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-ink-950 border-b-2 border-ink-950 pb-1 hover:opacity-60 transition-opacity">
            Explorar catálogo
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    );
  }

  // ---- CLÁSICO (default): fondo oscuro + showcase de productos flotando ----
  return (
    <section className="relative w-full overflow-hidden bg-ink-950">
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #f6f3ec 1px, transparent 1px), linear-gradient(to bottom, #f6f3ec 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      <div className="absolute -top-40 -left-20 w-[500px] h-[500px] rounded-full bg-gold-500/20 blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full bg-gold-600/10 blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 sm:pt-32 sm:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-[5.5rem] font-medium tracking-tight text-cream-50 mb-7 leading-[0.98]">
            {config.title ? config.title : <>Piezas que cuentan<br /></>}
            {titleAccent && <span className="italic text-gold-400" style={accent ? { color: accent } : undefined}>{titleAccent}</span>}
          </h1>

          <p className="text-ink-300 text-base sm:text-lg max-w-xl mb-11 leading-relaxed">{subtitle}</p>

          <CTAs dark={true} />
          <TrustRow dark={true} />
        </div>

        {/* Showcase de productos reales, apilados con profundidad. */}
        {featured.length > 0 && (
          <div className="hidden lg:flex lg:col-span-5 relative h-[480px] items-center justify-center">
            {featured.slice(0, 3).map((p, i) => {
              const layout = [
                { top: '0%', left: '10%', w: 260, rotate: -6, z: 10 },
                { top: '22%', left: '42%', w: 240, rotate: 4, z: 20 },
                { top: '52%', left: '4%', w: 220, rotate: 8, z: 5 },
              ][i];
              return (
                <div
                  key={p.id}
                  className="absolute rounded-3xl overflow-hidden border-4 border-ink-900 shadow-2xl shadow-black/50 bg-cream-100"
                  style={{ top: layout.top, left: layout.left, width: layout.w, aspectRatio: '1 / 1', transform: `rotate(${layout.rotate}deg)`, zIndex: layout.z }}
                >
                  {p.image_url ? (
                    <Image src={p.image_url} alt={p.name} fill className="object-cover" sizes="260px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-300 font-serif text-3xl">
                      {p.name?.charAt(0)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Renderiza los bloques que el admin arma en /admin/inicio
 * (content_blocks). Cada `type` sabe leer su propio `config` jsonb;
 * un tipo desconocido no rompe la página, simplemente no dibuja nada.
 */
// Tailwind necesita ver la clase completa en el código fuente para
// generarla — un template string como `grid-cols-${n}` no funciona,
// así que mapeamos a clases estáticas en vez de armarlas dinámicamente.
const TILE_COLS: Record<number, string> = { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3' };
const STAT_COLS: Record<number, string> = { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4' };

function ContentBlock({ block, spotlightProducts }: { block: any; spotlightProducts: any[] }) {
  const cfg = block.config ?? {};

  if (block.type === 'banner') {
    const content = (
      <div className="relative w-full aspect-[21/9] sm:aspect-[3/1] rounded-3xl overflow-hidden bg-cream-200">
        {cfg.image_url ? (
          <Image src={cfg.image_url} alt={cfg.title ?? ''} fill className="object-cover" sizes="100vw" />
        ) : null}
        {(cfg.title || cfg.subtitle) && (
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-ink-950/10 to-transparent flex flex-col justify-end p-6 sm:p-10">
            {cfg.title && <h3 className="font-serif text-2xl sm:text-4xl text-cream-50 mb-1">{cfg.title}</h3>}
            {cfg.subtitle && <p className="text-cream-100 text-sm sm:text-base max-w-lg">{cfg.subtitle}</p>}
          </div>
        )}
      </div>
    );
    return (
      <section className="py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {cfg.href ? <Link href={cfg.href}>{content}</Link> : content}
        </div>
      </section>
    );
  }

  if (block.type === 'category_spotlight' && spotlightProducts.length > 0) {
    return (
      <section className="py-16 sm:py-20 bg-cream-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            {cfg.title && <h2 className="font-serif text-2xl sm:text-3xl font-medium text-ink-900">{cfg.title}</h2>}
            {cfg.subtitle && <p className="text-ink-500 text-sm mt-1">{cfg.subtitle}</p>}
          </div>
          <ProductGrid products={spotlightProducts} showSale />
        </div>
      </section>
    );
  }

  if (block.type === 'promo' && Array.isArray(cfg.tiles) && cfg.tiles.length > 0) {
    return (
      <section className="py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {(cfg.title || cfg.subtitle) && (
            <div className="mb-6">
              {cfg.title && <h2 className="font-serif text-2xl sm:text-3xl font-medium text-ink-900">{cfg.title}</h2>}
              {cfg.subtitle && <p className="text-ink-500 text-sm mt-1">{cfg.subtitle}</p>}
            </div>
          )}
          <div className={`grid gap-4 sm:gap-6 grid-cols-1 ${TILE_COLS[Math.min(cfg.tiles.length, 3)]}`}>
            {cfg.tiles.map((tile: any, i: number) => {
              const inner = (
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-cream-200 group">
                  {tile.image_url ? (
                    <Image src={tile.image_url} alt={tile.title ?? ''} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, 33vw" />
                  ) : null}
                  {tile.title && (
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent flex items-end p-5">
                      <h3 className="font-serif text-xl text-cream-50">{tile.title}</h3>
                    </div>
                  )}
                </div>
              );
              return tile.href ? (
                <Link key={i} href={tile.href}>{inner}</Link>
              ) : (
                <div key={i}>{inner}</div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === 'stats' && Array.isArray(cfg.items) && cfg.items.length > 0) {
    return (
      <section className="py-10 sm:py-12 bg-ink-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`grid gap-6 grid-cols-2 ${STAT_COLS[Math.min(cfg.items.length, 4)]}`}>
            {cfg.items.map((item: any, i: number) => (
              <div key={i} className="text-center">
                <p className="font-serif text-3xl sm:text-4xl text-gold-400">{item.value}</p>
                <p className="text-cream-200 text-xs sm:text-sm mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return null;
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center py-16 px-6 rounded-3xl border border-dashed border-ink-200 bg-cream-50">
      <p className="font-serif text-lg text-ink-700 mb-1">{title}</p>
      <p className="text-ink-400 text-sm">{subtitle}</p>
    </div>
  );
}

function ProductGrid({
  products,
  showSale = false,
}: {
  products: any[];
  showSale?: boolean;
}) {
  return (
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
            {showSale && p.sale_price ? (
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
  );
}
