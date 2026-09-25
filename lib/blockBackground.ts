import type { CSSProperties } from 'react';
import { isValidHex } from '@/lib/themeColors';

/**
 * Fondo configurable para una pieza del home (banner, categoría
 * destacada, mosaico promocional) o para una sección fija (Destacados,
 * Ofertas). Vive dentro de un campo jsonb (`config.background` en
 * content_blocks, o `home_config.featured.bg` / `home_config.on_sale.bg`
 * en tenant_theme) así que no hace falta migrar la base cada vez que se
 * suma una opción nueva.
 */
export type BlockBackground = {
  type?: 'none' | 'color' | 'gradient' | 'image';
  color?: string;
  color2?: string;
  angle?: number; // grados, para el degradado
  image_url?: string | null;
  opacity?: number; // 0-100, qué tan visible es el fondo (útil para que el texto se lea encima)
};

/** Estilo para la capa de fondo en sí (se pinta detrás del contenido). */
export function resolveBackgroundLayerStyle(bg?: BlockBackground | null): CSSProperties {
  if (!bg || !bg.type || bg.type === 'none') return { display: 'none' };
  const opacity = typeof bg.opacity === 'number' ? Math.min(100, Math.max(0, bg.opacity)) / 100 : 1;

  if (bg.type === 'color' && isValidHex(bg.color)) {
    return { backgroundColor: bg.color, opacity };
  }
  if (bg.type === 'gradient' && isValidHex(bg.color)) {
    const angle = typeof bg.angle === 'number' ? bg.angle : 135;
    const to = isValidHex(bg.color2) ? bg.color2 : bg.color;
    return { backgroundImage: `linear-gradient(${angle}deg, ${bg.color}, ${to})`, opacity };
  }
  if (bg.type === 'image' && bg.image_url) {
    return {
      backgroundImage: `url(${bg.image_url})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      opacity,
    };
  }
  return { display: 'none' };
}

/** Config flexible de una sección fija del home (Destacados / Ofertas):
 * fondo + cuántos productos traer + contador opcional. Vive en
 * tenant_theme.home_config. */
export type SectionConfig = { bg?: BlockBackground; count?: number; countdown_end?: string | null };

export type CardStyle = 'classic' | 'commerce' | 'rating' | 'compact';

/** Cómo se dibuja la sección "Categorías" del home: la grilla cuadrada
 * de siempre, un carrusel horizontal, chips/pills compactas, o una
 * lista vertical tipo menú — cada una útil según cuántas categorías
 * tenga la tienda y qué tan visual quiera verse. */
export type CategoriesLayout = 'grid' | 'carousel' | 'pills' | 'list';

export type HomeConfig = {
  featured?: SectionConfig;
  on_sale?: SectionConfig;
  card_style?: CardStyle;
  categories_layout?: CategoriesLayout;
};

/** Banner adicional al lado (o arriba/abajo) de una pieza — por ejemplo
 * la "Categoría destacada", donde además del carrusel de productos se
 * puede sumar una imagen grande en cualquiera de los 4 costados. */
export type SideBanner = {
  image_url?: string | null;
  href?: string | null;
  position?: 'left' | 'right' | 'top' | 'bottom';
};

/** Personalización visual de texto que se repite en varias piezas:
 * color del título/subtítulo (además del color de marca) y un texto
 * libre extra cuando el título/subtítulo no alcanzan. */
export type TextStyleExtras = {
  title_color?: string | null;
  subtitle_color?: string | null;
  extra_text?: string | null;
};

/** Widget de WhatsApp: color, de qué lado va, saludo y texto del botón
 * — vive en tenant_theme.whatsapp_config. */
export type WhatsAppConfig = {
  color?: string | null;
  position?: 'left' | 'right';
  greeting?: string | null;
  button_text?: string | null;
};

/** Tamaño de una tarjeta dentro de una "Galería combinada" (pieza tipo
 * `gallery`) — igual que en Gollo.com/Temu: banners e imágenes de
 * distinto tamaño mezclados libremente en una sola grilla, en vez de
 * que todas las piezas midan lo mismo (como el mosaico de 3 iguales
 * que ya existía). */
export type GallerySize = 'sm' | 'wide' | 'tall' | 'lg';

export type GalleryTile = {
  image_url?: string | null;
  href?: string | null;
  title?: string | null;
  subtitle?: string | null;
  title_color?: string | null;
  subtitle_color?: string | null;
  size?: GallerySize;
};

/** Clases de Tailwind para que una tarjeta ocupe 1, 2 o 4 celdas de la
 * grilla (grid-auto-flow: dense se encarga de rellenar los huecos). */
export const GALLERY_SIZE_SPAN: Record<GallerySize, string> = {
  sm: 'col-span-1 row-span-1',
  wide: 'col-span-2 row-span-1',
  tall: 'col-span-1 row-span-2',
  lg: 'col-span-2 row-span-2',
};

export function hasBackground(bg?: BlockBackground | null): boolean {
  if (!bg || !bg.type || bg.type === 'none') return false;
  if (bg.type === 'color' || bg.type === 'gradient') return isValidHex(bg.color);
  if (bg.type === 'image') return Boolean(bg.image_url);
  return false;
}
