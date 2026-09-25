import Link from 'next/link';
import Image from 'next/image';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { ArrowRight, Truck, ShieldCheck, MessageCircle } from 'lucide-react';
import { isValidHex } from '@/lib/themeColors';
import { resolveBackgroundLayerStyle, hasBackground, type BlockBackground, type HomeConfig, type CategoriesLayout, type GalleryTile, GALLERY_SIZE_SPAN } from '@/lib/blockBackground';
import ProductCarousel, { type CardStyle } from '@/components/ProductCarousel';
import CountdownTimer from '@/components/CountdownTimer';

export const revalidate = 60;

const PRODUCT_FIELDS =
  'id, name, price, sale_price, image_url, currency, stock, is_promo, promo_price, promo_badge, is_fast_delivery, is_express, brand, rating, review_count';

async function getHomeData() {
  const supabase = await createClient();
  const headerList = await headers();
  const tenantSlug = headerList.get('x-tenant-slug') || process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || 'cirelia';

  const { data: tenant } = await supabase.from('tenants').select('id, name').eq('slug', tenantSlug).maybeSingle();

  if (!tenant) {
    return {
      tenant: null, categories: [], featured: [], onSale: [], blocks: [],
      heroStyle: 'classic' as const, heroConfig: {},
      showCategories: true, showFeatured: true, showOnSale: true,
      homeConfig: {} as HomeConfig,
    };
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
      .select(PRODUCT_FIELDS)
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .eq('is_featured', true)
      .limit(24),
    supabase
      .from('products')
      .select(PRODUCT_FIELDS)
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .eq('is_on_sale', true)
      .limit(24),
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
    // Qué plantilla de hero eligió el admin en /admin/inicio, sus datos,
    // y si las secciones estándar (Categorías/Destacados/Ofertas) están
    // prendidas o apagadas desde Diseño.
    supabase
      .from('tenant_theme')
      .select('hero_style, hero_config, show_categories, show_featured, show_on_sale, home_config')
      .eq('tenant_id', tenant.id)
      .maybeSingle(),
  ]);

  const homeConfig = (heroTheme?.home_config ?? {}) as HomeConfig;

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
          .select(PRODUCT_FIELDS)
          .eq('tenant_id', tenant.id)
          .eq('category_id', b.config.category_id)
          .eq('is_active', true)
          .limit(12);
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
    showCategories: heroTheme?.show_categories ?? true,
    showFeatured: heroTheme?.show_featured ?? true,
    showOnSale: heroTheme?.show_on_sale ?? true,
    homeConfig,
  };
}

type HeroStyle = 'classic' | 'minimal' | 'full_image' | 'gradient' | 'split' | 'editorial';
type HeroConfig = {
  title?: string;
  subtitle?: string;
  image_url?: string;
  gradient_color?: string;
  accent_color?: string;
  countdown_end?: string | null;
};

