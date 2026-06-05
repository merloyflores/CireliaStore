'use client';

import { useState } from 'react';
import { Share2, CheckCircle2, CreditCard } from 'lucide-react';

// --- NUESTRO MAPA DE COLORES COMPLETO ---
const COLOR_MAP: Record<string, string> = {
  // --- TUS METÁLICOS Y VALIOSOS ---
  'dorado': '#D4AF37', 'gold': '#D4AF37',
  'plata': '#C0C0C0', 'plateado': '#E5E7EB', 'silver': '#C0C0C0',
  'oro rosa': '#B76E79', 'rose gold': '#B76E79',
  'bronce': '#CD7F32', 'bronze': '#CD7F32',
  'cobre': '#B87333', 'copper': '#B87333',

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

  // --- PALETA CÁLIDA, MUEBLES Y TEXTILES ---
  'marrón': '#78350F', 'brown': '#78350F', 'cafe': '#78350F', 'café': '#78350F',
  'chocolate': '#451A03',
  'mostaza': '#CA8A04', 'mustard': '#CA8A04',
  'ocre': '#C68E17', 'ochre': '#C68E17',
  'vino': '#7F1D1D', 'burgundy': '#7F1D1D', 'burdeos': '#7F1D1D',
  'coral': '#F87171',
  'salmón': '#FA8072', 'salmon': '#FA8072',
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
  'lila': '#F3E8FF', 'lilac': '#F3E8FF'
};

interface ProductSelectorsProps {
  colors?: string[] | null;
  isExpressDelivery?: boolean;
}

export default function ProductSelectors({ colors = [], isExpressDelivery = true }: ProductSelectorsProps) {
  const hasColors = colors && colors.length > 0;
  const [selectedColor, setSelectedColor] = useState<string | null>(hasColors ? colors[0] : null);

  const handleShare = async () => {
    if (typeof window !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error al compartir', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('¡Enlace de producto copiado al portapapeles!');
    }
  };

  return (
    <div className="space-y-8 my-8 border-t border-b border-zinc-100 py-8">
      {/* SECTOR DE COLOR: Solo se renderiza si el producto posee variantes de color */}
      {hasColors && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">
              Color seleccionado: <span className="text-zinc-950 font-black capitalize">{selectedColor}</span>
            </label>
            <button 
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors"
            >
              <Share2 size={14} /> Compartir
            </button>
          </div>
          
          {/* AQUÍ ESTÁ EL CAMBIO DE LOS BOTONES CON EL CÍRCULO PRO */}
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              // Buscamos el color real en minúsculas en el mapa. Si no existe, ponemos un gris sutil por defecto
              const hexColor = COLOR_MAP[color.toLowerCase()] || '#E4E4E7';
              const isSelected = selectedColor === color;

              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`h-11 px-4 rounded-xl text-xs font-bold transition-all border flex items-center gap-2.5 cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-zinc-950 text-white border-zinc-950 shadow-md'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50'
                  }`}
                >
                  {/* El círculo con el color del mapa */}
                  <span 
                    className={`w-3.5 h-3.5 rounded-full shrink-0 border transition-transform ${
                      isSelected ? 'border-white/30 scale-110' : 'border-black/10'
                    }`}
                    style={{ backgroundColor: hexColor }}
                  />
                  
                  {/* El texto del color con la primera letra en Mayúscula */}
                  <span className="capitalize">{color}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Si el producto NO tiene colores */}
      {!hasColors && (
        <div className="flex justify-end">
          <button 
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors"
          >
            <Share2 size={14} /> Compartir Producto
          </button>
        </div>
      )}

      {/* COMPONENTE LOGÍSTICA DINÁMICA */}
      <div className="bg-zinc-50/50 rounded-2xl p-4 border border-zinc-100 space-y-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-emerald-600">
            <CheckCircle2 size={16} fill="currentColor" className="text-white" />
          </div>
          <div className="text-xs font-semibold text-zinc-700">
            {isExpressDelivery ? (
              <p>Entrega <span className="text-emerald-600 font-extrabold uppercase tracking-tight">Mañana mismo</span> disponible en tu ubicación.</p>
            ) : (
              <p>Entrega estimada regular de 2 a 4 días hábiles.</p>
            )}
          </div>
        </div>

        {/* MÉTODOS DE PAGO */}
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-200/60 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          <CreditCard size={12} />
          <span>Pagos Seguros: Sinpe Móvil, Tarjetas de Crédito y Efectivo</span>
        </div>
      </div>
    </div>
  );
}