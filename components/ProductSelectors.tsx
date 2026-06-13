'use client';

import { useState } from 'react';
import { 
  Share2, 
  CheckCircle2, 
  CreditCard, 
  Smartphone, 
  Wallet, 
  Banknote, 
  Building2,
  AlertTriangle 
} from 'lucide-react';

// --- CONFIGURACIÓN DE MÉTODOS DE PAGO ---
const PAYMENT_METHODS = [
  { id: 'sinpe', label: 'SINPE Móvil', icon: Smartphone },
  { id: 'card', label: 'Tarjetas', icon: CreditCard },
  { id: 'paypal', label: 'PayPal', icon: Wallet },
  { id: 'cash', label: 'Efectivo', icon: Banknote },
  { id: 'emma', label: 'Emma Pay', icon: Building2 },
];

// --- NUESTRO MAPA DE COLORES COMPLETO ---
const COLOR_MAP: Record<string, string> = {
  // --- TUS METÁLICOS Y VALIOSOS ---
  'dorado': '#D4AF37', 'gold': '#D4AF37',
  'plata': '#C0C0C0', 'plateado': '#E5E7EB', 'silver': '#C0C0C0',
  'oro rosa': '#B76E79', 'rose gold': '#B76E79',
  'bronce': '#CD7F32', 'bronze': '#CD7F32',
  'cobre': '#B87333', 'copper': '#B87333',
  'champagne': '#F7E7CE',

  // --- LOS MINIMALISTAS DE FÁBRICA ---
  'crudo': '#FDFBF7', 'raw': '#FDFBF7',
  'arena': '#E6D5C3', 'sand': '#E6D5C3',
  'terracota': '#C86A4B', 'terracotta': '#C86A4B',
  'oliva': '#707A5A', 'olive': '#707A5A',
  'carbón': '#2C2C2C', 'charcoal': '#2C2C2C',

  // --- MONOCROMÁTICOS Y NEUTROS PRO ---
  'negro': '#09090b', 'black': '#000000',
  'blanco': '#ffffff', 'white': '#ffffff',
  'gris': '#71717A', 'gray': '#71717A', 'grey': '#71717A',
  'grafito': '#3F3F46', 'graphite': '#3F3F46',
  'crema': '#FFFDD0', 'cream': '#FFFDD0',
  'marfil': '#FFFFF0', 'ivory': '#FFFFF0',
  'beige': '#F5F5DC', 'taupe': '#483C32',

  // --- TONOS VIVOS E INTENSOS ---
  'rojo': '#EF4444', 'red': '#EF4444',
  'azul': '#3B82F6', 'blue': '#3B82F6',
  'verde': '#22C55E', 'green': '#22C55E',
  'rosado': '#F472B6', 'pink': '#F472B6',
  'naranja': '#F97316', 'orange': '#F97316',
  'amarillo': '#EAB308', 'yellow': '#EAB308',
  'púrpura': '#A855F7', 'purple': '#A855F7', 'morado': '#8B5CF6',
  'ciruela': '#8E4585', 'plum': '#8E4585',

  // --- PALETA CÁLIDA, MUEBLES Y TEXTILES ---
  'marrón': '#78350F', 'brown': '#78350F', 'cafe': '#78350F', 'café': '#78350F',
  'chocolate': '#451A03',
  'mostaza': '#CA8A04', 'mustard': '#CA8A04',
  'ocre': '#C68E17', 'ochre': '#C68E17',
  'vino': '#7F1D1D', 'burgundy': '#7F1D1D', 'burdeos': '#7F1D1D',
  'coral': '#F87171',
  'salmón': '#FA8072', 'salmon': '#FA8072',
  'durazno': '#FFDAB9', 'peach': '#FFDAB9',
  'fucsia': '#D946EF', 'fuchsia': '#D946EF',

  // --- PALETA BOTÁNICA, NÓRDICA Y OCÉANO ---
  'esmeralda': '#047857', 'emerald': '#047857',
  'menta': '#A7F3D0', 'mint': '#A7F3D0',
  'turquesa': '#06B6D4', 'turquoise': '#06B6D4',
  'celeste': '#BAE6FD', 'sky blue': '#BAE6FD',
  'marino': '#1E3A8A', 'navy': '#1E3A8A',
  'azul marino': '#1E3A8A',
  'índigo': '#4338CA', 'indigo': '#4338CA',
  'lavanda': '#E9D5FF', 'lavender': '#E9D5FF',
  'lila': '#F3E8FF', 'lilac': '#F3E8FF',
  'musgo': '#8A9A5B', 'moss': '#8A9A5B',
  'salvia': '#9DC183', 'sage': '#9DC183',
  'bosque': '#228B22', 'forest': '#228B22',
  'denim': '#1560BD'
};

interface ProductSelectorsProps {
  colors?: string[] | string | null;
  sizes?: string[] | string | null;
  isExpressDelivery?: boolean;
  stock?: number | null; // <-- PROPIEDAD AÑADIDA PARA CONTROLAR EL FILTRO DE SUPABASE
}

