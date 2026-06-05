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
  relatedTags
}: ProductSpecsProps) {
  return (
    <div className="mt-20 border-t border-zinc-100 pt-16 space-y-16">
      {/* 1. DESCRIPCIÓN */}
      <div>
        <h3 className="text-xl font-black text-zinc-950 mb-4 tracking-tight">Descripción</h3>
        <p className="text-zinc-600 leading-relaxed max-w-4xl text-sm font-medium whitespace-pre-line">
          {description || "No hay descripción adicional disponible para este producto."}
        </p>
      </div>

      {/* 2. CARACTERÍSTICAS TÉCNICAS (Solo si existen datos) */}
      {(material || dimensions) && (
        <div>
          <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-6">Características</h3>
          <div className="border border-zinc-100 rounded-2xl overflow-hidden max-w-2xl bg-zinc-50/50">
            <div className="grid grid-cols-3 border-b border-zinc-100 p-4 text-sm">
              <span className="font-bold text-zinc-400">Marca</span>
              <span className="col-span-2 font-semibold text-zinc-800">{brand}</span>
            </div>
            {material && (
              <div className="grid grid-cols-3 border-b border-zinc-100 p-4 text-sm">
                <span className="font-bold text-zinc-400">Material</span>
                <span className="col-span-2 font-semibold text-zinc-800">{material}</span>
              </div>
            )}
            {dimensions && (
              <div className="grid grid-cols-3 p-4 text-sm">
                <span className="font-bold text-zinc-400">Dimensiones</span>
                <span className="col-span-2 font-semibold text-zinc-800">{dimensions}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. EN LA CAJA */}
      {inTheBox && (
        <div>
          <h3 className="text-xl font-black text-zinc-950 mb-4 tracking-tight">En la Caja</h3>
          <ul className="list-disc list-inside text-zinc-600 text-sm font-medium space-y-1">
            <li>{inTheBox}</li>
          </ul>
        </div>
      )}

      {/* 4. GARANTÍA Y OTROS */}
      <div>
        <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-6">Garantía & Otros</h3>
        <div className="border border-zinc-100 rounded-2xl overflow-hidden max-w-2xl bg-zinc-50/50">
          <div className="grid grid-cols-3 border-b border-zinc-100 p-4 text-sm">
            <span className="font-bold text-zinc-400">Garantía</span>
            <span className="col-span-2 font-semibold text-zinc-800">{warrantyDays} días por defectos de fábrica</span>
          </div>
          {weight && (
            <div className="grid grid-cols-3 border-b border-zinc-100 p-4 text-sm">
              <span className="font-bold text-zinc-400">Peso</span>
              <span className="col-span-2 font-semibold text-zinc-800">{weight}</span>
            </div>
          )}
          {sku && (
            <div className="grid grid-cols-3 p-4 text-sm">
              <span className="font-bold text-zinc-400">SKU</span>
              <span className="col-span-2 font-mono text-xs font-bold text-zinc-600">{sku}</span>
            </div>
          )}
        </div>
      </div>

      {/* 5. ETIQUETAS RELACIONADAS */}
      {relatedTags && relatedTags.length > 0 && (
        <div>
          <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-6">Etiquetas</h3>
          <div className="flex flex-wrap gap-2">
            {relatedTags.map((tag) => (
              <span key={tag} className="px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-full text-xs font-bold text-zinc-600">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}