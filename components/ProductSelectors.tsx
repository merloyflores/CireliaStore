'use client';

import { useState } from 'react';
import { Share2, CheckCircle2, CreditCard } from 'lucide-react';

interface ProductSelectorsProps {
  colors?: string[] | null; // Acepta nulos o arreglos vacíos desde Supabase
  isExpressDelivery?: boolean;
}

export default function ProductSelectors({ colors = [], isExpressDelivery = true }: ProductSelectorsProps) {
  // Si no hay colores o el arreglo está vacío, inicializamos con null
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
              Color seleccionado: <span className="text-zinc-950 font-black">{selectedColor}</span>
            </label>
            <button 
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors"
            >
              <Share2 size={14} /> Compartir
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`h-11 px-5 rounded-xl text-xs font-bold transition-all border ${
                  selectedColor === color
                    ? 'bg-zinc-950 text-white border-zinc-950 shadow-md'
                    : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Si el producto NO tiene colores, dejamos el botón de compartir aquí arriba de la logística */}
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