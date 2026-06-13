'use client';
import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Check, Search, Star, Filter } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  is_featured: boolean;
  category?: string;
  image_url?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onUpdate: () => void;
}

export default function ProductFeaturedModal({ isOpen, onClose, products, onUpdate }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    products.filter((p) => p.is_featured).map((p) => p.id)
  );
  
  const [saving, setSaving] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  // Obtener categorías únicas dinámicamente
  const categories = useMemo(() => {
    const cats = products.map(p => p.category).filter(Boolean) as string[];
    return ['Todas', ...Array.from(new Set(cats))];
  }, [products]);

  // Filtro avanzado funcional
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleProduct = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from('products').update({ is_featured: false }).neq('id', '00000000-0000-0000-0000-000000000000');
      if (selectedIds.length > 0) {
        await supabase.from('products').update({ is_featured: true }).in('id', selectedIds);
      }
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* ========================================================================= */}
      {/* AJUSTE CLAVE: Cambiamos max-h-[85vh] por h-[75vh] sm:h-[650px] estricto     */}
      {/* ========================================================================= */}
      <div className="relative bg-white w-full max-w-lg rounded-4xl shadow-2xl flex flex-col h-[75vh] sm:h-[650px] overflow-hidden">
        
        {/* Header del Modal */}
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-white shrink-0">
          <div>
            <h2 className="text-xl font-black">Gestionar Destacados</h2>
            <p className="text-xs text-zinc-400">{selectedIds.length} productos seleccionados</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Zona de Filtros Rediseñada */}
        <div className="px-6 py-4 flex flex-col sm:flex-row gap-3 bg-zinc-50/50 border-b border-zinc-100 shrink-0">
          {/* Barra de Búsqueda */}
          <div className="relative grow">
            <Search className="absolute left-3.5 top-3.5 text-zinc-400 pointer-events-none" size={16} />
            <input 
              placeholder="Buscar por nombre..." 
              className="w-full bg-white border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Selector de Categorías Estilizado */}
          <div className="relative min-w-35">
            <Filter className="absolute left-3.5 top-3.5 text-zinc-400 pointer-events-none" size={15} />
            <select 
              className="w-full h-full bg-white border border-zinc-200 rounded-xl py-3 pl-9 pr-8 text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer transition-all text-zinc-700"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="absolute right-3 top-4 pointer-events-none text-zinc-400">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Lista de Productos Filtrados (Esta sección toma todo el alto restante y genera scroll) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((p) => (
              <div 
                key={p.id} 
                onClick={() => toggleProduct(p.id)}
                className={`flex items-center gap-4 p-3 rounded-2xl border transition-all cursor-pointer ${
                  selectedIds.includes(p.id) 
                    ? 'bg-sky-50 border-sky-200' 
                    : 'bg-white border-zinc-100 hover:border-zinc-200'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                  selectedIds.includes(p.id) ? 'bg-sky-500 border-sky-500' : 'border-zinc-300'
                }`}>
                  <Check size={14} className={selectedIds.includes(p.id) ? 'text-white' : 'text-transparent'} />
                </div>

                <div className="w-12 h-12 rounded-xl bg-zinc-100 overflow-hidden shrink-0 border border-zinc-100">
                  {p.image_url ? (
                    <img src={p.image_url} className="w-full h-full object-cover" alt={p.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      <Star size={16}/>
                    </div>
                  )}
                </div>
                
                <div className="grow">
                  <p className="font-bold text-sm text-zinc-900 line-clamp-1">{p.name}</p>
                  <p className="text-[10px] uppercase font-black tracking-wider text-sky-600/80 mt-0.5">{p.category || 'Sin Categoría'}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-zinc-400 font-medium">No se encontraron productos en esta búsqueda.</p>
            </div>
          )}
        </div>

        {/* Footer con Acción */}
        <div className="p-6 border-t border-zinc-100 bg-white shrink-0">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className={`w-full py-4 rounded-2xl font-black transition-all active:scale-[0.98] ${
              selectedIds.length > 0 
                ? 'bg-zinc-950 text-white hover:bg-sky-600 shadow-md shadow-zinc-950/10' 
                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
            }`}
          >
            {saving ? 'Guardando cambios...' : `Confirmar Selección (${selectedIds.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}