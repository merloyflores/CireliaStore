'use client';

import { useState, useMemo } from 'react';
import { X, Calculator, Calendar, Tag, Trash2, CheckCircle2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  promo_price?: number | null;
  is_promo?: boolean;
}

interface BulkPromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: Product[];
  onApply: (promoData: any) => Promise<void>; // Función que llamará a tu API
}

type PromoType = 'percentage' | 'fixed_price' | 'subtract' | 'remove';

export default function BulkPromoModal({ isOpen, onClose, selectedProducts, onApply }: BulkPromoModalProps) {
  const [promoType, setPromoType] = useState<PromoType>('percentage');
  const [promoValue, setPromoValue] = useState<number | ''>('');
  const [roundPrice, setRoundPrice] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [badge, setBadge] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Calcula la vista previa de los precios en tiempo real
  const previewProducts = useMemo(() => {
    return selectedProducts.map(product => {
      let newPrice = product.price;
      let willHavePromo = true;
      const value = Number(promoValue) || 0;

      if (promoType === 'remove') {
        willHavePromo = false;
        newPrice = product.price; // Vuelve al original
      } else if (promoType === 'percentage' && value > 0) {
        newPrice = product.price - (product.price * (value / 100));
      } else if (promoType === 'fixed_price' && value > 0) {
        newPrice = value;
      } else if (promoType === 'subtract' && value > 0) {
        newPrice = Math.max(0, product.price - value); // Evitar precios negativos
      }

      // Lógica de redondeo (redondea a los 50 o 100 colones más cercanos)
      if (roundPrice && promoType !== 'remove' && promoType !== 'fixed_price') {
        newPrice = Math.round(newPrice / 50) * 50; 
      }

      return {
        ...product,
        new_promo_price: newPrice,
        will_have_promo: willHavePromo
      };
    }).slice(0, 5); // Mostramos máximo 5 en el preview para no saturar el modal
  }, [selectedProducts, promoType, promoValue, roundPrice]);

  if (!isOpen) return null;

  const handleApply = async () => {
    setIsLoading(true);
    
    // Armamos el payload con la configuración masiva
    const payload = {
      productIds: selectedProducts.map(p => p.id),
      action: promoType, // 'percentage', 'fixed_price', 'subtract', 'remove'
      value: Number(promoValue),
      round: roundPrice,
      startDate: startDate || null,
      endDate: endDate || null,
      badge: badge || null
    };

    await onApply(payload);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
          <div>
            <h2 className="text-xl font-black text-zinc-950 tracking-tight">Gestión Masiva de Ofertas</h2>
            <p className="text-sm text-zinc-500 mt-1">Aplicando cambios a <span className="font-bold text-sky-600">{selectedProducts.length}</span> productos</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* BODY (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-8">
          
          {/* TIPO DE ACCIÓN */}
          <div className="space-y-3">
            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">Tipo de Ajuste</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button onClick={() => setPromoType('percentage')} className={`p-3 rounded-xl border text-sm font-bold transition-all ${promoType === 'percentage' ? 'border-sky-600 bg-sky-50 text-sky-700' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}>% Descuento</button>
              <button onClick={() => setPromoType('fixed_price')} className={`p-3 rounded-xl border text-sm font-bold transition-all ${promoType === 'fixed_price' ? 'border-sky-600 bg-sky-50 text-sky-700' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}>Precio Fijo</button>
              <button onClick={() => setPromoType('subtract')} className={`p-3 rounded-xl border text-sm font-bold transition-all ${promoType === 'subtract' ? 'border-sky-600 bg-sky-50 text-sky-700' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}>Restar Monto</button>
              <button onClick={() => setPromoType('remove')} className={`p-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-1 ${promoType === 'remove' ? 'border-red-600 bg-red-50 text-red-700' : 'border-zinc-200 text-red-500 hover:bg-red-50'}`}><Trash2 size={16}/> Quitar</button>
            </div>
          </div>

          {/* CONFIGURACIÓN DE VALORES */}
          {promoType !== 'remove' && (
            <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 flex items-center gap-2"><Calculator size={16} className="text-zinc-400"/> Valor del ajuste</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">{promoType === 'percentage' ? '%' : '₡'}</span>
                    <input 
                      type="number" 
                      value={promoValue}
                      onChange={(e) => setPromoValue(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Ej. 20"
                      className="w-full pl-8 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-sky-600 focus:border-sky-600 outline-none transition-all font-medium"
                    />
                  </div>
                </div>
                
                {/* Opciones Adicionales */}
                <div className="space-y-3 pt-7">
                  {promoType !== 'fixed_price' && (
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" checked={roundPrice} onChange={(e) => setRoundPrice(e.target.checked)} className="w-5 h-5 rounded border-zinc-300 text-sky-600 focus:ring-sky-600 accent-sky-600" />
                      <span className="text-sm font-medium text-zinc-600 group-hover:text-zinc-900">Redondear a ₡50/₡100 más cercanos</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Fechas y Etiquetas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-200/60">
                <div className="space-y-2">
                  <label htmlFor="promo-start-date" className="text-xs font-bold text-zinc-500 flex items-center gap-1.5"><Calendar size={14}/> Inicio (Opcional)</label>
                  <input id="promo-start-date" type="date" title="Fecha de inicio" placeholder="dd/mm/aaaa" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm outline-none focus:border-sky-600" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="promo-end-date" className="text-xs font-bold text-zinc-500 flex items-center gap-1.5"><Calendar size={14}/> Fin (Opcional)</label>
                  <input id="promo-end-date" type="date" title="Fecha de finalización" placeholder="dd/mm/aaaa" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm outline-none focus:border-sky-600" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 flex items-center gap-1.5"><Tag size={14}/> Etiqueta (Opcional)</label>
                  <input type="text" value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="Ej. Black Friday" className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm outline-none focus:border-sky-600" />
                </div>
              </div>
            </div>
          )}

          {/* VISTA PREVIA (PREVIEW) */}
          <div className="space-y-3">
            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">Vista Previa ({previewProducts.length} de {selectedProducts.length})</label>
            <div className="border border-zinc-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Producto</th>
                    <th className="px-4 py-3 font-semibold">Precio Actual</th>
                    <th className="px-4 py-3 font-semibold text-right">Resultado Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {previewProducts.map(p => (
                    <tr key={p.id} className="bg-white">
                      <td className="px-4 py-3 font-medium text-zinc-900 truncate max-w-37.5">{p.name}</td>
                      <td className="px-4 py-3 text-zinc-500">₡{p.price.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        {p.will_have_promo ? (
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] line-through text-zinc-400">₡{p.price.toLocaleString()}</span>
                            <span className="font-bold text-green-600">₡{p.new_promo_price?.toLocaleString()}</span>
                          </div>
                        ) : (
                          <span className="font-bold text-zinc-900">₡{p.price.toLocaleString()}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selectedProducts.length > 5 && (
              <p className="text-center text-xs text-zinc-400 italic">Y {selectedProducts.length - 5} productos más...</p>
            )}
          </div>

        </div>

        {/* FOOTER / ACCIONES */}
        <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-zinc-600 hover:bg-zinc-200 transition-colors">
            Cancelar
          </button>
          <button 
            onClick={handleApply} 
            disabled={isLoading || (promoType !== 'remove' && !promoValue)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {isLoading ? <span className="animate-pulse">Aplicando...</span> : <><CheckCircle2 size={18} /> Confirmar Cambios</>}
          </button>
        </div>
      </div>
    </div>
  );
}