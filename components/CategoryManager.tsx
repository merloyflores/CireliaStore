'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Tag, Loader2 } from 'lucide-react';

export default function CategoryManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*');
    if (data) setCategories(data);
  }

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    
    // El slug es el nombre en minúsculas y sin espacios, ideal para URLs
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    
    await supabase.from('categories').insert([{ name, slug }]);
    setName('');
    fetchCategories();
    setLoading(false);
  };

  const deleteCategory = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
    fetchCategories();
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm mb-8">
      <h3 className="text-lg font-black mb-4 flex items-center gap-2">
        <Tag size={20} /> Gestión de Categorías
      </h3>
      
      <form onSubmit={addCategory} className="flex gap-2 mb-6">
        <input 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de la nueva categoría" 
          className="flex-1 h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 text-sm"
        />
        <button disabled={loading} className="bg-zinc-950 text-white px-6 rounded-xl font-bold hover:bg-sky-600 transition-all">
          {loading ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-2 bg-zinc-100 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-700">
            {cat.name}
            <button onClick={() => deleteCategory(cat.id)} className="text-zinc-400 hover:text-red-500">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}