export default function ProductSelectors({ 
  colors, 
  sizes, 
  isExpressDelivery = true,
  stock = 10 // Fallback seguro en caso de que falle la lectura inicial
}: ProductSelectorsProps) {
  
  // Evaluamos si el stock de Supabase está totalmente en cero
  const isOutOfStock = stock !== null && stock <= 0;

  // --- PROCESAMIENTO SIMPLE DE TEXTO (SEPARADO POR COMAS) ---
  const safeColors = Array.isArray(colors) 
    ? colors 
    : (typeof colors === 'string' && colors.trim() !== '')
      ? colors.split(',').map(c => c.trim())
      : [];

  const safeSizes = Array.isArray(sizes)
    ? sizes
    : (typeof sizes === 'string' && sizes.trim() !== '')
      ? sizes.split(',').map(s => s.trim())
      : [];

  const hasColors = safeColors.length > 0;
  const hasSizes = safeSizes.length > 0;
  
  const [selectedColor, setSelectedColor] = useState<string | null>(hasColors ? safeColors[0] : null);
  const [selectedSize, setSelectedSize] = useState<string | null>(hasSizes ? safeSizes[0] : null);

  const handleShare = async () => {
    if (typeof window !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: document.title, url: window.location.href });
      } catch (err) { console.log('Error al compartir', err); }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('¡Enlace de producto copiado!');
    }
  };
  
  return (
    <div className="space-y-8 my-8 border-t border-b border-zinc-200 py-8">
      
      {/* SECTOR DE COLOR */}
      {hasColors && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              Color: <span className="text-zinc-950 capitalize">{selectedColor}</span>
            </label>
            <button type="button" onClick={handleShare} className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-zinc-950 transition-colors uppercase tracking-widest">
              <Share2 size={12} /> Compartir
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {safeColors.map((color) => {
              const hexColor = COLOR_MAP[color.toLowerCase()] || '#E4E4E7';
              const isSelected = selectedColor === color;

              return (
                <button
                  key={color}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => setSelectedColor(color)}
                  className={`h-10 px-3 rounded-lg text-xs font-bold transition-all border-2 flex items-center gap-2 active:scale-95 ${
                    isOutOfStock 
                      ? 'opacity-40 cursor-not-allowed border-zinc-200 text-zinc-300' 
                      : isSelected
                        ? 'border-zinc-950 text-zinc-950 cursor-pointer'
                        : 'border-zinc-200 text-zinc-400 hover:border-zinc-400 cursor-pointer'
                  }`}
                >
                  <span 
                    className="w-3 h-3 rounded-full border border-black/10"
                    style={{ backgroundColor: hexColor }}
                  />
                  <span className="capitalize">{color}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTOR DE TALLAS */}
      {hasSizes && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              Talla: <span className="text-zinc-950">{selectedSize}</span>
            </label>
            {!hasColors && (
               <button type="button" onClick={handleShare} className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-zinc-950 transition-colors uppercase tracking-widest">
                 <Share2 size={12} /> Compartir
               </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {safeSizes.map((size) => {
              const isSelected = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => setSelectedSize(size)}
                  className={`h-10 min-w-[2.5rem] px-3 rounded-lg text-xs font-black transition-all border-2 flex items-center justify-center active:scale-95 ${
                    isOutOfStock
                      ? 'opacity-40 cursor-not-allowed border-zinc-200 text-zinc-300'
                      : isSelected
                        ? 'border-zinc-950 text-zinc-950 cursor-pointer'
                        : 'border-zinc-200 text-zinc-400 hover:border-zinc-400 cursor-pointer'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* FALLBACK SI NO HAY VARIANTES */}
      {!hasColors && !hasSizes && (
        <div className="flex justify-end">
          <button 
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors uppercase tracking-widest"
          >
            <Share2 size={12} /> Compartir Producto
          </button>
        </div>
      )}

      {/* COMPONENTE LOGÍSTICA (Borde puro, sin fondo) */}
      <div className="rounded-xl p-4 border-2 border-zinc-100 space-y-3">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${isOutOfStock ? 'text-zinc-400' : 'text-emerald-600'}`}>
            {isOutOfStock ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          </div>
          <div className="text-xs font-medium text-zinc-600">
            {isOutOfStock ? (
              <p className="text-zinc-400">Temporalmente sin inventario para entrega inmediata.</p>
            ) : isExpressDelivery ? (
              <p>Entrega <span className="text-zinc-950 font-black uppercase tracking-tight">Mañana mismo</span> disponible.</p>
            ) : (
              <p>Entrega estándar: 2 a 4 días hábiles.</p>
            )}
          </div>
        </div>

        {/* Métodos de pago (Layout horizontal "A lo largo") */}
        <div className="pt-3 border-t border-zinc-100">
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">
            Métodos de pago aceptados
          </p>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((method) => (
              <div 
                key={method.id} 
                className="flex items-center gap-2 border border-zinc-100 rounded-lg py-1.5 px-3 bg-white/50"
              >
                <method.icon size={13} className="text-zinc-400" />
                <span className="text-[10px] font-bold text-zinc-600 whitespace-nowrap">
                  {method.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}