export default async function Home() {
  const {
    tenant, categories, featured, onSale, blocks, spotlightProducts, heroStyle, heroConfig,
    showCategories, showFeatured, showOnSale, homeConfig,
  } = await getHomeData();

  const cardStyle: CardStyle = homeConfig.card_style ?? 'classic';
  const categoriesLayout: CategoriesLayout = homeConfig.categories_layout ?? 'grid';
  const featuredCount = homeConfig.featured?.count ?? 12;
  const onSaleCount = homeConfig.on_sale?.count ?? 12;
  const featuredList = featured.slice(0, featuredCount);
  const onSaleList = onSale.slice(0, onSaleCount);
  const featuredBg = homeConfig.featured?.bg;
  const onSaleBg = homeConfig.on_sale?.bg;
  const featuredCountdown = homeConfig.featured?.countdown_end;
  const onSaleCountdown = homeConfig.on_sale?.countdown_end;

  return (
    <div className="flex flex-col w-full">
      <Hero style={heroStyle} config={heroConfig} tenantName={tenant?.name} featured={featured} />

      {/* BLOQUES CONFIGURABLES (desde /admin/inicio) */}
      {(blocks ?? []).map((block: any) => (
        <ContentBlock key={block.id} block={block} spotlightProducts={spotlightProducts?.[block.id] ?? []} cardStyle={cardStyle} />
      ))}

      {/* CATEGORÍAS — se puede apagar desde Diseño → Categorías */}
      {showCategories && (
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
              <CategoriesSection categories={categories} layout={categoriesLayout} />
            ) : (
              <EmptyState
                title="Todavía no hay categorías cargadas"
                subtitle="En cuanto el equipo cargue el catálogo, aparecerán acá."
              />
            )}
          </div>
        </section>
      )}

      {/* DESTACADOS — se puede apagar, cambiar de fondo y elegir cuántos
          productos mostrar desde Diseño → Categorías. */}
      {showFeatured && featuredList.length > 0 && (
        <section className="relative py-16 sm:py-20 bg-cream-100 overflow-hidden">
          {hasBackground(featuredBg) && (
            <div className="absolute inset-0" style={resolveBackgroundLayerStyle(featuredBg)} />
          )}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-ink-900">Destacados</h2>
                <p className="text-ink-500 text-sm mt-1">Selección especial del equipo.</p>
              </div>
              <CountdownTimer endsAt={featuredCountdown} />
            </div>
            <ProductCarousel products={featuredList} cardStyle={cardStyle} />
          </div>
        </section>
      )}

      {/* OFERTAS — se puede apagar, cambiar de fondo y elegir cuántos
          productos mostrar desde Diseño → Categorías. */}
      {showOnSale && onSaleList.length > 0 && (
        <section className="relative py-16 sm:py-20 overflow-hidden">
          {hasBackground(onSaleBg) && (
            <div className="absolute inset-0" style={resolveBackgroundLayerStyle(onSaleBg)} />
          )}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-ink-900">Ofertas</h2>
                <p className="text-ink-500 text-sm mt-1">Por tiempo limitado.</p>
              </div>
              <CountdownTimer endsAt={onSaleCountdown} />
            </div>
            <ProductCarousel products={onSaleList} showSale cardStyle={cardStyle} />
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
      {config.countdown_end && (
        <div className="w-full sm:w-auto sm:mr-1 order-first sm:order-none">
          <CountdownTimer endsAt={config.countdown_end} compact />
        </div>
      )}
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
            dark ? 'border-ink-700 text-cream-50 hover:border-secondary-400 hover:text-secondary-400' : 'border-ink-300 text-ink-900 hover:border-secondary-500 hover:text-secondary-700'
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

function ContentBlock({
  block,
  spotlightProducts,
  cardStyle,
}: {
  block: any;
  spotlightProducts: any[];
  cardStyle: CardStyle;
}) {
  const cfg = block.config ?? {};
  const bg: BlockBackground | undefined = cfg.background;
  const hasBg = hasBackground(bg);

  if (block.type === 'banner') {
    // El banner necesita AL MENOS una imagen (la de siempre) o un fondo
    // (color/degradado/otra imagen) — si no tiene nada de eso, no hay
    // nada que mostrar y se omite, igual que antes.
    if (!cfg.image_url && !hasBg && !cfg.title) return null;
    const content = (
      <div className="relative w-full aspect-[21/9] sm:aspect-[3/1] rounded-3xl overflow-hidden bg-cream-200">
        {hasBg && <div className="absolute inset-0" style={resolveBackgroundLayerStyle(bg)} />}
        {cfg.image_url ? (
          <Image src={cfg.image_url} alt={cfg.title ?? ''} fill className="object-cover" sizes="100vw" />
        ) : null}
        {block.ends_at && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
            <CountdownTimer endsAt={block.ends_at} compact />
          </div>
        )}
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
    const banner = cfg.side_banner as { image_url?: string; href?: string; position?: 'left' | 'right' | 'top' | 'bottom' } | undefined;
    const bannerPos = banner?.position ?? 'right';
    const hasSideBanner = Boolean(banner?.image_url);

    const bannerEl = hasSideBanner && (
      <div
        className={`relative rounded-3xl overflow-hidden bg-cream-200 shrink-0 ${
          bannerPos === 'top' || bannerPos === 'bottom'
            ? 'w-full aspect-[21/9] sm:aspect-[3/1]'
            : 'w-full sm:w-72 aspect-[16/10] sm:aspect-auto sm:self-stretch'
        }`}
      >
        <Image src={banner!.image_url!} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 320px" />
      </div>
    );
    const bannerWrapped = banner?.href && bannerEl ? <Link href={banner.href}>{bannerEl}</Link> : bannerEl;

    const header = (
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          {cfg.title && (
            <h2
              className="font-serif text-2xl sm:text-3xl font-medium text-ink-900"
              style={isValidHex(cfg.title_color) ? { color: cfg.title_color } : undefined}
            >
              {cfg.title}
            </h2>
          )}
          {cfg.subtitle && (
            <p
              className="text-ink-500 text-sm mt-1"
              style={isValidHex(cfg.subtitle_color) ? { color: cfg.subtitle_color } : undefined}
            >
              {cfg.subtitle}
            </p>
          )}
          {cfg.extra_text && <p className="text-ink-600 text-sm mt-2 max-w-2xl">{cfg.extra_text}</p>}
        </div>
        <CountdownTimer endsAt={block.ends_at} />
      </div>
    );

    const carousel = (
      <div>
        {header}
        <ProductCarousel products={spotlightProducts} showSale cardStyle={cardStyle} />
      </div>
    );

    return (
      <section className="relative py-16 sm:py-20 bg-cream-100 overflow-hidden">
        {hasBg && <div className="absolute inset-0" style={resolveBackgroundLayerStyle(bg)} />}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!hasSideBanner ? (
            carousel
          ) : bannerPos === 'top' ? (
            <div className="space-y-6">
              {bannerWrapped}
              {carousel}
            </div>
          ) : bannerPos === 'bottom' ? (
            <div className="space-y-6">
              {carousel}
              {bannerWrapped}
            </div>
          ) : (
            <div className={`flex flex-col ${bannerPos === 'left' ? 'sm:flex-row' : 'sm:flex-row-reverse'} gap-6 items-stretch`}>
              {bannerWrapped}
              <div className="flex-1 min-w-0">{carousel}</div>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (block.type === 'promo' && Array.isArray(cfg.tiles) && cfg.tiles.length > 0) {
    return (
      <section className="relative py-6 sm:py-8 overflow-hidden">
        {hasBg && <div className="absolute inset-0" style={resolveBackgroundLayerStyle(bg)} />}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {(cfg.title || cfg.subtitle || block.ends_at) && (
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                {cfg.title && <h2 className="font-serif text-2xl sm:text-3xl font-medium text-ink-900">{cfg.title}</h2>}
                {cfg.subtitle && <p className="text-ink-500 text-sm mt-1">{cfg.subtitle}</p>}
              </div>
              <CountdownTimer endsAt={block.ends_at} />
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

  if (block.type === 'gallery' && Array.isArray(cfg.tiles) && cfg.tiles.length > 0) {
    return (
      <section className="py-16 sm:py-20 relative overflow-hidden">
        {hasBg && <div className="absolute inset-0" style={resolveBackgroundLayerStyle(bg)} />}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {(cfg.title || cfg.subtitle || block.ends_at) && (
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <div>
                {cfg.title && <h2 className="font-serif text-2xl sm:text-3xl font-medium text-ink-900">{cfg.title}</h2>}
                {cfg.subtitle && <p className="text-ink-500 text-sm mt-1">{cfg.subtitle}</p>}
              </div>
              <CountdownTimer endsAt={block.ends_at} />
            </div>
          )}
          <div
            className="grid gap-4 sm:gap-5 grid-cols-2 sm:grid-cols-4 auto-rows-[140px] sm:auto-rows-[180px]"
            style={{ gridAutoFlow: 'dense' }}
          >
            {(cfg.tiles as GalleryTile[]).map((tile, i) => {
              const span = GALLERY_SIZE_SPAN[tile.size ?? 'sm'];
              const inner = (
                <div className="relative rounded-3xl overflow-hidden bg-cream-200 group h-full w-full">
                  {tile.image_url ? (
                    <Image
                      src={tile.image_url}
                      alt={tile.title ?? ''}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cream-200 to-gold-100" />
                  )}
                  {(tile.title || tile.subtitle) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent flex flex-col justify-end p-4 sm:p-5">
                      {tile.title && (
                        <h3
                          className="font-serif text-lg sm:text-xl leading-tight"
                          style={{ color: isValidHex(tile.title_color) ? tile.title_color! : '#fefdfb' }}
                        >
                          {tile.title}
                        </h3>
                      )}
                      {tile.subtitle && (
                        <p
                          className="text-xs sm:text-sm mt-1"
                          style={{ color: isValidHex(tile.subtitle_color) ? tile.subtitle_color! : '#f3ebda' }}
                        >
                          {tile.subtitle}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
              return tile.href ? (
                <Link key={i} href={tile.href} className={`block h-full ${span}`}>{inner}</Link>
              ) : (
                <div key={i} className={`h-full ${span}`}>{inner}</div>
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
          {block.ends_at && (
            <div className="flex justify-center mb-6">
              <CountdownTimer endsAt={block.ends_at} compact />
            </div>
          )}
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

type CategoryItem = { id: string; name: string; slug: string; image_url?: string | null };

/**
 * Sección "Categorías" del home con 4 diseños elegibles desde
 * Diseño → Categorías (antes solo existía la grilla fija):
 * grilla (de siempre), carrusel horizontal, pills compactas, o lista
 * vertical tipo menú — útil según cuántas categorías tenga la tienda.
 */
function CategoriesSection({ categories, layout }: { categories: CategoryItem[]; layout: CategoriesLayout }) {
  if (layout === 'carousel') {
    return (
      <div className="flex gap-4 overflow-x-auto custom-scrollbar snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/shop?category=${cat.slug}`}
            className="group shrink-0 w-28 sm:w-32 snap-start flex flex-col items-center gap-2"
          >
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-cream-200 border border-ink-100">
              {cat.image_url ? (
                <Image src={cat.image_url} alt={cat.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="120px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cream-200 to-gold-100">
                  <span className="font-serif text-xl text-gold-700">{cat.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <span className="text-xs font-semibold text-ink-900 text-center truncate w-full">{cat.name}</span>
          </Link>
        ))}
      </div>
    );
  }

  if (layout === 'pills') {
    return (
      <div className="flex flex-wrap gap-3">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/shop?category=${cat.slug}`}
            className="group flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-full bg-cream-100 border border-ink-100 hover:border-gold-400 hover:bg-gold-50 transition-colors"
          >
            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-cream-200 shrink-0">
              {cat.image_url ? (
                <Image src={cat.image_url} alt={cat.name} fill className="object-cover" sizes="36px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-serif text-xs text-gold-700">{cat.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <span className="text-sm font-semibold text-ink-900">{cat.name}</span>
          </Link>
        ))}
      </div>
    );
  }

  if (layout === 'list') {
    return (
      <div className="divide-y divide-ink-100 rounded-2xl border border-ink-100 overflow-hidden bg-cream-50">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/shop?category=${cat.slug}`}
            className="group flex items-center gap-4 px-4 py-3 hover:bg-cream-100 transition-colors"
          >
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-cream-200 shrink-0">
              {cat.image_url ? (
                <Image src={cat.image_url} alt={cat.name} fill className="object-cover" sizes="48px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-serif text-sm text-gold-700">{cat.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <span className="text-sm font-semibold text-ink-900 flex-1">{cat.name}</span>
            <ArrowRight className="w-4 h-4 text-ink-300 group-hover:text-gold-600 group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>
    );
  }

  // grid (default, de siempre)
  return (
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
  );
}

// ProductCarousel vive en su propio archivo (components/ProductCarousel.tsx)
// porque necesita interactividad de cliente (flechas + scroll) — un
// server component como este no puede tener onClick.
