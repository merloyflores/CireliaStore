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

  // Filtro avanzado
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
      
      <div className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-xl font-black">Gestionar Destacados</h2>
            <p className="text-xs text-zinc-400">{selectedIds.length} productos seleccionados</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full"><X size={20} /></button>
        </div>

        {/* Filtros */}
        <div className="px-6 py-4 flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-3.5 text-zinc-400" size={16} />
            <input 
              placeholder="Buscar..." 
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-sky-500"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <select 
              className="h-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-sky-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
          {filteredProducts.map((p) => (
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

              <div className="w-12 h-12 rounded-xl bg-zinc-100 overflow-hidden flex-shrink-0">
                {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-400"><Star size={16}/></div>}
              </div>
              
              <div className="flex-grow">
                <p className="font-bold text-sm text-zinc-900">{p.name}</p>
                <p className="text-[10px] uppercase font-bold text-sky-600/70">{p.category}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-zinc-100 bg-white">
          <button 
            onClick={handleSave} 
            disabled={saving || selectedIds.length === 0}
            className={`w-full py-4 rounded-2xl font-black transition-all ${
              selectedIds.length > 0 ? 'bg-zinc-900 text-white hover:bg-sky-600' : 'bg-zinc-100 text-zinc-400'
            }`}
          >
            {saving ? 'Guardando...' : `Confirmar (${selectedIds.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}