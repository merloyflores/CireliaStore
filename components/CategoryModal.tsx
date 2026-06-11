'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Tag, Loader2 } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CategoryModal({ isOpen, onClose, onSuccess }: CategoryModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  // Cerrar con tecla Escape para mejor UX
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Lógica para formatear: "ropa DE dama" -> "Ropa De Dama"
  const formatName = (text: string) => {
    return text
      .trim()
      .split(/\s+/) // Divide por cualquier cantidad de espacios
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Genera el slug usando el formato ya limpio
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones preventivas
    const formattedName = formatName(name);
    if (formattedName.length < 2) {
      alert('El nombre de la categoría es muy corto.');
      return;
    }

    setLoading(true);

    const slug = generateSlug(formattedName);

    const { error } = await supabase.from('categories').insert([{ 
      name: formattedName, 
      slug 
    }]);
    
    if (!error) {
      setName('');
      onSuccess();
      onClose();
    } else {
      // Manejo de error específico (ej. si el slug ya existe)
      if (error.code === '23505') {
        alert('Esta categoría ya existe o está duplicada.');
      } else {
        alert('Error al guardar: ' + error.message);
      }
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative animate-in zoom-in-95 duration-300">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          <X size={20}/>
        </button>
        
        <h3 className="text-lg font-black text-zinc-950 mb-4">Nueva Categoría</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
              Nombre
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Tag className="h-4 w-4 text-zinc-400" />
              </div>
              <input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                placeholder="Ej: Ropa De Dama" 
                className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl pl-11 pr-4 text-sm focus:border-sky-500 outline-none transition-all" 
              />
            </div>
          </div>
          
          <button 
            disabled={loading} 
            className="w-full h-12 bg-zinc-950 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin"/> : 'Guardar Categoría'}
          </button>
        </form>
      </div>
    </div>
  );
}