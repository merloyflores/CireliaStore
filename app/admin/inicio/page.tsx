'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/app/providers';
import {
  Plus, Trash2, ArrowUp, ArrowDown, Loader2, Image as ImageIcon, Layout, Eye, EyeOff,
  LayoutGrid, Sparkles, BarChart3, GripVertical, X, Smartphone, Monitor, ExternalLink,
  AlignCenter, Wand2, Check, Columns2, Type, Maximize2, Palette, Save, ShoppingBag, ArrowRight,
  Ban, Droplet, Blend,
} from 'lucide-react';
import { generateShades, isValidHex } from '@/lib/themeColors';
import {
  resolveBackgroundLayerStyle, hasBackground,
  type BlockBackground, type HomeConfig, type CardStyle, type GalleryTile, type GallerySize,
} from '@/lib/blockBackground';
import CountdownTimer from '@/components/CountdownTimer';

type Category = { id: string; name: string; image_url: string | null };

type BlockType = 'banner' | 'category_spotlight' | 'promo' | 'stats' | 'gallery';

type Block = {
  id: string;
  type: BlockType;
  position: number;
  config: Record<string, any>;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

const BLOCK_META: Record<BlockType, { label: string; blurb: string; icon: any; accent: string; accentBg: string; accentText: string }> = {
  banner: {
    label: 'Banner',
    blurb: 'Una imagen grande de ancho completo, ideal para una promo destacada.',
    icon: ImageIcon,
    accent: 'bg-gold-500',
    accentBg: 'bg-gold-50',
    accentText: 'text-gold-700',
  },
  category_spotlight: {
    label: 'Categoría destacada',
    blurb: 'Una grilla con los productos de una categoría elegida.',
    icon: LayoutGrid,
    accent: 'bg-emerald-500',
    accentBg: 'bg-emerald-50',
    accentText: 'text-emerald-700',
  },
  promo: {
    label: 'Mosaico promocional',
    blurb: 'Hasta 3 tarjetas lado a lado, cada una con su link.',
    icon: Sparkles,
    accent: 'bg-rose-500',
    accentBg: 'bg-rose-50',
    accentText: 'text-rose-700',
  },
  stats: {
    label: 'Franja de confianza',
    blurb: 'Números cortos tipo "+500 clientes felices" en una fila.',
    icon: BarChart3,
    accent: 'bg-sky-500',
    accentBg: 'bg-sky-50',
    accentText: 'text-sky-700',
  },
  gallery: {
    label: 'Galería combinada',
    blurb: 'Banners e imágenes de distinto tamaño mezclados libremente, estilo Gollo.com.',
    icon: LayoutGrid,
    accent: 'bg-violet-500',
    accentBg: 'bg-violet-50',
    accentText: 'text-violet-700',
  },
};

const BLOCK_TYPES = Object.keys(BLOCK_META) as BlockType[];

type HeroStyle = 'classic' | 'minimal' | 'full_image' | 'gradient' | 'split' | 'editorial';
type HeroConfig = { title?: string; subtitle?: string; image_url?: string; gradient_color?: string; accent_color?: string; countdown_end?: string | null };

const HERO_META: Record<HeroStyle, { label: string; blurb: string; icon: any }> = {
  classic: { label: 'Clásico', blurb: 'Fondo oscuro, dorado, con tus productos destacados flotando.', icon: Sparkles },
  minimal: { label: 'Minimalista', blurb: 'Fondo claro, todo centrado, sin distracciones.', icon: AlignCenter },
  full_image: { label: 'Imagen completa', blurb: 'Tu propia foto de fondo a todo lo ancho.', icon: ImageIcon },
  gradient: { label: 'Degradado llamativo', blurb: 'Colores intensos — la opción atrevida.', icon: Wand2 },
  split: { label: 'Dividido', blurb: 'Texto a un lado, tu foto ocupando todo el otro lado.', icon: Columns2 },
  editorial: { label: 'Editorial', blurb: 'Tipografía enorme, protagonista, sin foto — muy elegante.', icon: Type },
};
const HERO_STYLES = Object.keys(HERO_META) as HeroStyle[];

// Tema visual: antes vivía en Configuración, separado del hero y las
// piezas — pero todo esto es "cómo se ve tu página", así que ahora
// vive junto en un solo lugar (Configuración se queda con Contacto y
// Niveles de fidelidad, que son datos, no diseño).
type Theme = {
  color_primary: string;
  color_secondary: string;
  color_accent: string;
  color_bg: string;
  color_text: string;
  font: string;
  logo_url: string | null;
  banner_url: string | null;
  show_categories: boolean;
  show_featured: boolean;
  show_on_sale: boolean;
  home_config: HomeConfig;
};
const THEME_COLOR_FIELDS: { key: keyof Theme; label: string }[] = [
  { key: 'color_primary', label: 'Primario' },
  { key: 'color_secondary', label: 'Secundario' },
  { key: 'color_accent', label: 'Acento' },
  { key: 'color_bg', label: 'Fondo' },
  { key: 'color_text', label: 'Texto' },
];

type DesignTab = 'tema' | 'hero' | 'categorias' | 'piezas';
const DESIGN_TABS: { id: DesignTab; label: string }[] = [
  { id: 'tema', label: 'Tema visual' },
  { id: 'hero', label: 'Hero' },
  { id: 'categorias', label: 'Categorías' },
  { id: 'piezas', label: 'Piezas del home' },
];

export default function InicioBuilderPage() {
  const supabase = createClient();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewProducts, setPreviewProducts] = useState<Record<string, any[]>>({});

  const [heroStyle, setHeroStyle] = useState<HeroStyle>('classic');
  const [heroConfig, setHeroConfig] = useState<HeroConfig>({});
  const [uploadingHero, setUploadingHero] = useState(false);
  const [savingHero, setSavingHero] = useState(false);
  const [heroSaved, setHeroSaved] = useState(false);
  const [showHeroCatalog, setShowHeroCatalog] = useState(false);

  const [theme, setTheme] = useState<Theme | null>(null);
  const [savingTheme, setSavingTheme] = useState(false);
  const [themeSaved, setThemeSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCategoryId, setUploadingCategoryId] = useState<string | null>(null);

  const [designTab, setDesignTab] = useState<DesignTab>('tema');

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [{ data: blocksData }, { data: cats }, { data: themeData }] = await Promise.all([
      supabase.from('content_blocks').select('*').eq('tenant_id', tenantId).order('position'),
      supabase.from('categories').select('id, name, image_url').eq('tenant_id', tenantId).order('name'),
      supabase.from('tenant_theme').select('*').eq('tenant_id', tenantId).maybeSingle(),
    ]);
    setBlocks(blocksData ?? []);
    setCategories(cats ?? []);
    setHeroStyle((themeData?.hero_style as HeroStyle) ?? 'classic');
    setHeroConfig((themeData?.hero_config as HeroConfig) ?? {});
    setTheme(
      themeData
        ? { ...themeData, home_config: (themeData.home_config as HomeConfig) ?? {} }
        : {
            color_primary: '#a9813f',
            color_secondary: '#3d6b66',
            color_accent: '#a9813f',
            color_bg: '#f6f3ec',
            color_text: '#211d16',
            font: 'Inter',
            logo_url: null,
            banner_url: null,
            show_categories: true,
            show_featured: true,
            show_on_sale: true,
            home_config: {},
          }
    );
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  // Trae productos reales para previsualizar las piezas "Categoría
  // destacada" (solo las categorías que todavía no tenemos en caché),
  // así la vista previa se ve igual que el home de verdad.
  useEffect(() => {
    if (!tenantId) return;
    const categoryIds = Array.from(
      new Set(
        blocks
          .filter((b) => b.type === 'category_spotlight' && b.config?.category_id)
          .map((b) => b.config.category_id as string)
      )
    ).filter((id) => !(id in previewProducts));
    if (categoryIds.length === 0) return;
    (async () => {
      const results = await Promise.all(
        categoryIds.map((id) =>
          supabase
            .from('products')
            .select('id, name, price, sale_price, image_url, currency')
            .eq('tenant_id', tenantId)
            .eq('category_id', id)
            .eq('is_active', true)
            .limit(4)
            .then(({ data }) => [id, data ?? []] as const)
        )
      );
      setPreviewProducts((prev) => {
        const next = { ...prev };
        for (const [id, data] of results) next[id] = data;
        return next;
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, blocks]);

  const addBlock = async (type: BlockType) => {
    if (!tenantId) return;
    setCreating(true);
    const nextPosition = blocks.length > 0 ? Math.max(...blocks.map((b) => b.position)) + 1 : 0;
    const defaultConfig = type === 'promo' || type === 'gallery' ? { tiles: [] } : type === 'stats' ? { items: [] } : {};
    // Activo desde que se crea: así el admin ve de inmediato el efecto
    // en la vista previa y en el home, en vez de preguntarse por qué
    // "no pasa nada" — puede ocultarlo después con el botón VISIBLE/OCULTO.
    const { data, error } = await supabase
      .from('content_blocks')
      .insert({ tenant_id: tenantId, type, position: nextPosition, config: defaultConfig, is_active: true })
      .select('*')
      .single();
    setCreating(false);
    if (error) {
      alert('No se pudo crear el bloque: ' + error.message);
      return;
    }
    setBlocks((b) => [...b, data]);
  };

  const updateBlock = async (id: string, patch: Partial<Block>) => {
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    const { error } = await supabase.from('content_blocks').update(patch).eq('id', id);
    if (error) alert('No se pudo guardar: ' + error.message);
  };

  const updateConfig = (block: Block, key: string, value: any) => {
    const newConfig = { ...block.config, [key]: value };
    updateBlock(block.id, { config: newConfig });
  };

  const deleteBlock = async (id: string) => {
    if (!confirm('¿Eliminar este bloque del home?')) return;
    const { error } = await supabase.from('content_blocks').delete().eq('id', id);
    if (error) {
      alert('No se pudo eliminar: ' + error.message);
      return;
    }
    setBlocks((bs) => bs.filter((b) => b.id !== id));
  };

  const persistOrder = async (ordered: Block[]) => {
    const withPositions = ordered.map((b, i) => ({ ...b, position: i }));
    setBlocks(withPositions);
    await Promise.all(
      withPositions.map((b, i) => supabase.from('content_blocks').update({ position: i }).eq('id', b.id))
    );
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const reordered = [...blocks];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    persistOrder(reordered);
  };

  // ---- Drag & drop (escritorio) — arrastrá una pieza y soltala donde quieras ----
  const handleDrop = (dropIndex: number) => {
    if (dragIndex.current === null || dragIndex.current === dropIndex) {
      setDragOverIndex(null);
      return;
    }
    const reordered = [...blocks];
    const [moved] = reordered.splice(dragIndex.current, 1);
    reordered.splice(dropIndex, 0, moved);
    persistOrder(reordered);
    dragIndex.current = null;
    setDragOverIndex(null);
  };

  const saveHero = async (style: HeroStyle, config: HeroConfig) => {
    if (!tenantId) return;
    setSavingHero(true);
    setHeroSaved(false);
    const { error } = await supabase
      .from('tenant_theme')
      .upsert({ tenant_id: tenantId, hero_style: style, hero_config: config }, { onConflict: 'tenant_id' });
    setSavingHero(false);
    if (error) {
      alert('No se pudo guardar el hero: ' + error.message);
      return;
    }
    setHeroSaved(true);
    setTimeout(() => setHeroSaved(false), 2000);
  };

  const saveTheme = async () => {
    if (!theme || !tenantId) return;
    setSavingTheme(true);
    setThemeSaved(false);
    const { error } = await supabase.from('tenant_theme').upsert({ tenant_id: tenantId, ...theme });
    setSavingTheme(false);
    if (error) {
      alert('No se pudo guardar el tema: ' + error.message);
      return;
    }
    setThemeSaved(true);
    setTimeout(() => setThemeSaved(false), 2500);
  };

  const uploadLogo = async (file: File, field: 'logo_url' | 'banner_url') => {
    if (!tenantId || !theme) return;
    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${tenantId}/theme-${field}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('products').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: pub } = supabase.storage.from('products').getPublicUrl(path);
      setTheme({ ...theme, [field]: pub.publicUrl });
    } catch (err: any) {
      alert('No se pudo subir la imagen: ' + err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  // Imagen por categoría — se sube directo a la tabla categories, no a
  // tenant_theme, así que actualiza esa fila puntual y el estado local
  // en cuanto termina (el home real ya lee categories.image_url, solo
  // faltaba desde dónde subirla).
  const uploadCategoryImage = async (categoryId: string, file: File) => {
    if (!tenantId) return;
    setUploadingCategoryId(categoryId);
    try {
      const ext = file.name.split('.').pop();
      const path = `${tenantId}/category-${categoryId}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('products').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: pub } = supabase.storage.from('products').getPublicUrl(path);
      const { error: updateError } = await supabase
        .from('categories')
        .update({ image_url: pub.publicUrl })
        .eq('id', categoryId);
      if (updateError) throw updateError;
      setCategories((cs) => cs.map((c) => (c.id === categoryId ? { ...c, image_url: pub.publicUrl } : c)));
    } catch (err: any) {
      alert('No se pudo subir la imagen: ' + err.message);
    } finally {
      setUploadingCategoryId(null);
    }
  };

  const toggleSection = async (key: 'show_categories' | 'show_featured' | 'show_on_sale') => {
    if (!theme || !tenantId) return;
    const next = { ...theme, [key]: !theme[key] };
    setTheme(next);
    setSavingTheme(true);
    setThemeSaved(false);
    const { error } = await supabase.from('tenant_theme').upsert({ tenant_id: tenantId, ...next });
    setSavingTheme(false);
    if (error) {
      alert('No se pudo guardar: ' + error.message);
      setTheme(theme);
      return;
    }
    setThemeSaved(true);
    setTimeout(() => setThemeSaved(false), 2000);
  };

  // Fondo + cantidad de productos de Destacados/Ofertas, y el estilo de
  // tarjeta (global, aplica a todos los carruseles del home) — todo
  // vive en tenant_theme.home_config, un solo jsonb.
  const saveHomeConfig = async (nextHomeConfig: HomeConfig) => {
    if (!theme || !tenantId) return;
    const next = { ...theme, home_config: nextHomeConfig };
    setTheme(next);
    setSavingTheme(true);
    setThemeSaved(false);
    const { error } = await supabase.from('tenant_theme').upsert({ tenant_id: tenantId, ...next });
    setSavingTheme(false);
    if (error) {
      alert('No se pudo guardar: ' + error.message);
      setTheme(theme);
      return;
    }
    setThemeSaved(true);
    setTimeout(() => setThemeSaved(false), 2000);
  };

  const [uploadingSectionBg, setUploadingSectionBg] = useState<'featured' | 'on_sale' | null>(null);
  const uploadSectionBgImage = async (section: 'featured' | 'on_sale', file: File) => {
    if (!tenantId || !theme) return;
    setUploadingSectionBg(section);
    try {
      const ext = file.name.split('.').pop();
      const path = `${tenantId}/section-${section}-bg-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('products').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: pub } = supabase.storage.from('products').getPublicUrl(path);
      const current = theme.home_config?.[section]?.bg ?? {};
      saveHomeConfig({
        ...theme.home_config,
        [section]: { ...theme.home_config?.[section], bg: { ...current, type: 'image', image_url: pub.publicUrl } },
      });
    } catch (err: any) {
      alert('No se pudo subir la imagen: ' + err.message);
    } finally {
      setUploadingSectionBg(null);
    }
  };

  const pickHeroStyle = (style: HeroStyle) => {
    setHeroStyle(style);
    saveHero(style, heroConfig);
  };

  const updateHeroConfig = (patch: Partial<HeroConfig>) => {
    const next = { ...heroConfig, ...patch };
    setHeroConfig(next);
  };

  const uploadHeroImage = async (file: File) => {
    if (!tenantId) return;
    setUploadingHero(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${tenantId}/hero-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('products').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: pub } = supabase.storage.from('products').getPublicUrl(path);
      const next = { ...heroConfig, image_url: pub.publicUrl };
      setHeroConfig(next);
      saveHero(heroStyle, next);
    } catch (err: any) {
      alert('No se pudo subir la imagen: ' + err.message);
    } finally {
      setUploadingHero(false);
    }
  };

  const uploadImage = async (block: Block, file: File, tileIndex?: number) => {
    if (!tenantId) return;
    const key = tileIndex !== undefined ? `${block.id}-${tileIndex}` : block.id;
    setUploadingKey(key);
    try {
      const ext = file.name.split('.').pop();
      const path = `${tenantId}/block-${key}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('products').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: pub } = supabase.storage.from('products').getPublicUrl(path);
      if (tileIndex !== undefined) {
        const tiles = [...(block.config.tiles ?? [])];
        tiles[tileIndex] = { ...tiles[tileIndex], image_url: pub.publicUrl };
        updateConfig(block, 'tiles', tiles);
      } else {
        updateConfig(block, 'image_url', pub.publicUrl);
      }
    } catch (err: any) {
      alert('No se pudo subir la imagen: ' + err.message);
    } finally {
      setUploadingKey(null);
    }
  };

  // Banner adicional al lado (o arriba/abajo) de "Categoría destacada":
  // distinto del fondo, es una imagen propia con su posición — vive en
  // config.side_banner.
  const uploadSpotlightBanner = async (block: Block, file: File) => {
    if (!tenantId) return;
    const key = `${block.id}-sidebanner`;
    setUploadingKey(key);
    try {
      const ext = file.name.split('.').pop();
      const path = `${tenantId}/block-${key}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('products').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: pub } = supabase.storage.from('products').getPublicUrl(path);
      const current = block.config.side_banner ?? {};
      updateConfig(block, 'side_banner', { ...current, image_url: pub.publicUrl });
    } catch (err: any) {
      alert('No se pudo subir la imagen: ' + err.message);
    } finally {
      setUploadingKey(null);
    }
  };

  // Imagen de FONDO de una pieza (distinto de la imagen principal del
  // banner o de cada tarjeta del mosaico): vive en config.background.
  const uploadBlockBgImage = async (block: Block, file: File) => {
    if (!tenantId) return;
    const key = `${block.id}-bg`;
    setUploadingKey(key);
    try {
      const ext = file.name.split('.').pop();
      const path = `${tenantId}/block-${key}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('products').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: pub } = supabase.storage.from('products').getPublicUrl(path);
      const current: BlockBackground = block.config.background ?? {};
      updateConfig(block, 'background', { ...current, type: 'image', image_url: pub.publicUrl });
    } catch (err: any) {
      alert('No se pudo subir la imagen: ' + err.message);
    } finally {
      setUploadingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-ink-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-ink-950 tracking-tight">Diseño</h1>
          <p className="text-ink-500">
            Todo lo que define cómo se ve tu página, en un solo lugar: colores y tipografía, el hero de arriba, y
            las piezas del home. A la derecha ves cómo queda, en vivo.
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs font-bold text-ink-500 hover:text-ink-900 bg-white border border-ink-200 px-3 py-2 rounded-xl shrink-0"
        >
          <ExternalLink size={13} /> Ver home real
        </a>
      </div>

      {/* PESTAÑAS — Tema / Hero / Categorías / Piezas, todo junto en
          Diseño (antes estaba repartido entre Configuración e Inicio). */}
      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 -mx-1 px-1">
        {DESIGN_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setDesignTab(t.id)}
            className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              designTab === t.id ? 'bg-ink-950 text-cream-50' : 'bg-white border border-ink-200 text-ink-600 hover:border-gold-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* LAYOUT FIJO DE DOS PANELES: editor a la izquierda (con su
          propio scroll), vista previa fija a la derecha — así nunca se
          desarma ni se monta una cosa sobre otra, ni en desktop ni en
          mobile (el preview simplemente pasa abajo). */}
      <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
      {/* TEMA VISUAL — antes vivía separado en Configuración; se mudó
          acá porque es lo mismo que el hero y las piezas: cómo se ve
          tu página. Configuración se queda con Contacto y Fidelidad. */}
      {designTab === 'tema' && theme && (
        <div className="bg-white rounded-2xl border-2 border-ink-100 p-5 space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Palette size={16} className="text-gold-600" />
              <div>
                <p className="text-xs font-black text-ink-900 uppercase tracking-wider">Tema visual</p>
                <p className="text-[11px] text-ink-500 mt-0.5">Colores, tipografía, logo y banner de tu tienda.</p>
              </div>
            </div>
            {savingTheme && <Loader2 size={14} className="animate-spin text-ink-400" />}
            {themeSaved && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <Check size={13} /> Guardado
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {THEME_COLOR_FIELDS.map((f) => (
              <div key={f.key} className="space-y-1">
                <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">
                  {f.label}
                  {f.key === 'color_primary' && <span className="text-gold-600 normal-case font-medium"> · manda</span>}
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={theme[f.key] as string}
                    onChange={(e) => setTheme({ ...theme, [f.key]: e.target.value })}
                    className="w-9 h-9 rounded-lg border border-ink-200 cursor-pointer shrink-0"
                  />
                  <input
                    value={theme[f.key] as string}
                    onChange={(e) => setTheme({ ...theme, [f.key]: e.target.value })}
                    className="w-full h-9 px-2 bg-cream-50 border border-ink-200 rounded-lg text-[11px] font-mono focus:outline-none focus:border-gold-500 min-w-0"
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-ink-400 bg-cream-50 border border-ink-100 rounded-xl p-3">
            Ahora mismo solo <strong className="text-ink-700">Primario</strong> controla el sitio de verdad
            (botones, precios, acentos dorados en home/tienda/checkout — mirá la vista previa). Los otros 4
            colores quedan guardados como referencia por ahora.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Tipografía</label>
              <input
                value={theme.font}
                onChange={(e) => setTheme({ ...theme, font: e.target.value })}
                className="w-full h-10 px-3 bg-cream-50 border border-ink-200 rounded-lg text-sm focus:outline-none focus:border-gold-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['logo_url', 'banner_url'] as const).map((field) => (
                <div key={field} className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">
                    {field === 'logo_url' ? 'Logo' : 'Banner'}
                  </label>
                  <div className="flex items-center gap-2">
                    {theme[field] ? (
                      <img src={theme[field]!} alt="" className="w-9 h-9 rounded-lg object-cover border border-ink-200 shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg border-2 border-dashed border-ink-200 flex items-center justify-center text-ink-300 shrink-0">
                        <ImageIcon size={13} />
                      </div>
                    )}
                    <label className="text-[11px] font-bold text-gold-700 hover:underline cursor-pointer">
                      {uploadingLogo ? 'Subiendo...' : 'Cambiar'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingLogo}
                        onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0], field)}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={saveTheme}
            disabled={savingTheme}
            className="flex items-center gap-2 bg-ink-900 text-cream-50 h-10 px-5 rounded-xl text-sm font-bold hover:bg-gold-600 transition-colors disabled:opacity-60"
          >
            {savingTheme ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Guardar tema
          </button>
        </div>
      )}

      {/* HERO PRINCIPAL — plantilla elegible, distinta de las "piezas"
          de abajo porque solo existe UNA (es la franja de arriba). */}
      {designTab === 'hero' && (
      <div className="bg-white rounded-2xl border-2 border-ink-100 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs font-black text-ink-900 uppercase tracking-wider">Hero principal</p>
            <p className="text-[11px] text-ink-500 mt-0.5">La franja grande de arriba del home. Elegí una plantilla.</p>
          </div>
          <div className="flex items-center gap-3">
            {savingHero && <Loader2 size={14} className="animate-spin text-ink-400" />}
            {heroSaved && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <Check size={13} /> Guardado
              </span>
            )}
            <button
              onClick={() => setShowHeroCatalog(true)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-ink-600 hover:text-ink-900 bg-cream-50 border border-ink-200 px-3 py-1.5 rounded-lg"
            >
              <Maximize2 size={12} /> Ver catálogo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {HERO_STYLES.map((style) => {
            const meta = HERO_META[style];
            const Icon = meta.icon;
            const active = heroStyle === style;
            return (
              <button
                key={style}
                onClick={() => pickHeroStyle(style)}
                className={`text-left rounded-xl p-3 border-2 transition-all ${
                  active ? 'border-ink-900 bg-cream-50' : 'border-ink-100 hover:border-ink-300'
                }`}
              >
                {/* Mini swatch representativo de cada plantilla */}
                <div
                  className={`w-full h-10 rounded-lg mb-2 flex items-center justify-center ${
                    style === 'classic' ? 'bg-ink-950'
                      : style === 'minimal' ? 'bg-cream-100 border border-ink-200'
                      : style === 'full_image' ? 'bg-ink-800'
                      : style === 'split' ? 'bg-cream-100 border border-ink-200'
                      : style === 'editorial' ? 'bg-cream-50 border border-ink-200'
                      : ''
                  }`}
                  style={style === 'gradient' ? { background: `linear-gradient(135deg, #b8904e, ${heroConfig.gradient_color || '#7c3aed'})` } : undefined}
                >
                  <Icon
                    size={14}
                    className={
                      style === 'minimal' || style === 'split' || style === 'editorial' ? 'text-ink-400'
                        : style === 'classic' || style === 'full_image' ? 'text-gold-400'
                        : 'text-white'
                    }
                  />
                </div>
                <p className={`text-[11px] font-bold flex items-center gap-1 ${active ? 'text-ink-900' : 'text-ink-600'}`}>
                  {active && <Check size={11} className="text-emerald-600 shrink-0" />}
                  {meta.label}
                </p>
                <p className="text-[10px] text-ink-400 mt-0.5 leading-snug">{meta.blurb}</p>
              </button>
            );
          })}
        </div>

        {/* Campos según la plantilla elegida */}
        <div className="grid sm:grid-cols-2 gap-3 pt-1">
          <div>
            <FieldLabel>Título (opcional — si lo dejás vacío usa el de siempre)</FieldLabel>
            <input
              defaultValue={heroConfig.title ?? ''}
              onBlur={(e) => { const next = { ...heroConfig, title: e.target.value }; setHeroConfig(next); saveHero(heroStyle, next); }}
              placeholder="Piezas que cuentan historias."
              className="w-full h-10 px-3 bg-cream-50 border border-ink-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <FieldLabel>Subtítulo (opcional)</FieldLabel>
            <input
              defaultValue={heroConfig.subtitle ?? ''}
              onBlur={(e) => { const next = { ...heroConfig, subtitle: e.target.value }; setHeroConfig(next); saveHero(heroStyle, next); }}
              placeholder="Una selección curada, calidad excepcional..."
              className="w-full h-10 px-3 bg-cream-50 border border-ink-200 rounded-lg text-sm"
            />
          </div>

          {(heroStyle === 'full_image' || heroStyle === 'split') && (
            <div className="sm:col-span-2">
              <FieldLabel>{heroStyle === 'split' ? 'Imagen (ocupa la mitad del hero)' : 'Imagen de fondo'}</FieldLabel>
              <ImagePicker
                imageUrl={heroConfig.image_url}
                uploading={uploadingHero}
                onPick={uploadHeroImage}
                aspect={heroStyle === 'split' ? 'aspect-[4/3]' : 'aspect-[21/9]'}
              />
            </div>
          )}

          {heroStyle === 'gradient' && (
            <div>
              <FieldLabel>Segundo color del degradado</FieldLabel>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={heroConfig.gradient_color || '#7c3aed'}
                  onChange={(e) => { const next = { ...heroConfig, gradient_color: e.target.value }; setHeroConfig(next); saveHero(heroStyle, next); }}
                  className="w-10 h-10 rounded-lg border border-ink-200 cursor-pointer"
                />
                <span className="text-[11px] text-ink-400">El primer color siempre es tu dorado de marca.</span>
              </div>
            </div>
          )}

          {heroStyle !== 'gradient' && (
            <div>
              <FieldLabel>Color de acento (opcional)</FieldLabel>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={isValidHex(heroConfig.accent_color) ? heroConfig.accent_color! : '#b8904e'}
                  onChange={(e) => { const next = { ...heroConfig, accent_color: e.target.value }; setHeroConfig(next); saveHero(heroStyle, next); }}
                  className="w-10 h-10 rounded-lg border border-ink-200 cursor-pointer"
                />
                {isValidHex(heroConfig.accent_color) ? (
                  <button
                    onClick={() => { const next = { ...heroConfig, accent_color: undefined }; setHeroConfig(next); saveHero(heroStyle, next); }}
                    className="text-[11px] font-bold text-ink-500 hover:text-ink-900 underline"
                  >
                    Quitar y usar el dorado de siempre
                  </button>
                ) : (
                  <span className="text-[11px] text-ink-400">Pisa el dorado solo en el botón y la palabra destacada de este hero.</span>
                )}
              </div>
            </div>
          )}

          <div className="sm:col-span-2">
            <FieldLabel>Contador regresivo (opcional)</FieldLabel>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="datetime-local"
                value={toDatetimeLocal(heroConfig.countdown_end)}
                onChange={(e) => {
                  const iso = e.target.value ? new Date(e.target.value).toISOString() : null;
                  const next = { ...heroConfig, countdown_end: iso };
                  setHeroConfig(next);
                  saveHero(heroStyle, next);
                }}
                className="h-10 px-3 bg-white border border-ink-200 rounded-lg text-sm"
              />
              {heroConfig.countdown_end && (
                <button
                  onClick={() => {
                    const next = { ...heroConfig, countdown_end: null };
                    setHeroConfig(next);
                    saveHero(heroStyle, next);
                  }}
                  className="text-[11px] font-bold text-ink-500 hover:text-ink-900 underline"
                >
                  Quitar contador
                </button>
              )}
            </div>
            <p className="text-[11px] text-ink-400 mt-1">Muestra "Termina en..." junto a los botones del hero, como el resto de las piezas con contador.</p>
          </div>
        </div>
      </div>
      )}

      {/* CATEGORÍAS — mostrar/ocultar la sección del home, y una foto
          por categoría (el home real ya sabe pintarlas, solo faltaba
          desde dónde subirlas). */}
      {designTab === 'categorias' && theme && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border-2 border-ink-100 p-5 space-y-4">
            <div>
              <p className="text-xs font-black text-ink-900 uppercase tracking-wider">Secciones estándar del home</p>
              <p className="text-[11px] text-ink-500 mt-0.5">Prendé o apagá estas secciones fijas (van después del hero y las piezas que armás abajo).</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-2.5">
              {(
                [
                  { key: 'show_categories', label: 'Categorías' },
                  { key: 'show_featured', label: 'Destacados' },
                  { key: 'show_on_sale', label: 'Ofertas' },
                ] as const
              ).map((s) => (
                <button
                  key={s.key}
                  onClick={() => toggleSection(s.key)}
                  className={`flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl border-2 text-left transition-colors ${
                    theme[s.key] ? 'border-emerald-300 bg-emerald-50' : 'border-ink-100 bg-cream-50'
                  }`}
                >
                  <span className="text-sm font-bold text-ink-900">{s.label}</span>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${theme[s.key] ? 'text-emerald-600' : 'text-ink-400'}`}>
                    {theme[s.key] ? 'Visible' : 'Oculto'}
                  </span>
                </button>
              ))}
            </div>
            {savingTheme && <p className="text-[11px] text-ink-400 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Guardando...</p>}
            {themeSaved && <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1"><Check size={12} /> Guardado</p>}
          </div>

          {/* Personalización de Destacados/Ofertas: fondo de la caja y
              cuántos productos traer — desde "solo 1, para una mega
              promo" hasta 24. */}
          <SectionCustomizer
            title="Destacados"
            sectionKey="featured"
            config={theme.home_config?.featured}
            onChangeConfig={(next) => saveHomeConfig({ ...theme.home_config, featured: next })}
            onUploadImage={(file) => uploadSectionBgImage('featured', file)}
            uploading={uploadingSectionBg === 'featured'}
          />
          <SectionCustomizer
            title="Ofertas"
            sectionKey="on_sale"
            config={theme.home_config?.on_sale}
            onChangeConfig={(next) => saveHomeConfig({ ...theme.home_config, on_sale: next })}
            onUploadImage={(file) => uploadSectionBgImage('on_sale', file)}
            uploading={uploadingSectionBg === 'on_sale'}
          />

          {/* Estilo de tarjeta: aplica a TODOS los carruseles de
              producto del home (Destacados, Ofertas, categoría
              destacada) — es una decisión de diseño, no por sección. */}
          <div className="bg-white rounded-2xl border-2 border-ink-100 p-5 space-y-3">
            <div>
              <p className="text-xs font-black text-ink-900 uppercase tracking-wider">Tarjetas de producto</p>
              <p className="text-[11px] text-ink-500 mt-0.5">Cómo se ve cada producto en los carruseles del home (Destacados, Ofertas, categoría destacada).</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {(
                [
                  { id: 'classic', label: 'Clásica', blurb: 'Imagen, nombre y precio. Simple, va al producto.' },
                  { id: 'commerce', label: 'Comercio', blurb: 'Suma insignias (oferta, promo, envío rápido, agotado) y un botón para agregar al carrito sin salir del home.' },
                  { id: 'rating', label: 'Reseñas', blurb: 'Marca, estrellas y cantidad de reseñas, más el % de descuento en grande — estilo marketplace.' },
                  { id: 'compact', label: 'Compacta', blurb: 'Versión chica sin insignias, para que quepan más productos a la vez en la fila.' },
                ] as const
              ).map((opt) => {
                const active = (theme.home_config?.card_style ?? 'classic') === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => saveHomeConfig({ ...theme.home_config, card_style: opt.id })}
                    className={`text-left p-3.5 rounded-xl border-2 transition-colors ${
                      active ? 'border-ink-900 bg-ink-950 text-cream-50' : 'border-ink-100 hover:border-ink-300'
                    }`}
                  >
                    <p className="text-sm font-bold">{opt.label}</p>
                    <p className={`text-[11px] mt-1 leading-snug ${active ? 'text-cream-200' : 'text-ink-500'}`}>{opt.blurb}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Diseño de la sección Categorías: antes solo existía la
              grilla cuadrada fija — ahora se puede elegir entre 4
              formatos según cuántas categorías tenga la tienda. */}
          <div className="bg-white rounded-2xl border-2 border-ink-100 p-5 space-y-3">
            <div>
              <p className="text-xs font-black text-ink-900 uppercase tracking-wider">Diseño de Categorías</p>
              <p className="text-[11px] text-ink-500 mt-0.5">Cómo se ve la sección "Categorías" del home.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {(
                [
                  { id: 'grid', label: 'Grilla', blurb: 'Tarjetas cuadradas grandes, como un muro. Ideal con pocas categorías.' },
                  { id: 'carousel', label: 'Carrusel', blurb: 'Círculos en fila horizontal con scroll, estilo historias.' },
                  { id: 'pills', label: 'Pills', blurb: 'Chips compactas en varias filas — para muchas categorías a la vez.' },
                  { id: 'list', label: 'Lista', blurb: 'Filas verticales tipo menú, con miniatura y flecha.' },
                ] as const
              ).map((opt) => {
                const active = (theme.home_config?.categories_layout ?? 'grid') === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => saveHomeConfig({ ...theme.home_config, categories_layout: opt.id })}
                    className={`text-left p-3.5 rounded-xl border-2 transition-colors ${
                      active ? 'border-ink-900 bg-ink-950 text-cream-50' : 'border-ink-100 hover:border-ink-300'
                    }`}
                  >
                    <p className="text-sm font-bold">{opt.label}</p>
                    <p className={`text-[11px] mt-1 leading-snug ${active ? 'text-cream-200' : 'text-ink-500'}`}>{opt.blurb}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-ink-100 p-5 space-y-4">
            <div>
              <p className="text-xs font-black text-ink-900 uppercase tracking-wider">Foto por categoría</p>
              <p className="text-[11px] text-ink-500 mt-0.5">Como un muro: cada categoría con su propia imagen en la sección "Categorías" del home.</p>
            </div>
            {categories.length === 0 ? (
              <p className="text-sm text-ink-400 py-6 text-center">Todavía no hay categorías cargadas.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <div key={cat.id} className="space-y-1.5">
                    <label className="relative block aspect-square rounded-xl overflow-hidden bg-cream-100 border border-ink-200 cursor-pointer group">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ink-300 font-serif text-2xl">
                          {cat.name.charAt(0)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-ink-950/0 group-hover:bg-ink-950/50 transition-colors flex items-center justify-center">
                        {uploadingCategoryId === cat.id ? (
                          <Loader2 size={18} className="animate-spin text-white" />
                        ) : (
                          <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-white uppercase tracking-wider transition-opacity">Cambiar</span>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingCategoryId === cat.id}
                        onChange={(e) => e.target.files?.[0] && uploadCategoryImage(cat.id, e.target.files[0])}
                      />
                    </label>
                    <p className="text-[11px] font-bold text-ink-700 text-center truncate">{cat.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PALETA DE PIEZAS */}
      {designTab === 'piezas' && (
      <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {BLOCK_TYPES.map((type) => {
          const meta = BLOCK_META[type];
          const Icon = meta.icon;
          return (
            <button
              key={type}
              disabled={creating}
              onClick={() => addBlock(type)}
              className="group relative text-left bg-white border-2 border-ink-100 rounded-2xl p-4 hover:border-ink-900 hover:shadow-lg transition-all disabled:opacity-50 overflow-hidden"
            >
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${meta.accent}`} />
              <div className={`w-9 h-9 rounded-xl ${meta.accentBg} ${meta.accentText} flex items-center justify-center mb-3`}>
                <Icon size={17} />
              </div>
              <p className="text-sm font-bold text-ink-900">{meta.label}</p>
              <p className="text-[11px] text-ink-500 mt-1 leading-snug">{meta.blurb}</p>
              <div className="flex items-center gap-1 mt-3 text-[10px] font-black text-ink-400 uppercase tracking-wider group-hover:text-ink-900 transition-colors">
                <Plus size={11} /> Agregar
              </div>
            </button>
          );
        })}
      </div>

      {blocks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-ink-200 rounded-2xl bg-white">
          <Layout size={40} className="text-ink-300 mb-4" />
          <p className="text-ink-500 font-medium">Todavía no armaste ninguna sección. Elegí una pieza arriba para empezar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, i) => {
            const meta = BLOCK_META[block.type] ?? BLOCK_META.banner;
            const Icon = meta.icon;
            return (
              <div
                key={block.id}
                draggable
                onDragStart={() => {
                  dragIndex.current = i;
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverIndex(i);
                }}
                onDragLeave={() => setDragOverIndex((cur) => (cur === i ? null : cur))}
                onDrop={() => handleDrop(i)}
                onDragEnd={() => {
                  dragIndex.current = null;
                  setDragOverIndex(null);
                }}
                className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${
                  dragOverIndex === i ? 'border-gold-400 shadow-lg scale-[1.01]' : 'border-ink-100'
                }`}
              >
                <div className={`h-1.5 ${meta.accent}`} />
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="hidden sm:flex text-ink-300 cursor-grab active:cursor-grabbing shrink-0" title="Arrastrá para reordenar">
                        <GripVertical size={16} />
                      </div>
                      <div className="flex flex-col gap-0.5 sm:hidden shrink-0">
                        <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 text-ink-400 hover:text-ink-900 disabled:opacity-30">
                          <ArrowUp size={14} />
                        </button>
                        <button onClick={() => move(i, 1)} disabled={i === blocks.length - 1} className="p-1 text-ink-400 hover:text-ink-900 disabled:opacity-30">
                          <ArrowDown size={14} />
                        </button>
                      </div>
                      <div className={`w-8 h-8 rounded-lg ${meta.accentBg} ${meta.accentText} flex items-center justify-center shrink-0`}>
                        <Icon size={14} />
                      </div>
                      <span className="text-xs font-black text-ink-700 uppercase tracking-wider truncate">{meta.label}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="hidden sm:flex flex-col gap-0.5 mr-1">
                        <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 text-ink-400 hover:text-ink-900 disabled:opacity-30">
                          <ArrowUp size={13} />
                        </button>
                        <button onClick={() => move(i, 1)} disabled={i === blocks.length - 1} className="p-1 text-ink-400 hover:text-ink-900 disabled:opacity-30">
                          <ArrowDown size={13} />
                        </button>
                      </div>
                      <button
                        onClick={() => updateBlock(block.id, { is_active: !block.is_active })}
                        className={`flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1.5 rounded-full transition-colors ${
                          block.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-ink-100 text-ink-500'
                        }`}
                      >
                        {block.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                        <span className="hidden sm:inline">{block.is_active ? 'VISIBLE' : 'OCULTO'}</span>
                      </button>
                      <button onClick={() => deleteBlock(block.id)} className="p-2 text-ink-400 hover:text-red-500">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {block.type === 'banner' && (
                    <BannerEditor
                      block={block} updateConfig={updateConfig} updateBlock={updateBlock} uploadImage={uploadImage} uploadingKey={uploadingKey}
                      uploadBgImage={uploadBlockBgImage}
                    />
                  )}
                  {block.type === 'category_spotlight' && (
                    <SpotlightEditor
                      block={block} categories={categories} updateConfig={updateConfig} updateBlock={updateBlock}
                      uploadBgImage={uploadBlockBgImage} uploadingKey={uploadingKey}
                      uploadBannerImage={uploadSpotlightBanner}
                    />
                  )}
                  {block.type === 'promo' && (
                    <PromoEditor
                      block={block} updateConfig={updateConfig} updateBlock={updateBlock} uploadImage={uploadImage} uploadingKey={uploadingKey}
                      uploadBgImage={uploadBlockBgImage}
                    />
                  )}
                  {block.type === 'stats' && <StatsEditor block={block} updateConfig={updateConfig} updateBlock={updateBlock} />}
                  {block.type === 'gallery' && (
                    <GalleryEditor
                      block={block} updateConfig={updateConfig} updateBlock={updateBlock} uploadImage={uploadImage} uploadingKey={uploadingKey}
                      uploadBgImage={uploadBlockBgImage}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}
        </div>

        {/* VISTA PREVIA — fija (sticky) en desktop, con su propio marco y
            scroll interno, para que se sienta como "ver el home de
            verdad" sin salir del panel de admin. */}
        <div className="lg:sticky lg:top-6 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-ink-400 uppercase tracking-widest">Vista previa</p>
            <div className="flex items-center bg-white border border-ink-200 rounded-full p-0.5">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-1.5 rounded-full transition-colors ${previewMode === 'desktop' ? 'bg-ink-900 text-cream-50' : 'text-ink-400 hover:text-ink-700'}`}
                title="Vista escritorio"
              >
                <Monitor size={13} />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-1.5 rounded-full transition-colors ${previewMode === 'mobile' ? 'bg-ink-900 text-cream-50' : 'text-ink-400 hover:text-ink-700'}`}
                title="Vista móvil"
              >
                <Smartphone size={13} />
              </button>
            </div>
          </div>

          {(() => {
            const previewContent = (
              <>
                <PreviewHero style={heroStyle} config={heroConfig} />
                {blocks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                    <Layout size={24} className="text-ink-300 mb-2.5" />
                    <p className="text-xs text-ink-400 font-medium">
                      Agregá una pieza abajo y acá vas a ver cómo se ve en el home.
                    </p>
                  </div>
                ) : (
                  <div className="py-3">
                    {blocks.map((block) => (
                      <PreviewBlock
                        key={block.id}
                        block={block}
                        products={block.config?.category_id ? previewProducts[block.config.category_id] ?? [] : []}
                        cardStyle={theme?.home_config?.card_style ?? 'classic'}
                      />
                    ))}
                  </div>
                )}
              </>
            );

            if (previewMode === 'mobile') {
              // Marco de iPhone real (imagen con la pantalla transparente)
              // superpuesto sobre el contenido, con su propia barra de
              // estado (hora, señal, 5G, batería) fija arriba — así no
              // queda ese espacio en blanco bajo el notch y se siente
              // un teléfono de verdad, no un rectángulo angosto.
              return (
                <div className="relative mx-auto" style={{ width: 280, height: 560 }}>
                  <div
                    className="absolute overflow-hidden bg-cream-100 rounded-[1.6rem] flex flex-col"
                    style={{ left: '7.6%', right: '8.7%', top: '2.9%', bottom: '2.4%' }}
                  >
                    <PhoneStatusBar />
                    <div className="flex-1 overflow-y-auto custom-scrollbar">{previewContent}</div>
                  </div>
                  <img
                    src="/iphone-frame.png"
                    alt=""
                    className="absolute inset-0 w-full h-full pointer-events-none select-none"
                    draggable={false}
                  />
                </div>
              );
            }

            return (
              <div className="bg-ink-950 rounded-[1.75rem] p-2.5 shadow-xl">
                <div className="bg-cream-100 rounded-[1.35rem] overflow-y-auto custom-scrollbar w-full h-[560px]">
                  {previewContent}
                </div>
              </div>
            );
          })()}
          <p className="text-[11px] text-ink-400 text-center px-2">
            Las piezas marcadas <span className="font-bold text-ink-500">OCULTO</span> igual se ven acá (atenuadas), para que puedas armarlas antes de publicarlas.
          </p>
        </div>
      </div>

      {showHeroCatalog && (
        <HeroCatalogModal
          heroStyle={heroStyle}
          heroConfig={heroConfig}
          onPick={(style) => { pickHeroStyle(style); setShowHeroCatalog(false); }}
          onClose={() => setShowHeroCatalog(false)}
        />
      )}
    </div>
  );
}

/**
 * Modal de catálogo: las 6 plantillas de hero en grande, una al lado
 * de otra, para poder comparar antes de elegir — lo que pidió el
 * usuario en vez de solo las miniaturas chiquitas de la grilla.
 */
function HeroCatalogModal({
  heroStyle,
  heroConfig,
  onPick,
  onClose,
}: {
  heroStyle: HeroStyle;
  heroConfig: HeroConfig;
  onPick: (style: HeroStyle) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-y-auto custom-scrollbar p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-lg font-black text-ink-950">Catálogo de heros</p>
            <p className="text-xs text-ink-500 mt-0.5">Elegí la plantilla que más te guste. Usa el título, subtítulo y colores que ya tenés cargados.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-cream-100 text-ink-400 hover:text-ink-900 shrink-0">
            <X size={18} />
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {HERO_STYLES.map((style) => {
            const meta = HERO_META[style];
            const active = heroStyle === style;
            return (
              <div key={style} className={`rounded-2xl border-2 overflow-hidden ${active ? 'border-ink-900' : 'border-ink-100'}`}>
                <div className="h-40 overflow-hidden">
                  <PreviewHero style={style} config={heroConfig} />
                </div>
                <div className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
                      {active && <Check size={13} className="text-emerald-600" />}
                      {meta.label}
                    </p>
                    <p className="text-[11px] text-ink-400 mt-0.5">{meta.blurb}</p>
                  </div>
                  <button
                    onClick={() => onPick(style)}
                    disabled={active}
                    className="shrink-0 text-[11px] font-bold px-3 py-2 rounded-xl bg-ink-900 text-cream-50 hover:bg-ink-800 disabled:opacity-40 disabled:hover:bg-ink-900"
                  >
                    {active ? 'En uso' : 'Usar esta'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Barra de estado tipo iOS (hora, señal, 5G, batería) para la vista
 * previa móvil — dibujada a mano con SVG, sin depender de un ícono de
 * batería/señal específico de lucide que no calza con el look real.
 */
function PhoneStatusBar() {
  return (
    <div className="shrink-0 flex items-center justify-between px-5 pt-1.5 pb-1 bg-white">
      <span className="text-[12px] font-semibold text-ink-950 tabular-nums">9:41</span>
      <div className="flex items-center gap-1.5">
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <rect x="0" y="6.5" width="2.6" height="4.5" rx="0.6" fill="#0a0a0a" />
          <rect x="4.5" y="4.5" width="2.6" height="6.5" rx="0.6" fill="#0a0a0a" />
          <rect x="9" y="2.5" width="2.6" height="8.5" rx="0.6" fill="#0a0a0a" />
          <rect x="13.4" y="0" width="2.6" height="11" rx="0.6" fill="#0a0a0a" />
        </svg>
        <span className="text-[10px] font-bold text-ink-950">5G</span>
        <svg width="22" height="11" viewBox="0 0 22 11" fill="none">
          <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke="#0a0a0a" />
          <rect x="2" y="2" width="15" height="7" rx="1.3" fill="#0a0a0a" />
          <rect x="19.5" y="3.5" width="1.5" height="4" rx="0.75" fill="#0a0a0a" />
        </svg>
      </div>
    </div>
  );
}

/**
 * Mini versión de las 4 plantillas de Hero (ver la función Hero() real
 * en app/page.tsx — misma idea, simplificada para caber en el marco
 * de la vista previa).
 */
function PreviewCountdownBadge({ active }: { active?: boolean }) {
  if (!active) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[8px] font-black text-cream-50 bg-ink-950/90 px-2 py-1 rounded-full ml-2 align-middle">
      ⏱ 00:00:00
    </span>
  );
}

function PreviewHero({ style, config }: { style: HeroStyle; config: HeroConfig }) {
  const title = config.title || 'Piezas que cuentan historias.';
  const subtitle = config.subtitle || 'Una selección curada para tu espacio.';
  const accent = isValidHex(config.accent_color) ? config.accent_color : null;
  const accentBg = accent ? { backgroundColor: accent } : undefined;
  const accentText = accent ? { color: accent } : undefined;
  const hasCountdown = Boolean(config.countdown_end);

  if (style === 'minimal') {
    return (
      <div className="px-4 py-8 text-center bg-cream-50">
        <p className="font-serif text-base text-ink-950 leading-tight mb-1.5">{title}</p>
        <p className="text-[10px] text-ink-500 mb-3 leading-snug">{subtitle}</p>
        <span className="inline-block text-[9px] font-bold text-ink-950 bg-gold-500 px-3 py-1.5 rounded-full" style={accentBg}>Explorar catálogo</span>
        <PreviewCountdownBadge active={hasCountdown} />
      </div>
    );
  }

  if (style === 'full_image') {
    return (
      <div className="relative px-4 py-9 text-center bg-ink-900 overflow-hidden">
        {config.image_url && <img src={config.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
        <div className="relative">
          <p className="font-serif text-base text-cream-50 leading-tight mb-1.5">{title}</p>
          <p className="text-[10px] text-ink-200 mb-3 leading-snug">{subtitle}</p>
          <span className="inline-block text-[9px] font-bold text-ink-950 bg-gold-500 px-3 py-1.5 rounded-full" style={accentBg}>Explorar catálogo</span>
          <PreviewCountdownBadge active={hasCountdown} />
        </div>
      </div>
    );
  }

  if (style === 'gradient') {
    return (
      <div
        className="px-4 py-9 text-center"
        style={{ background: `linear-gradient(135deg, #b8904e, ${config.gradient_color || '#7c3aed'})` }}
      >
        <p className="font-serif text-base text-white leading-tight mb-1.5">{title}</p>
        <p className="text-[10px] text-white/90 mb-3 leading-snug">{subtitle}</p>
        <span className="inline-block text-[9px] font-bold text-ink-950 bg-white px-3 py-1.5 rounded-full">Explorar catálogo</span>
        <PreviewCountdownBadge active={hasCountdown} />
      </div>
    );
  }

  if (style === 'split') {
    return (
      <div className="grid grid-cols-2 bg-cream-50">
        <div className="px-3 py-6 flex flex-col justify-center">
          <p className="font-serif text-sm text-ink-950 leading-tight mb-1.5">{title}</p>
          <p className="text-[9px] text-ink-500 mb-2.5 leading-snug">{subtitle}</p>
          <span className="inline-block w-fit text-[8px] font-bold text-ink-950 bg-gold-500 px-2.5 py-1 rounded-full" style={accentBg}>Explorar catálogo</span>
          {hasCountdown && (
            <span className="inline-flex w-fit items-center gap-1 text-[8px] font-black text-cream-50 bg-ink-950/90 px-2 py-1 rounded-full mt-1.5">
              ⏱ 00:00:00
            </span>
          )}
        </div>
        <div className="relative bg-cream-200 min-h-[120px]">
          {config.image_url && <img src={config.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        </div>
      </div>
    );
  }

  if (style === 'editorial') {
    return (
      <div className="px-4 py-10 text-center bg-cream-50">
        <div className="w-6 h-px mx-auto mb-3" style={{ backgroundColor: accent ?? '#b8904e' }} />
        <p className="font-serif text-lg text-ink-950 leading-tight mb-2">{title}</p>
        <p className="text-[10px] text-ink-500 mb-3 leading-snug">{subtitle}</p>
        <span className="inline-block text-[9px] font-bold uppercase tracking-widest text-ink-950 border-b-2 border-ink-950 pb-0.5">Explorar catálogo</span>
        <PreviewCountdownBadge active={hasCountdown} />
      </div>
    );
  }

  // classic
  return (
    <div className="px-4 py-9 bg-ink-950 relative overflow-hidden">
      <div className="absolute -top-8 -left-4 w-20 h-20 rounded-full bg-gold-500/20 blur-2xl" />
      <p className="relative font-serif text-base text-cream-50 leading-tight mb-1.5 max-w-[75%]">{title}</p>
      <p className="relative text-[10px] text-ink-300 mb-3 leading-snug max-w-[75%]">{subtitle}</p>
      <span className="relative inline-block text-[9px] font-bold text-ink-950 bg-gold-500 px-3 py-1.5 rounded-full" style={accentBg}>Explorar catálogo</span>
      <PreviewCountdownBadge active={hasCountdown} />
    </div>
  );
}

const PREVIEW_TILE_COLS: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' };
const PREVIEW_STAT_COLS: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' };

/**
 * Versión simplificada (sin next/image, sin datos de servidor) del
 * mismo render que hace app/page.tsx para cada tipo de bloque — para
 * que la vista previa del dashboard se vea igual que el home real.
 */
// Placeholder claro cuando una pieza ya existe pero todavía no tiene
// contenido — antes esto simplemente no dibujaba nada, y por eso se
// sentía como que "agregar una pieza no hacía nada": la pieza SÍ se
// crea (se ve en la lista de la izquierda), solo que hasta no cargarle
// una imagen/fondo/tarjeta, acá a la derecha no había ninguna señal.
function EmptyPiecePreview({ hint }: { hint: string }) {
  return (
    <div className="px-3 py-2.5">
      <div className="rounded-xl border-2 border-dashed border-ink-200 py-5 px-3 text-center">
        <p className="text-[10px] text-ink-400 font-medium leading-snug">{hint}</p>
      </div>
    </div>
  );
}

function PreviewBlock({ block, products, cardStyle }: { block: Block; products: any[]; cardStyle: CardStyle }) {
  const cfg = block.config ?? {};
  const bg: BlockBackground | undefined = cfg.background;
  const bgLayer = hasBackground(bg) ? <div className="absolute inset-0" style={resolveBackgroundLayerStyle(bg)} /> : null;
  const wrapClass = `px-3 py-2.5 ${block.is_active ? '' : 'opacity-40'}`;

  if (block.type === 'banner') {
    if (!cfg.image_url && !cfg.title && !hasBackground(bg)) {
      return <EmptyPiecePreview hint="Subí una imagen o elegí un fondo a la izquierda para ver el banner acá." />;
    }
    return (
      <div className={wrapClass}>
        <div className="relative aspect-[21/9] rounded-xl overflow-hidden bg-cream-200">
          {bgLayer}
          {cfg.image_url && <img src={cfg.image_url} alt="" className="relative w-full h-full object-cover" />}
          {(cfg.title || cfg.subtitle) && (
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-ink-950/10 to-transparent flex flex-col justify-end p-3">
              {cfg.title && <p className="font-serif text-sm text-cream-50 leading-tight">{cfg.title}</p>}
              {cfg.subtitle && <p className="text-cream-100 text-[10px] mt-0.5">{cfg.subtitle}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (block.type === 'category_spotlight') {
    const banner = cfg.side_banner;
    return (
      <div className={`${wrapClass} bg-cream-100 relative overflow-hidden`}>
        {bgLayer}
        <div className="relative space-y-2">
          {banner?.image_url && banner.position === 'top' && (
            <img src={banner.image_url} alt="" className="w-full aspect-[21/9] object-cover rounded-lg" />
          )}
          <div className="flex items-center justify-between gap-2">
            <div>
              {cfg.title && (
                <p className="font-serif text-sm" style={isValidHex(cfg.title_color) ? { color: cfg.title_color } : { color: '#211d16' }}>
                  {cfg.title}
                </p>
              )}
              {cfg.subtitle && (
                <p className="text-[10px]" style={isValidHex(cfg.subtitle_color) ? { color: cfg.subtitle_color } : { color: '#8a8272' }}>
                  {cfg.subtitle}
                </p>
              )}
            </div>
            {block.ends_at && <CountdownTimer endsAt={block.ends_at} compact />}
          </div>
          {cfg.extra_text && <p className="text-[10px] text-ink-600">{cfg.extra_text}</p>}
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-1.5">
              {products.slice(0, 4).map((p) => (
                <div key={p.id} className="rounded-lg overflow-hidden bg-cream-200 aspect-square">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[9px] text-ink-300 font-serif">{p.name?.charAt(0)}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-ink-400 italic">
              {cfg.category_id ? 'Sin productos activos en esta categoría.' : 'Elegí una categoría a la izquierda.'}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (block.type === 'promo') {
    const tiles: any[] = cfg.tiles ?? [];
    if (tiles.length === 0) {
      return <EmptyPiecePreview hint="Añadí al menos una tarjeta a la izquierda para ver el mosaico acá." />;
    }
    return (
      <div className={`${wrapClass} relative overflow-hidden`}>
        {bgLayer}
        <div className="relative">
          {(cfg.title || cfg.subtitle) && (
            <div className="mb-2">
              {cfg.title && <p className="font-serif text-sm text-ink-900">{cfg.title}</p>}
              {cfg.subtitle && <p className="text-[10px] text-ink-500">{cfg.subtitle}</p>}
            </div>
          )}
          <div className={`grid gap-1.5 ${PREVIEW_TILE_COLS[Math.min(tiles.length, 3)]}`}>
            {tiles.map((tile, i) => (
              <div key={i} className="relative aspect-[4/3] rounded-lg overflow-hidden bg-cream-200">
                {tile.image_url && <img src={tile.image_url} alt="" className="w-full h-full object-cover" />}
                {tile.title && (
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent flex items-end p-1.5">
                    <p className="text-[10px] text-cream-50 font-serif leading-tight">{tile.title}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (block.type === 'gallery') {
    const tiles: GalleryTile[] = cfg.tiles ?? [];
    if (tiles.length === 0) {
      return <EmptyPiecePreview hint="Añadí al menos una tarjeta a la izquierda para ver la galería acá." />;
    }
    const previewSpan: Record<GallerySize, string> = {
      sm: 'col-span-1 row-span-1',
      wide: 'col-span-2 row-span-1',
      tall: 'col-span-1 row-span-2',
      lg: 'col-span-2 row-span-2',
    };
    return (
      <div className={`${wrapClass} relative overflow-hidden`}>
        {bgLayer}
        <div className="relative">
          {(cfg.title || cfg.subtitle) && (
            <div className="mb-2">
              {cfg.title && <p className="font-serif text-sm text-ink-900">{cfg.title}</p>}
              {cfg.subtitle && <p className="text-[10px] text-ink-500">{cfg.subtitle}</p>}
            </div>
          )}
          <div className="grid grid-cols-4 gap-1.5 auto-rows-[36px]" style={{ gridAutoFlow: 'dense' }}>
            {tiles.map((tile, i) => (
              <div key={i} className={`relative rounded-lg overflow-hidden bg-cream-200 ${previewSpan[tile.size ?? 'sm']}`}>
                {tile.image_url && <img src={tile.image_url} alt="" className="w-full h-full object-cover" />}
                {tile.title && (
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent flex items-end p-1">
                    <p className="text-[8px] text-cream-50 font-serif leading-tight truncate">{tile.title}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (block.type === 'stats') {
    const items: any[] = cfg.items ?? [];
    if (items.length === 0) {
      return <EmptyPiecePreview hint="Añadí al menos un número a la izquierda para ver la franja acá." />;
    }
    return (
      <div className={`${wrapClass} bg-ink-950 my-1`}>
        <div className={`grid gap-2 py-2 ${PREVIEW_STAT_COLS[Math.min(items.length, 4)]}`}>
          {items.map((item, i) => (
            <div key={i} className="text-center">
              <p className="font-serif text-sm text-gold-400">{item.value || '—'}</p>
              <p className="text-cream-200 text-[9px] mt-0.5 leading-tight">{item.label || 'Etiqueta'}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1 block mb-1">{children}</label>;
}

function BannerEditor({ block, updateConfig, updateBlock, uploadImage, uploadingKey, uploadBgImage }: any) {
  return (
    <div className="space-y-4">
      <BlockSchedule block={block} updateBlock={updateBlock} />
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <FieldLabel>Título (opcional)</FieldLabel>
            <input
              defaultValue={block.config.title ?? ''}
              onBlur={(e) => updateConfig(block, 'title', e.target.value)}
              className="w-full h-10 px-3 bg-cream-50 border border-ink-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <FieldLabel>Subtítulo (opcional)</FieldLabel>
            <input
              defaultValue={block.config.subtitle ?? ''}
              onBlur={(e) => updateConfig(block, 'subtitle', e.target.value)}
              className="w-full h-10 px-3 bg-cream-50 border border-ink-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <FieldLabel>Link al hacer clic (opcional)</FieldLabel>
            <input
              placeholder="/shop?category=..."
              defaultValue={block.config.href ?? ''}
              onBlur={(e) => updateConfig(block, 'href', e.target.value)}
              className="w-full h-10 px-3 bg-cream-50 border border-ink-200 rounded-lg text-sm"
            />
          </div>
        </div>
        <ImagePicker
          imageUrl={block.config.image_url}
          uploading={uploadingKey === block.id}
          onPick={(file) => uploadImage(block, file)}
          aspect="aspect-[21/9]"
        />
      </div>
      <div className="pt-3 border-t border-ink-100">
        <BackgroundEditor
          value={block.config.background}
          onChange={(next) => updateConfig(block, 'background', next)}
          onUploadImage={(file) => uploadBgImage(block, file)}
          uploading={uploadingKey === `${block.id}-bg`}
          label="Fondo (detrás de la imagen, o en vez de ella)"
        />
      </div>
    </div>
  );
}

function SpotlightEditor({ block, categories, updateConfig, updateBlock, uploadBgImage, uploadBannerImage, uploadingKey }: any) {
  const banner = block.config.side_banner ?? {};
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <FieldLabel>Categoría</FieldLabel>
          <select
            value={block.config.category_id ?? ''}
            onChange={(e) => updateConfig(block, 'category_id', e.target.value)}
            className="w-full h-10 px-3 bg-cream-50 border border-ink-200 rounded-lg text-sm"
          >
            <option value="">Elegir categoría...</option>
            {categories.map((c: Category) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {categories.length === 0 && <p className="text-[11px] text-amber-600 mt-1">No tenés categorías todavía.</p>}
        </div>
        <div>
          <FieldLabel>Título de la sección</FieldLabel>
          <input
            defaultValue={block.config.title ?? ''}
            onBlur={(e) => updateConfig(block, 'title', e.target.value)}
            className="w-full h-10 px-3 bg-cream-50 border border-ink-200 rounded-lg text-sm"
          />
        </div>
        <div>
          <FieldLabel>Subtítulo (opcional)</FieldLabel>
          <input
            defaultValue={block.config.subtitle ?? ''}
            onBlur={(e) => updateConfig(block, 'subtitle', e.target.value)}
            className="w-full h-10 px-3 bg-cream-50 border border-ink-200 rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <FieldLabel>Color del título (opcional)</FieldLabel>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={isValidHex(block.config.title_color) ? block.config.title_color : '#211d16'}
              onChange={(e) => updateConfig(block, 'title_color', e.target.value)}
              className="w-10 h-10 rounded-lg border border-ink-200 cursor-pointer shrink-0"
            />
            {block.config.title_color && (
              <button onClick={() => updateConfig(block, 'title_color', null)} className="text-[11px] font-bold text-ink-500 hover:text-ink-900 underline">
                Quitar
              </button>
            )}
          </div>
        </div>
        <div>
          <FieldLabel>Color del subtítulo (opcional)</FieldLabel>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={isValidHex(block.config.subtitle_color) ? block.config.subtitle_color : '#5a5347'}
              onChange={(e) => updateConfig(block, 'subtitle_color', e.target.value)}
              className="w-10 h-10 rounded-lg border border-ink-200 cursor-pointer shrink-0"
            />
            {block.config.subtitle_color && (
              <button onClick={() => updateConfig(block, 'subtitle_color', null)} className="text-[11px] font-bold text-ink-500 hover:text-ink-900 underline">
                Quitar
              </button>
            )}
          </div>
        </div>
        <div>
          <FieldLabel>Texto extra (opcional)</FieldLabel>
          <input
            defaultValue={block.config.extra_text ?? ''}
            onBlur={(e) => updateConfig(block, 'extra_text', e.target.value)}
            placeholder="Un párrafo corto, si hace falta más contexto"
            className="w-full h-10 px-3 bg-cream-50 border border-ink-200 rounded-lg text-sm"
          />
        </div>
      </div>

      <BlockSchedule block={block} updateBlock={updateBlock} />

      <div className="pt-3 border-t border-ink-100">
        <BackgroundEditor
          value={block.config.background}
          onChange={(next) => updateConfig(block, 'background', next)}
          onUploadImage={(file) => uploadBgImage(block, file)}
          uploading={uploadingKey === `${block.id}-bg`}
        />
      </div>

      <div className="pt-3 border-t border-ink-100 space-y-2.5">
        <FieldLabel>Banner al lado (opcional)</FieldLabel>
        <p className="text-[11px] text-ink-500 -mt-1.5">Una imagen grande junto al carrusel — elegí de qué lado va.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {(
            [
              { id: 'left', label: 'Izquierda' },
              { id: 'right', label: 'Derecha' },
              { id: 'top', label: 'Arriba' },
              { id: 'bottom', label: 'Abajo' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              onClick={() => updateConfig(block, 'side_banner', { ...banner, position: opt.id })}
              className={`h-9 rounded-lg text-xs font-bold border transition-colors ${
                (banner.position ?? 'right') === opt.id ? 'bg-ink-950 text-cream-50 border-ink-950' : 'border-ink-200 text-ink-600 hover:border-ink-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <ImagePicker
          imageUrl={banner.image_url}
          uploading={uploadingKey === `${block.id}-sidebanner`}
          onPick={(file) => uploadBannerImage(block, file)}
          aspect="aspect-[16/10]"
        />
        {banner.image_url && (
          <input
            placeholder="Link al hacer clic (opcional)"
            defaultValue={banner.href ?? ''}
            onBlur={(e) => updateConfig(block, 'side_banner', { ...banner, href: e.target.value })}
            className="w-full h-9 px-3 bg-cream-50 border border-ink-200 rounded-lg text-xs"
          />
        )}
      </div>
    </div>
  );
}

function PromoEditor({ block, updateConfig, updateBlock, uploadImage, uploadingKey, uploadBgImage }: any) {
  const tiles: any[] = block.config.tiles ?? [];

  const addTile = () => {
    if (tiles.length >= 3) return;
    updateConfig(block, 'tiles', [...tiles, { title: '', href: '', image_url: null }]);
  };
  const updateTile = (idx: number, patch: any) => {
    const next = tiles.map((t, i) => (i === idx ? { ...t, ...patch } : t));
    updateConfig(block, 'tiles', next);
  };
  const removeTile = (idx: number) => {
    updateConfig(block, 'tiles', tiles.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <BlockSchedule block={block} updateBlock={updateBlock} />
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Título de la sección (opcional)</FieldLabel>
          <input
            defaultValue={block.config.title ?? ''}
            onBlur={(e) => updateConfig(block, 'title', e.target.value)}
            className="w-full h-10 px-3 bg-cream-50 border border-ink-200 rounded-lg text-sm"
          />
        </div>
        <div>
          <FieldLabel>Subtítulo (opcional)</FieldLabel>
          <input
            defaultValue={block.config.subtitle ?? ''}
            onBlur={(e) => updateConfig(block, 'subtitle', e.target.value)}
            className="w-full h-10 px-3 bg-cream-50 border border-ink-200 rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {tiles.map((tile, idx) => (
          <div key={idx} className="bg-cream-50 border border-ink-100 rounded-xl p-3 space-y-2 relative">
            <button onClick={() => removeTile(idx)} className="absolute top-2 right-2 text-ink-300 hover:text-red-500">
              <X size={13} />
            </button>
            <ImagePicker
              imageUrl={tile.image_url}
              uploading={uploadingKey === `${block.id}-${idx}`}
              onPick={(file) => uploadImage(block, file, idx)}
              aspect="aspect-square"
              compact
            />
            <input
              placeholder="Título"
              value={tile.title ?? ''}
              onChange={(e) => updateTile(idx, { title: e.target.value })}
              className="w-full h-8 px-2 bg-white border border-ink-200 rounded-md text-xs"
            />
            <input
              placeholder="Link (ej. /shop?sale=true)"
              value={tile.href ?? ''}
              onChange={(e) => updateTile(idx, { href: e.target.value })}
              className="w-full h-8 px-2 bg-white border border-ink-200 rounded-md text-xs"
            />
          </div>
        ))}
        {tiles.length < 3 && (
          <button
            onClick={addTile}
            className="border-2 border-dashed border-ink-200 rounded-xl flex flex-col items-center justify-center gap-1.5 py-6 text-ink-400 hover:border-gold-400 hover:text-gold-700 transition-colors"
          >
            <Plus size={18} />
            <span className="text-[11px] font-bold">Añadir tarjeta</span>
          </button>
        )}
      </div>

      <div className="pt-3 border-t border-ink-100">
        <BackgroundEditor
          value={block.config.background}
          onChange={(next) => updateConfig(block, 'background', next)}
          onUploadImage={(file) => uploadBgImage(block, file)}
          uploading={uploadingKey === `${block.id}-bg`}
          label="Fondo de la sección (detrás de las 3 tarjetas)"
        />
      </div>
    </div>
  );
}

const GALLERY_SIZE_OPTIONS: { id: GallerySize; label: string }[] = [
  { id: 'sm', label: 'Chica (1×1)' },
  { id: 'wide', label: 'Ancha (2×1)' },
  { id: 'tall', label: 'Alta (1×2)' },
  { id: 'lg', label: 'Grande (2×2)' },
];

/**
 * Editor de la pieza "Galería combinada": a diferencia del mosaico
 * (3 tarjetas siempre iguales), acá cada tarjeta elige su propio
 * tamaño (chica/ancha/alta/grande) y se acomodan solas en la grilla
 * — así se puede armar algo parecido al home de Gollo.com, con un
 * banner grande al lado de varias imágenes chicas.
 */
function GalleryEditor({ block, updateConfig, updateBlock, uploadImage, uploadingKey, uploadBgImage }: any) {
  const tiles: GalleryTile[] = block.config.tiles ?? [];

  const addTile = () => {
    if (tiles.length >= 12) return;
    updateConfig(block, 'tiles', [...tiles, { title: '', href: '', image_url: null, size: 'sm' }]);
  };
  const updateTile = (idx: number, patch: Partial<GalleryTile>) => {
    const next = tiles.map((t, i) => (i === idx ? { ...t, ...patch } : t));
    updateConfig(block, 'tiles', next);
  };
  const removeTile = (idx: number) => {
    updateConfig(block, 'tiles', tiles.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <BlockSchedule block={block} updateBlock={updateBlock} />
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Título de la sección (opcional)</FieldLabel>
          <input
            defaultValue={block.config.title ?? ''}
            onBlur={(e) => updateConfig(block, 'title', e.target.value)}
            className="w-full h-10 px-3 bg-cream-50 border border-ink-200 rounded-lg text-sm"
          />
        </div>
        <div>
          <FieldLabel>Subtítulo (opcional)</FieldLabel>
          <input
            defaultValue={block.config.subtitle ?? ''}
            onBlur={(e) => updateConfig(block, 'subtitle', e.target.value)}
            className="w-full h-10 px-3 bg-cream-50 border border-ink-200 rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="space-y-3">
        {tiles.map((tile, idx) => (
          <div key={idx} className="bg-cream-50 border border-ink-100 rounded-xl p-3 grid sm:grid-cols-[100px_1fr] gap-3 relative">
            <button onClick={() => removeTile(idx)} className="absolute top-2 right-2 text-ink-300 hover:text-red-500">
              <X size={13} />
            </button>
            <ImagePicker
              imageUrl={tile.image_url}
              uploading={uploadingKey === `${block.id}-${idx}`}
              onPick={(file: File) => uploadImage(block, file, idx)}
              aspect="aspect-square"
              compact
            />
            <div className="space-y-2 pr-5">
              <div className="grid sm:grid-cols-2 gap-2">
                <input
                  placeholder="Título"
                  value={tile.title ?? ''}
                  onChange={(e) => updateTile(idx, { title: e.target.value })}
                  className="w-full h-8 px-2 bg-white border border-ink-200 rounded-md text-xs"
                />
                <input
                  placeholder="Subtítulo"
                  value={tile.subtitle ?? ''}
                  onChange={(e) => updateTile(idx, { subtitle: e.target.value })}
                  className="w-full h-8 px-2 bg-white border border-ink-200 rounded-md text-xs"
                />
              </div>
              <input
                placeholder="Link (ej. /shop?sale=true)"
                value={tile.href ?? ''}
                onChange={(e) => updateTile(idx, { href: e.target.value })}
                className="w-full h-8 px-2 bg-white border border-ink-200 rounded-md text-xs"
              />
              <div className="flex flex-wrap gap-1.5">
                {GALLERY_SIZE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => updateTile(idx, { size: opt.id })}
                    className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                      (tile.size ?? 'sm') === opt.id ? 'bg-ink-950 text-cream-50 border-ink-950' : 'border-ink-200 text-ink-500 hover:border-ink-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 items-center">
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={isValidHex(tile.title_color) ? tile.title_color! : '#fefdfb'}
                    onChange={(e) => updateTile(idx, { title_color: e.target.value })}
                    className="w-7 h-7 rounded border border-ink-200 cursor-pointer"
                  />
                  <span className="text-[10px] text-ink-400">Color título</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={isValidHex(tile.subtitle_color) ? tile.subtitle_color! : '#f3ebda'}
                    onChange={(e) => updateTile(idx, { subtitle_color: e.target.value })}
                    className="w-7 h-7 rounded border border-ink-200 cursor-pointer"
                  />
                  <span className="text-[10px] text-ink-400">Color subtítulo</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {tiles.length < 12 && (
          <button
            onClick={addTile}
            className="w-full border-2 border-dashed border-ink-200 rounded-xl flex items-center justify-center gap-1.5 py-4 text-ink-400 hover:border-gold-400 hover:text-gold-700 transition-colors"
          >
            <Plus size={18} />
            <span className="text-[11px] font-bold">Añadir tarjeta a la galería</span>
          </button>
        )}
      </div>

      <div className="pt-3 border-t border-ink-100">
        <BackgroundEditor
          value={block.config.background}
          onChange={(next: BlockBackground) => updateConfig(block, 'background', next)}
          onUploadImage={(file: File) => uploadBgImage(block, file)}
          uploading={uploadingKey === `${block.id}-bg`}
          label="Fondo de la sección (detrás de la galería)"
        />
      </div>
    </div>
  );
}

function StatsEditor({ block, updateConfig, updateBlock }: any) {
  const items: any[] = block.config.items ?? [];

  const addItem = () => {
    if (items.length >= 4) return;
    updateConfig(block, 'items', [...items, { value: '', label: '' }]);
  };
  const updateItem = (idx: number, patch: any) => {
    updateConfig(block, 'items', items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const removeItem = (idx: number) => {
    updateConfig(block, 'items', items.filter((_, i) => i !== idx));
  };

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item, idx) => (
        <div key={idx} className="bg-cream-50 border border-ink-100 rounded-xl p-3 space-y-2 relative">
          <button onClick={() => removeItem(idx)} className="absolute top-2 right-2 text-ink-300 hover:text-red-500">
            <X size={13} />
          </button>
          <input
            placeholder="+500"
            value={item.value ?? ''}
            onChange={(e) => updateItem(idx, { value: e.target.value })}
            className="w-full h-9 px-2 bg-white border border-ink-200 rounded-md text-sm font-black text-center"
          />
          <input
            placeholder="Clientes felices"
            value={item.label ?? ''}
            onChange={(e) => updateItem(idx, { label: e.target.value })}
            className="w-full h-8 px-2 bg-white border border-ink-200 rounded-md text-xs text-center"
          />
        </div>
      ))}
      {items.length < 4 && (
        <button
          onClick={addItem}
          className="border-2 border-dashed border-ink-200 rounded-xl flex flex-col items-center justify-center gap-1.5 py-6 text-ink-400 hover:border-gold-400 hover:text-gold-700 transition-colors"
        >
          <Plus size={18} />
          <span className="text-[11px] font-bold">Añadir número</span>
        </button>
      )}
      {updateBlock && (
        <div className="sm:col-span-2 lg:col-span-4">
          <BlockSchedule block={block} updateBlock={updateBlock} />
        </div>
      )}
    </div>
  );
}

/**
 * Editor reutilizable de fondo: ninguno / color sólido / degradado
 * (dos colores + ángulo) / imagen, con control de transparencia. Lo
 * usan las piezas del home (banner, categoría destacada, mosaico) y
 * las secciones fijas Destacados/Ofertas — mismo control en todos
 * lados, guardado como jsonb (BlockBackground) en cada caso.
 */
function BackgroundEditor({
  value,
  onChange,
  onUploadImage,
  uploading,
  label = 'Fondo',
}: {
  value?: BlockBackground;
  onChange: (next: BlockBackground) => void;
  onUploadImage: (file: File) => void;
  uploading?: boolean;
  label?: string;
}) {
  const bg = value ?? {};
  const type = bg.type ?? 'none';

  const OPTIONS: { id: NonNullable<BlockBackground['type']>; label: string; icon: any }[] = [
    { id: 'none', label: 'Ninguno', icon: Ban },
    { id: 'color', label: 'Color', icon: Droplet },
    { id: 'gradient', label: 'Degradado', icon: Blend },
    { id: 'image', label: 'Imagen', icon: ImageIcon },
  ];

  return (
    <div className="space-y-2.5">
      <FieldLabel>{label}</FieldLabel>
      <div className="grid grid-cols-4 gap-1.5">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange({ ...bg, type: opt.id })}
            className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-[10px] font-bold transition-colors ${
              type === opt.id ? 'border-ink-900 bg-ink-950 text-cream-50' : 'border-ink-200 text-ink-500 hover:border-ink-400'
            }`}
          >
            <opt.icon size={13} />
            {opt.label}
          </button>
        ))}
      </div>

      {type === 'color' && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={isValidHex(bg.color) ? bg.color! : '#211d16'}
            onChange={(e) => onChange({ ...bg, color: e.target.value })}
            className="w-10 h-10 rounded-lg border border-ink-200 cursor-pointer shrink-0"
          />
          <span className="text-[11px] text-ink-500">Color sólido detrás del contenido.</span>
        </div>
      )}

      {type === 'gradient' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={isValidHex(bg.color) ? bg.color! : '#a9813f'}
              onChange={(e) => onChange({ ...bg, color: e.target.value })}
              className="w-10 h-10 rounded-lg border border-ink-200 cursor-pointer shrink-0"
            />
            <input
              type="color"
              value={isValidHex(bg.color2) ? bg.color2! : '#3d6b66'}
              onChange={(e) => onChange({ ...bg, color2: e.target.value })}
              className="w-10 h-10 rounded-lg border border-ink-200 cursor-pointer shrink-0"
            />
            <span className="text-[11px] text-ink-500">Dos colores, de esquina a esquina.</span>
          </div>
          <div>
            <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1 block mb-1">
              Ángulo ({bg.angle ?? 135}°)
            </label>
            <input
              type="range"
              min={0}
              max={360}
              value={bg.angle ?? 135}
              onChange={(e) => onChange({ ...bg, angle: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      )}

      {type === 'image' && (
        <ImagePicker imageUrl={bg.image_url} uploading={Boolean(uploading)} onPick={onUploadImage} aspect="aspect-[21/9]" />
      )}

      {(type === 'color' || type === 'gradient' || type === 'image') && (
        <div>
          <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1 block mb-1">
            Transparencia ({bg.opacity ?? 100}%)
          </label>
          <input
            type="range"
            min={10}
            max={100}
            value={bg.opacity ?? 100}
            onChange={(e) => onChange({ ...bg, opacity: Number(e.target.value) })}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}

/** Convierte un ISO timestamp a lo que espera un <input type="datetime-local">
 * (hora LOCAL del navegador, sin zona horaria) y viceversa. */
function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad2 = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Programar una pieza (cuándo empieza a verse / cuándo termina) — ya
 * existía en la base (starts_at/ends_at) pero no había desde dónde
 * ponerlo. "Termina el" además dispara el contador regresivo tipo
 * Temu/Gollo en la tienda real. */
function BlockSchedule({ block, updateBlock }: { block: Block; updateBlock: (id: string, patch: Partial<Block>) => void }) {
  const [open, setOpen] = useState(Boolean(block.starts_at || block.ends_at));
  return (
    <div className="rounded-xl border border-ink-100 bg-cream-50/60 p-3">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 text-[11px] font-bold text-ink-600 hover:text-ink-900">
        <Maximize2 size={11} className="rotate-45" />
        Programar / contador regresivo {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <div>
            <FieldLabel>Empieza a verse (opcional)</FieldLabel>
            <input
              type="datetime-local"
              value={toDatetimeLocal(block.starts_at)}
              onChange={(e) => updateBlock(block.id, { starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="w-full h-10 px-3 bg-white border border-ink-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <FieldLabel>Termina el (activa el contador regresivo)</FieldLabel>
            <input
              type="datetime-local"
              value={toDatetimeLocal(block.ends_at)}
              onChange={(e) => updateBlock(block.id, { ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="w-full h-10 px-3 bg-white border border-ink-200 rounded-lg text-sm"
            />
            {block.ends_at && (
              <button onClick={() => updateBlock(block.id, { ends_at: null })} className="text-[11px] font-bold text-ink-500 hover:text-ink-900 underline mt-1">
                Quitar fecha límite
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const COUNT_OPTIONS = [1, 4, 8, 12, 16, 24];

/** Personalización de una sección fija (Destacados / Ofertas): fondo
 * de la caja + cuántos productos trae. "1" existe a propósito — para
 * cuando el dueño de la tienda quiere exponer un solo producto como
 * mega promo, en vez de una fila completa. */
function SectionCustomizer({
  title,
  config,
  onChangeConfig,
  onUploadImage,
  uploading,
}: {
  title: string;
  sectionKey: 'featured' | 'on_sale';
  config?: { bg?: BlockBackground; count?: number; countdown_end?: string | null };
  onChangeConfig: (next: { bg?: BlockBackground; count?: number; countdown_end?: string | null }) => void;
  onUploadImage: (file: File) => void;
  uploading: boolean;
}) {
  const count = config?.count ?? 12;
  return (
    <div className="bg-white rounded-2xl border-2 border-ink-100 p-5 space-y-4">
      <div>
        <p className="text-xs font-black text-ink-900 uppercase tracking-wider">{title} — personalizar</p>
        <p className="text-[11px] text-ink-500 mt-0.5">Fondo de la caja, cuántos productos mostrar, y un contador regresivo opcional.</p>
      </div>
      <div>
        <FieldLabel>Cantidad de productos</FieldLabel>
        <div className="flex flex-wrap gap-1.5">
          {COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => onChangeConfig({ ...config, count: n })}
              className={`px-3 h-8 rounded-lg text-xs font-bold border transition-colors ${
                count === n ? 'bg-ink-950 text-cream-50 border-ink-950' : 'border-ink-200 text-ink-600 hover:border-ink-400'
              }`}
            >
              {n === 1 ? '1 (mega promo)' : n}
            </button>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Contador regresivo — termina el (opcional)</FieldLabel>
        <div className="flex items-center gap-2">
          <input
            type="datetime-local"
            value={toDatetimeLocal(config?.countdown_end)}
            onChange={(e) => onChangeConfig({ ...config, countdown_end: e.target.value ? new Date(e.target.value).toISOString() : null })}
            className="w-full h-10 px-3 bg-cream-50 border border-ink-200 rounded-lg text-sm"
          />
          {config?.countdown_end && (
            <button onClick={() => onChangeConfig({ ...config, countdown_end: null })} className="text-[11px] font-bold text-ink-500 hover:text-ink-900 underline shrink-0">
              Quitar
            </button>
          )}
        </div>
      </div>
      <BackgroundEditor
        value={config?.bg}
        onChange={(next) => onChangeConfig({ ...config, bg: next })}
        onUploadImage={onUploadImage}
        uploading={uploading}
        label="Fondo de la caja"
      />
    </div>
  );
}

function ImagePicker({
  imageUrl,
  uploading,
  onPick,
  aspect = 'aspect-square',
  compact = false,
}: {
  imageUrl?: string | null;
  uploading: boolean;
  onPick: (file: File) => void;
  aspect?: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'w-full' : 'flex items-center gap-3'}>
      {imageUrl ? (
        <img src={imageUrl} alt="" className={`${compact ? `w-full ${aspect}` : `w-32 h-20`} rounded-xl object-cover border border-ink-200`} />
      ) : (
        <div className={`${compact ? `w-full ${aspect}` : 'w-32 h-20'} rounded-xl border-2 border-dashed border-ink-200 flex items-center justify-center text-ink-300`}>
          <ImageIcon size={compact ? 16 : 18} />
        </div>
      )}
      <label className={`text-xs font-bold text-gold-700 hover:underline cursor-pointer ${compact ? 'block text-center mt-1' : ''}`}>
        {uploading ? 'Subiendo...' : 'Subir imagen'}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
        />
      </label>
    </div>
  );
}
