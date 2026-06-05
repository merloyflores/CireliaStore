'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, X, Settings2, Trash2, Check, Tag } from 'lucide-react';

const COMMON_SPECS = ["Acabado", "Amperaje", "Batería", "Bluetooth", "Capacidad", "Certificación", "Color", "Compatibilidad", "Conectividad", "Consumo", "Dimensiones", "Duración", "Frecuencia", "Garantía", "Interfaz", "Marca", "Material", "Modelo", "Montaje", "Peso", "Potencia", "Resolución", "Resistencia", "Sistema Operativo", "Tamaño", "Tecnología", "Temperatura", "Tipo", "Velocidad", "Voltaje", "Wi-Fi"];

export default function SpecManagerModal({ productId, currentSpecs, onClose, onSave }: any) {
  const [specs, setSpecs] = useState(currentSpecs || {});
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const addSpec = () => {
    if (newKey && newValue) {
      setSpecs({ ...specs, [newKey]: newValue });
      setNewKey("");
      setNewValue("");
    }
  };

  const removeSpec = (key: string) => {
    const updated = { ...specs };
    delete updated[key];
    setSpecs(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase.from('products').update({ specifications: specs }).eq('id', productId);
    if (!error) onSave();
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop con blur */}
      <div className="absolute inset-0 bg-zinc-950/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-zinc-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-100 text-sky-600 rounded-lg">
              <Settings2 size={18} />
            </div>
            <h2 className="text-sm font-black text-zinc-950 uppercase tracking-widest">Características</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors text-zinc-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {/* Lista actual con scroll suave */}
          <div className="space-y-2 mb-8 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
            {Object.keys(specs).length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-zinc-100 rounded-2xl">
                <p className="text-zinc-400 text-sm font-medium">No hay características añadidas.</p>
              </div>
            )}
            
            {Object.entries(specs).map(([key, value]) => (
              <div key={key} className="group flex justify-between items-center p-3 bg-white border border-zinc-100 rounded-xl hover:border-zinc-200 transition-all shadow-sm">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">{key}</span>
                  <span className="text-sm font-semibold text-zinc-900">{value as string}</span>
                </div>
                <button 
                  onClick={() => removeSpec(key)} 
                  className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Formulario de entrada */}
          <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 space-y-3">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Añadir nueva</p>
            
            <div className="grid grid-cols-1 gap-2">
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                <select 
                  className="w-full text-sm p-3 pl-9 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all appearance-none bg-white"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                >
                  <option value="">Seleccionar del catálogo...</option>
                  {COMMON_SPECS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              
              <input 
                placeholder="O escribe un atributo personalizado..."
                className="w-full text-sm p-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
              
              <input 
                placeholder="Valor (ej: 2500 mAh)"
                className="w-full text-sm p-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              />
            </div>

            <button 
              onClick={addSpec} 
              className="w-full bg-zinc-900 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all active:scale-[0.98]"
            >
              <Plus size={16} /> Añadir a la lista
            </button>
          </div>
        </div>

        {/* Footer de acción */}
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50">
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full bg-sky-600 text-white p-3.5 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-sky-700 transition-all shadow-lg shadow-sky-600/20 active:scale-[0.98]"
          >
            {isSaving ? "Guardando..." : <><Check size={18} /> Guardar cambios</>}
          </button>
        </div>
      </div>
    </div>
  );
}