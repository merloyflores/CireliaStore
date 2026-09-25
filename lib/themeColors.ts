/**
 * Convierte el color "Primario" que el admin elige en Configuración en
 * una rampa completa de tonos (50 a 950), para poder pisar las
 * variables CSS --color-gold-* que Tailwind v4 genera desde
 * app/globals.css (@theme). Así "bg-gold-500", "text-gold-700", etc.
 * en TODO el sitio (botones, precios, badges, hero) usan de verdad el
 * color que el admin configuró, en vez de quedar fijo en el dorado
 * original — que es justo lo que estaba roto: el picker de color
 * guardaba el valor en la base de datos, pero nada lo leía.
 *
 * La curva de luminosidad (L%) por paso replica la del dorado
 * original en globals.css, para que la escala se siga sintiendo
 * "natural" (bordes/hover/texto con buen contraste) sea cual sea el
 * color elegido, no solo con tonos dorados.
 */

type Shades = Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950, string>;

const LIGHTNESS_CURVE: Record<keyof Shades, number> = {
  50: 96,
  100: 91,
  200: 80,
  300: 69,
  400: 60,
  500: 52,
  600: 43,
  700: 35,
  800: 27,
  900: 20,
  950: 13,
};

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r: h = ((g - b) / d) % 6; break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Es un hex válido de 3 o 6 dígitos ("#a9813f" o "#a93"). */
export function isValidHex(value: string | null | undefined): value is string {
  return !!value && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

export function generateShades(baseHex: string): Shades {
  const { h, s } = hexToHsl(baseHex);
  // Con colores muy poco saturados (grises casi puros) la rampa igual
  // se ve bien: se mantiene la saturación original en cada paso.
  const shades = {} as Shades;
  (Object.keys(LIGHTNESS_CURVE) as unknown as (keyof Shades)[]).forEach((step) => {
    shades[step] = hslToHex(h, s, LIGHTNESS_CURVE[step]);
  });
  return shades;
}

/** Arma el bloque de CSS custom properties para pisar --color-gold-*. */
export function buildGoldOverrideCss(baseHex: string): string {
  const shades = generateShades(baseHex);
  const lines = (Object.keys(shades) as unknown as (keyof Shades)[])
    .map((step) => `--color-gold-${step}: ${shades[step]};`)
    .join('\n  ');
  return `:root {\n  ${lines}\n}`;
}

/**
 * Igual que buildGoldOverrideCss pero como objeto para pasar
 * directamente al prop `style` de <html>. Un estilo inline en el
 * propio elemento siempre le gana en especificidad a cualquier regla
 * `:root {}` de una hoja de estilos importada, sin importar el orden
 * en que Next.js inyecte cada una — por eso se usa esto en vez del
 * <style> en <head>, que dependía de ese orden.
 */
export function buildGoldOverrideStyle(baseHex: string): Record<string, string> {
  return buildPaletteOverrideStyle('gold', baseHex);
}

/**
 * Versión genérica de buildGoldOverrideStyle: sirve para pisar
 * cualquier rampa de color declarada en globals.css (gold, secondary,
 * cream, ink...), no solo el dorado. `prefix` es el nombre que sigue a
 * "--color-" en el @theme (p. ej. "secondary" para --color-secondary-*).
 */
export function buildPaletteOverrideStyle(prefix: string, baseHex: string): Record<string, string> {
  const shades = generateShades(baseHex);
  const style: Record<string, string> = {};
  (Object.keys(shades) as unknown as (keyof Shades)[]).forEach((step) => {
    style[`--color-${prefix}-${step}`] = shades[step];
  });
  return style;
}
