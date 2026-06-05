'use client';

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
  specifications?: Record<string, string> | null; // Nuevo campo JSONB
}

export default function ProductSpecs({
  description,
  brand = "Miomu",
  material,
  dimensions,
  inTheBox,
  sku,
  weight,
  warrantyDays = 30,
  relatedTags,
  specifications
}: ProductSpecsProps) {
  
  // Componente interno para mantener el código limpio (DRY)
  const SpecRow = ({ label, value, isMonospace = false }: { label: string; value: React.ReactNode; isMonospace?: boolean }) => (
    <div className="flex justify-between py-3 border-b border-zinc-100 last:border-0">
      <span className="text-zinc-500 text-sm font-medium">{label}</span>
      <span className={`text-zinc-900 text-sm font-semibold ${isMonospace ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="space-y-16">
      
      {/* 1. DESCRIPCIÓN (Ocupa todo el ancho por legibilidad) */}
      <div className="max-w-3xl">
        <h3 className="text-lg font-black text-zinc-950 mb-4 tracking-tight">Detalles del producto</h3>
        <p className="text-zinc-600 leading-relaxed text-sm font-medium whitespace-pre-line">
          {description || "No hay descripción adicional disponible."}
        </p>
      </div>

      {/* 2. GRID DE ESPECIFICACIONES (El corazón profesional) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* COLUMNA 1: Datos Técnicos */}
        <div className="bg-zinc-50/50 p-6 rounded-2xl border border-zinc-100 h-fit">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Especificaciones</h4>
          <div className="flex flex-col">
            <SpecRow label="Marca" value={brand} />
            {material && <SpecRow label="Material" value={material} />}
            {dimensions && <SpecRow label="Dimensiones" value={dimensions} />}
            {weight && <SpecRow label="Peso" value={weight} />}
            {sku && <SpecRow label="SKU" value={sku} isMonospace />}
            {specifications && Object.entries(specifications).map(([key, value]) => (
      <SpecRow key={key} label={key} value={value} />
    ))}
          </div>
        </div>

        {/* COLUMNA 2: Garantía y Contenido */}
        <div className="space-y-8">
            <div className="bg-zinc-50/50 p-6 rounded-2xl border border-zinc-100">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Protección y Envío</h4>
                <SpecRow label="Garantía" value={`${warrantyDays} días`} />
                {inTheBox && (
                    <div className="mt-4 pt-4 border-t border-zinc-100">
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Incluye en la caja</p>
                        <p className="text-sm text-zinc-700 leading-relaxed">{inTheBox}</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* 3. ETIQUETAS (Estilo tag moderno) */}
      {relatedTags && relatedTags.length > 0 && (
        <div className="pt-8 border-t border-zinc-100">
          <div className="flex flex-wrap gap-2">
            {relatedTags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-white border border-zinc-200 rounded-md text-[10px] font-bold text-zinc-500 hover:text-sky-600 hover:border-sky-200 transition-colors cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}