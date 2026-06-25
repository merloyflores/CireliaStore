'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Image as ImageIcon, Loader2, Upload, Trash2, Images, Check } from 'lucide-react';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productId: string;
}

export default function GalleryModal({ isOpen, onClose, onSuccess, productId }: GalleryModalProps) {
  // PESTAÑA ACTIVA: 'upload' para nuevas, 'existing' para ver y borrar las de la base de datos
  const [activeTab, setActiveTab] = useState<'upload' | 'existing'>('upload');

  // ESTADOS PARA NUEVAS FOTOS (LÓGICA ORIGINAL)
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // ESTADOS PARA FOTOS EXISTENTES Y SELECCIÓN MÚLTIPLE
  const [existingMedia, setExistingMedia] = useState<any[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  // Trae las imágenes reales en la nube asociadas a este producto
  const fetchExistingMedia = useCallback(async () => {
    if (!productId) return;
    setLoadingExisting(true);
    try {
      const { data, error } = await supabase
        .from('product_media')
        .select('*')
        .eq('product_id', productId)
        .eq('media_type', 'image')
        .order('id', { ascending: true });

      if (!error && data) setExistingMedia(data);
    } catch (err) {
      console.error('Error al traer galería:', err);
    } finally {
      setLoadingExisting(false);
    }
  }, [productId]);

  // Cargamos los datos existentes si el modal se abre
  useEffect(() => {
    if (isOpen && productId) {
      fetchExistingMedia();
      setActiveTab('upload');
      setFiles([]);
      setPreviews([]);
      setSelectedIds([]); // Limpiar selección al abrir
    }
  }, [isOpen, productId, fetchExistingMedia]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
      setPreviews(prev => [...prev, ...selectedFiles.map(file => URL.createObjectURL(file))]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Sube las fotos y refresca la lista existente
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

      setFiles([]);
      setPreviews([]);
      await fetchExistingMedia();
      setActiveTab('existing');
      onSuccess();
    } catch (error: any) {
      console.error(error);
      alert('Error al subir: ' + (error.message || 'Error desconocido'));
    } finally {
      setUploading(false);
    }
  };

  // Alternar la selección de una foto individual
  const toggleSelectMedia = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // NUEVA FUNCIÓN PRO: Elimina múltiples imágenes seleccionadas en lote de Storage y DB
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    
    const cantidad = selectedIds.length;
    if (!confirm(`¿Estás seguro de que deseas eliminar las ${cantidad} imágenes seleccionadas de la galería?`)) return;

    setDeleting(true);

    try {
      // Filtrar los elementos que corresponden a los IDs seleccionados
      const itemsToDelete = existingMedia.filter(item => selectedIds.includes(item.id));
      const storagePathsToRemove: string[] = [];

      itemsToDelete.forEach(item => {
        if (item.url) {
          const urlParts = item.url.split('/products/');
          if (urlParts.length > 1) {
            storagePathsToRemove.push(urlParts[1]); // Guarda "productId/archivo.ext"
          }
        }
      });

      // 1. Borrado masivo del Storage si hay rutas válidas
      if (storagePathsToRemove.length > 0) {
        await supabase.storage.from('products').remove(storagePathsToRemove);
      }

      // 2. Borrado masivo de la Base de Datos usando un array in
      const { error } = await supabase.from('product_media').delete().in('id', selectedIds);
      
      if (!error) {
        setExistingMedia(prev => prev.filter(item => !selectedIds.includes(item.id)));
        setSelectedIds([]); // Reseteamos la selección masiva
        onSuccess();
      } else {
        throw error;
      }
    } catch (error: any) {
      console.error('Error al borrar en lote:', error);
      alert('No se pudieron borrar las imágenes: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-md z-99999 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-4xl shadow-2xl p-6 sm:p-8 relative animate-in zoom-in-95 duration-300">
        
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-all z-10">
          <X size={20} />
        </button>

        <div className="mb-5">
          <h2 className="text-xl font-black text-zinc-950 tracking-tight">Galería del Producto</h2>
          <p className="text-zinc-400 text-xs mt-0.5">Administra el carrusel de fotos secundarias del artículo.</p>
        </div>

        {/* CONTROLES DE PESTAÑAS (TABS) PREMIUM */}
        <div className="flex border-b border-zinc-100 mb-6 gap-2">
          <button
            type="button"
            disabled={deleting}
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-2 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'upload'
                ? 'border-zinc-950 text-zinc-950 font-black'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            } disabled:opacity-30`}
          >
            <Upload size={14} /> Subir Nuevas
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => setActiveTab('existing')}
            className={`pb-3 px-2 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'existing'
                ? 'border-zinc-950 text-zinc-950 font-black'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            } disabled:opacity-30`}
          >
            <Images size={14} /> Guardadas ({existingMedia.length})
          </button>
        </div>

        {/* VISTA 1: SUBIR NUEVAS FOTOS */}
        {activeTab === 'upload' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-zinc-200 rounded-2xl cursor-pointer hover:bg-zinc-50 hover:border-zinc-300 transition-all">
              <Upload className="text-zinc-400 mb-2" size={24} />
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Seleccionar fotos</span>
              <p className="text-[10px] text-zinc-400 mt-1">Soporta múltiples imágenes simultáneas</p>
              <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>

            {previews.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Cola de carga local:</span>
                <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {previews.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 group shadow-xs">
                      <img src={url} alt="preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removeFile(index)} 
                        className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-lg opacity-90 hover:opacity-100 hover:scale-105 transition-all shadow-xs"
                        title="Quitar de la lista"
                      >
                        <X size={12} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button 
              type="button"
              disabled={uploading || files.length === 0}
              onClick={handleUpload}
              className="w-full h-12 bg-zinc-950 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
            >
              {uploading ? (
                <><Loader2 size={18} className="animate-spin" /> Guardando en la nube...</>
              ) : (
                `Subir ${files.length} imágenes`
              )}
            </button>
          </div>
        )}

        {/* VISTA 2: VER Y BORRAR FOTOS EXISTENTES CON SELECCIÓN MÚLTIPLE */}
        {activeTab === 'existing' && (
          <div className="animate-in fade-in duration-200 space-y-4">
            
            {/* ACCIONES DE BORRADO EN LOTE (MUESTRA SOLO SI HAY SELECCIONADAS) */}
            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between bg-red-50 border border-red-100 p-3 rounded-xl animate-in slide-in-from-top-2 duration-200">
                <span className="text-xs font-bold text-red-900">
                  {selectedIds.length} {selectedIds.length === 1 ? 'imagen seleccionada' : 'imágenes seleccionadas'}
                </span>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteSelected}
                  className="px-3 h-8 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                >
                  {deleting ? (
                    <><Loader2 size={12} className="animate-spin" /> Eliminando...</>
                  ) : (
                    <><Trash2 size={12} /> Eliminar selección</>
                  )}
                </button>
              </div>
            )}

            {loadingExisting ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-400 gap-2">
                <Loader2 size={24} className="animate-spin text-zinc-950" />
                <span className="text-xs font-semibold">Leyendo base de datos...</span>
              </div>
            ) : existingMedia.length > 0 ? (
              <div className="grid grid-cols-3 gap-4 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                {existingMedia.map((media) => {
                  const isSelected = selectedIds.includes(media.id);
                  return (
                    <div 
                      key={media.id} 
                      onClick={() => !deleting && toggleSelectMedia(media.id)}
                      className={`relative aspect-square rounded-xl overflow-hidden border cursor-pointer transition-all bg-zinc-50 group unselectable ${
                        isSelected 
                          ? 'border-red-500 ring-2 ring-red-500/20 shadow-md' 
                          : 'border-zinc-100 hover:border-zinc-300 shadow-xs'
                      }`}
                    >
                      <img src={media.url} alt="Galeria guardada" className="w-full h-full object-cover" />
                      
                      {/* Capa oscura de contraste */}
                      <div className={`absolute inset-0 transition-opacity ${isSelected ? 'bg-black/10' : 'bg-black/20 opacity-0 group-hover:opacity-100'}`} />
                      
                      {/* Checkbox de Selección Avanzada */}
                      <div className={`absolute top-2.5 right-2.5 w-5 h-5 rounded-md flex items-center justify-center transition-all border ${
                        isSelected 
                          ? 'bg-red-600 border-red-600 text-white scale-100 shadow-xs' 
                          : 'bg-white/80 backdrop-blur-xs border-zinc-300 opacity-0 group-hover:opacity-100 scale-90'
                      }`}>
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-44 text-center border-2 border-dashed border-zinc-100 rounded-2xl bg-zinc-50/50">
                <ImageIcon size={32} className="text-zinc-300 mb-2" />
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Galería vacía</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Aún no hay fotos registradas para este producto.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}