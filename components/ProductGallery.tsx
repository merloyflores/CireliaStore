'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface ProductGalleryProps {
  mainImage: string;
  productName: string;
  media: Array<{ url: string }>;
}

export default function ProductGallery({ mainImage, productName, media }: ProductGalleryProps) {
  // Combinamos la imagen principal con las de la galería de la base de datos
  const allImages = [mainImage, ...media.map((m) => m.url)].filter(Boolean);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flex flex-col md:flex-row-reverse gap-6">
      {/* CONTENEDOR DE IMAGEN PRINCIPAL CON NAVEGACIÓN */}
      <div className="relative flex-1 aspect-4/5 bg-zinc-50 rounded-[2.5rem] overflow-hidden border border-zinc-100 group shadow-sm">
        {allImages.length > 0 ? (
          <img
            src={allImages[currentIndex]}
            alt={`${productName} - Vista ${currentIndex + 1}`}
            className="w-full h-full object-cover transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-300">
            <ImageIcon size={48} strokeWidth={1} />
          </div>
        )}

        {/* Flechas de Navegación Pro (Solo visibles si hay más de una foto) */}
        {allImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 backdrop-blur-md text-zinc-950 flex items-center justify-center shadow-lg border border-zinc-100 opacity-0 group-hover:opacity-100 active:scale-90 transition-all duration-300"
              aria-label="Imagen anterior"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 backdrop-blur-md text-zinc-950 flex items-center justify-center shadow-lg border border-zinc-100 opacity-0 group-hover:opacity-100 active:scale-90 transition-all duration-300"
              aria-label="Siguiente imagen"
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>
          </>
        )}

        {/* Indicador de posición flotante para Móviles */}
        {allImages.length > 1 && (
          <div className="absolute bottom-6 right-6 px-3 py-1 bg-zinc-950/40 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest pointer-events-none">
            {currentIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* CARRUSEL LATERAL/INFERIOR DE THUMBNAILS (Miniaturas) */}
      {allImages.length > 1 && (
        <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-125 scrollbar-none py-1 shrink-0 px-2 md:px-0">
          {allImages.map((img, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`w-20 h-25 md:w-24 md:h-30 rounded-2xl overflow-hidden bg-zinc-50 border-2 transition-all shrink-0 relative ${
                currentIndex === index 
                  ? 'border-sky-500 shadow-md scale-95' 
                  : 'border-transparent hover:border-zinc-300'
              }`}
            >
              <img src={img} alt="Miniatura" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}