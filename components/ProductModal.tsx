'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Image as ImageIcon, 
  Loader2, 
  X, 
  Type, 
  DollarSign, 
  Package, 
  Tag, 
  AlignLeft, 
  Plus
} from 'lucide-react';
import CategoryModal from './CategoryModal';
import GalleryModal from './GalleryModal';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productToEdit: any | null;
}

export default function ProductModal({ isOpen, onClose, onSuccess, productToEdit }: ProductModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]); 
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('10');
  const [categoryId, setCategoryId] = useState(''); 
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');

  const fetchCategories = async () => {
    const { data: catData } = await supabase.from('categories').select('id, name');
    if (catData) setCategories(catData);
  };

  useEffect(() => {
    async function loadInitialData() {
      const { data: catData } = await supabase.from('categories').select('id, name');
      if (catData) setCategories(catData);
    
      fetchCategories();
      if (isOpen) {
        if (productToEdit) {
          setName(productToEdit.name || '');
          setPrice(productToEdit.price?.toString() || '');
          setDescription(productToEdit.description || '');
          setStock(productToEdit.stock?.toString() || '10');
          setCategoryId(productToEdit.category_id || ''); 
          setCurrentImageUrl(productToEdit.image_url || '');
        } else {
          setName('');
          setPrice('');
          setDescription('');
          setStock('10');
          setCategoryId('');
          setCurrentImageUrl('');
        }
        setImageFile(null);
      }
    }
    loadInitialData();
  }, [isOpen, productToEdit]);

  if (!isOpen) return null;

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('products').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      console.error('Error al subir:', error);
      alert('Error al subir la imagen a Supabase.');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      let finalImageUrl = currentImageUrl;
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) finalImageUrl = uploadedUrl;
      }

      const productData = {
        name,
        price: parseFloat(price),
        description,
        stock: parseInt(stock),
        category_id: categoryId || null, 
        image_url: finalImageUrl
      };

      let productId = productToEdit?.id;

      if (productToEdit) {
        // Actualizar producto
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productToEdit.id);
        
        if (error) throw error;
      } else {
        // Insertar nuevo producto y obtener el ID
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select('id')
          .single();
          
        if (error) throw error;
        productId = data.id;
      }

      // --- AÑADIDO PARA PRODUCT_MEDIA ---
      // Si tenemos una URL de imagen, la guardamos en la nueva tabla
      if (finalImageUrl) {
        const { error: mediaError } = await supabase
          .from('product_media')
          .insert({
            product_id: productId,
            url: finalImageUrl,
            media_type: 'image'
          });
          
        if (mediaError) console.error("Error al registrar en product_media:", mediaError);
      }

      onSuccess(); 
      onClose();
      
    } catch (error: any) {
      console.error("DETALLE DEL ERROR:", error);
      alert(`Error al guardar: ${error.message || 'Revisa la consola (F12)'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed top-0 left-0 w-screen h-screen bg-zinc-950/70 backdrop-blur-md z-99999 flex items-center justify-center p-4 sm:p-6"
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
    >
      <div className="bg-white w-full max-w-lg rounded-4xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-zinc-100 p-6 sm:p-8 relative animate-in zoom-in-95 fade-in duration-300 max-h-[95vh] overflow-y-auto custom-scrollbar">
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-zinc-50 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 hover:rotate-90 rounded-full transition-all duration-300"
          title="Cerrar ventana"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        <div className="mb-8">
          <h2 className="text-2xl font-black text-zinc-950 tracking-tight">
            {productToEdit ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <p className="text-xs text-zinc-400 font-medium mt-1">
            {productToEdit ? 'Modifica los detalles de tu inventario.' : 'Añade un nuevo artículo al catálogo de Cirelia.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Nombre del Producto</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Type className="h-4 w-4 text-zinc-400" />
              </div>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full h-12 bg-zinc-50/50 border border-zinc-200 rounded-xl pl-11 pr-4 font-medium focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all text-sm" placeholder="Ej. Cojín Decorativo Boho" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Precio (₡)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-zinc-400" />
                </div>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full h-12 bg-zinc-50/50 border border-zinc-200 rounded-xl pl-11 pr-4 font-medium focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all text-sm" placeholder="18000" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Stock</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Package className="h-4 w-4 text-zinc-400" />
                </div>
                <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required className="w-full h-12 bg-zinc-50/50 border border-zinc-200 rounded-xl pl-11 pr-4 font-medium focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all text-sm" placeholder="10" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Categoría</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Tag className="h-4 w-4 text-zinc-400" />
                </div>
                <select 
                  value={categoryId} 
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-12 bg-zinc-50/50 border border-zinc-200 rounded-xl pl-11 pr-4 font-medium focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all text-sm appearance-none"
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <button 
                type="button" 
                onClick={() => setIsCategoryModalOpen(true)}
                className="h-12 w-12 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 rounded-xl text-zinc-600 transition-all"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Descripción</label>
            <div className="relative">
              <div className="absolute top-4 left-0 pl-4 pointer-events-none">
                <AlignLeft className="h-4 w-4 text-zinc-400" />
              </div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl pl-11 pr-4 py-3.5 font-medium focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all text-sm resize-none" placeholder="Detalles del producto, materiales, medidas..."></textarea>
            </div>
          </div>

          <div className="space-y-4">
          {/* Sección: Fotografía Principal */}
          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
              Fotografía del Producto
            </label>
            
            <div className="flex items-center gap-4 p-3 bg-white border border-zinc-200 rounded-2xl shadow-sm">
              <div className="w-16 h-16 rounded-xl bg-zinc-50 border border-zinc-200 overflow-hidden flex items-center justify-center text-zinc-400 shrink-0">
                {imageFile ? (
                  <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                ) : currentImageUrl ? (
                  <img src={currentImageUrl} alt="Current" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={24} strokeWidth={1.5} />
                )}
              </div>
              
              <div className="flex-1">
                <input 
                  type="file" 
                  id="product-image-upload"
                  title="Seleccionar imagen principal del producto"
                  accept="image/*" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
                  }}
                  className="block w-full text-xs text-zinc-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-[10px] file:font-bold
                    file:bg-zinc-950 file:text-white
                    hover:file:bg-zinc-800 file:cursor-pointer
                    cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Sección: Galería (Separada y destacada) */}
          {productToEdit && (
            <div className="pt-2">
              <button 
                type="button" 
                onClick={() => setIsGalleryOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-sky-50 border border-sky-100 text-sky-700 rounded-xl font-bold text-xs hover:bg-sky-100 transition-all active:scale-[0.98]"
              >
                <ImageIcon size={16} />
                Gestionar galería de fotos
              </button>
              <p className="text-[10px] text-zinc-400 text-center mt-2">
                Añade más fotos para mostrar diferentes ángulos del producto.
              </p>
            </div>
          )}
        </div>

          <div className="flex gap-3 pt-6 mt-2 border-t border-zinc-100">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 h-14 rounded-xl bg-white border border-zinc-200 text-zinc-600 font-bold text-sm hover:bg-zinc-50 hover:text-zinc-950 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="flex-1 h-14 bg-linear-to-br from-sky-500 to-sky-600 text-white rounded-xl font-bold text-sm hover:from-sky-400 hover:to-sky-500 hover:-translate-y-0.5 shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {submitting ? (
                <><Loader2 size={18} className="animate-spin" /> Guardando...</>
              ) : (
                productToEdit ? 'Actualizar Producto' : 'Guardar Producto'
              )}
            </button>
          </div>
        </form>
        <CategoryModal 
          isOpen={isCategoryModalOpen} 
          onClose={() => setIsCategoryModalOpen(false)} 
          onSuccess={() => {
            fetchCategories(); // Refresca el select
            setIsCategoryModalOpen(false);
          }}
        />
        <GalleryModal 
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSuccess={() => alert('¡Fotos subidas con éxito!')}
        productId={productToEdit?.id}
        />
      </div>
    </div>
  );
}