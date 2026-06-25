'use client';

import { ShieldCheck, PackageOpen, Info, Tag } from 'lucide-react';

interface ProductSpecsProps {
  description?: string;
  brand?: string;
  material?: string | null;
  dimensions?: string | null;
  inTheBox?: string | null;
  sku?: string | null;
  weight?: string | null;
  warrantyDays?: number;
  relatedTags?: string[] | null;
  specifications?: Record<string, string> | null;
  colors?: string[] | string | null; 
  sizes?: string[] | string | null;
}

export default function ProductSpecs({
  description,
  brand,
  material,
  dimensions,
  inTheBox,
  sku,
  weight,
  warrantyDays = 30,
  relatedTags,
  specifications,
  colors,
  sizes
}: ProductSpecsProps) {
  
  const formattedColors = Array.isArray(colors) ? colors.join(', ') : colors;
  const formattedSizes = Array.isArray(sizes) ? sizes.join(', ') : sizes;

  const specsObj = specifications || {};
  const marcaKey = Object.keys(specsObj).find(k => k.toLowerCase() === 'marca');
  const modeloKey = Object.keys(specsObj).find(k => k.toLowerCase() === 'modelo');

  const finalBrand = marcaKey ? specsObj[marcaKey] : (brand || "Cirelia");
  const finalModel = modeloKey ? specsObj[modeloKey] : null;

  const remainingSpecs = Object.entries(specsObj).filter(
    ([key]) => key !== marcaKey && key !== modeloKey
  );

  // --- SUBCOMPONENTE DE FILA (Estilo Minimalista Premium) ---
  const SpecRow = ({ label, value, isMonospace = false }: { label: string; value: React.ReactNode; isMonospace?: boolean }) => (
    <div className="flex items-end justify-between py-3 border-b border-dashed border-zinc-200 last:border-0 group">
      <span className="text-zinc-500 text-[13px] pr-4 bg-white relative top-1">{label}</span>
      <span className={`text-zinc-900 text-sm text-right font-medium max-w-[60%] leading-tight ${isMonospace ? 'font-mono text-xs text-zinc-500' : ''}`}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="space-y-16">
      
      {/* 1. DESCRIPCIÓN */}
      <div className="max-w-4xl">
        <h3 className="text-xl font-black text-zinc-950 mb-6 tracking-tight flex items-center gap-2">
          <Info size={22} className="text-zinc-300" strokeWidth={2.5} />
          Acerca de este producto
        </h3>
        {description ? (
          <div 
            className="text-zinc-600 text-[15px] leading-relaxed [&>p:empty]:hidden [&>p]:mb-3 last:[&>p]:mb-0 [&>strong]:text-zinc-900 [&>strong]:font-bold"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        ) : (
          <p className="text-zinc-400 italic text-sm">No hay descripción disponible.</p>
        )}
      </div>

      {/* 2. GRID DE ESPECIFICACIONES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-7">
          <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Especificaciones</h4>
          <div className="flex flex-col bg-white">
            <SpecRow label="Marca" value={finalBrand} />
            {finalModel && <SpecRow label="Modelo" value={finalModel} />}
            {sku && <SpecRow label="SKU" value={sku} isMonospace />}
            {formattedColors && <SpecRow label="Colores" value={formattedColors} />}
            {formattedSizes && <SpecRow label="Tallas" value={formattedSizes} />}
            {material && <SpecRow label="Material" value={material} />}
            {dimensions && <SpecRow label="Dimensiones" value={dimensions} />}
            {weight && <SpecRow label="Peso" value={weight} />}
            {remainingSpecs.map(([key, value]) => (
              <SpecRow key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} value={value} />
            ))}
          </div>
        </div>

        {/* COLUMNA DERECHA (Banners minimalistas) */}
        <div className="lg:col-span-5 space-y-4">
            <div className="bg-zinc-50 rounded-2xl p-6 flex gap-4 items-start border border-zinc-100/50">
              <ShieldCheck className="text-zinc-900 shrink-0 mt-0.5" size={24} />
              <div>
                <h4 className="text-sm font-bold text-zinc-900">Protección Cirelia</h4>
                <p className="text-[13px] text-zinc-500 mt-1.5 leading-relaxed">
                  Este producto incluye <strong className="text-zinc-900">{warrantyDays} días</strong> de cobertura total ante defectos de fabricación.
                </p>
              </div>
            </div>

            {inTheBox && (
              <div className="bg-zinc-50 rounded-2xl p-6 flex gap-4 items-start border border-zinc-100/50">
                <PackageOpen className="text-zinc-900 shrink-0 mt-0.5" size={24} />
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">Contenido del paquete</h4>
                  <div 
                    className="text-[13px] text-zinc-500 mt-1.5 leading-relaxed [&>ul]:list-disc [&>ul]:pl-4"
                    dangerouslySetInnerHTML={{ __html: inTheBox }}
                  />
                </div>
              </div>
            )}
        </div>
      </div>

      {/* 3. ETIQUETAS */}
      {relatedTags && relatedTags.length > 0 && (
        <div className="pt-8 flex flex-wrap gap-2">
          {relatedTags.map((tag) => (
            <span key={tag} className="px-3 py-1 bg-zinc-100 text-zinc-500 rounded-md text-[11px] font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors cursor-pointer">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}