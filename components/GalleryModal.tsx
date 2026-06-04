'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Image as ImageIcon, Loader2, Upload, Trash2 } from 'lucide-react';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productId: string; // Necesitamos el ID para saber a qué producto pertenecen
}

export default function GalleryModal({ isOpen, onClose, onSuccess, productId }: GalleryModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      setPreviews(selectedFiles.map(file => URL.createObjectURL(file)));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);

    try {
      const mediaToInsert = [];

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('products').getPublicUrl(fileName);
        mediaToInsert.push({
          product_id: productId,
          url: data.publicUrl,
          media_type: 'image'
        });
      }

      const { error: dbError } = await supabase.from('product_media').insert(mediaToInsert);
      if (dbError) throw dbError;

      onSuccess();
      onClose();
      setFiles([]);
      setPreviews([]);
    } catch (error: any) {
      alert('Error al subir: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-4xl shadow-2xl p-6 sm:p-8 relative animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-zinc-50 text-zinc-400 hover:text-zinc-900 rounded-full transition-all">
          <X size={20} />
        </button>

        <h2 className="text-xl font-black text-zinc-950 mb-6">Galería de Imágenes</h2>

        <div className="space-y-4">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-200 rounded-2xl cursor-pointer hover:bg-zinc-50 transition-all">
            <Upload className="text-zinc-400 mb-2" />
            <span className="text-xs font-bold text-zinc-500 uppercase">Seleccionar fotos</span>
            <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>

          {/* Previsualización */}
          <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {previews.map((url, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-200">
                <img src={url} alt="preview" className="w-full h-full object-cover" />
                <button onClick={() => removeFile(index)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"><X size={12}/></button>
              </div>
            ))}
          </div>

          <button 
            disabled={uploading || files.length === 0}
            onClick={handleUpload}
            className="w-full h-12 bg-zinc-950 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : 'Subir Imágenes'}
          </button>
        </div>
      </div>
    </div>
  );
}