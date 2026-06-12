'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import { 
  Image as ImageIcon, 
  Loader2, 
  X, 
  Type, 
  DollarSign, 
  Package, 
  Tag, 
  AlignLeft, 
  Plus,
  Percent,
  Ruler,
  Palette, Bold, Italic, List, ListOrdered, Underline as UnderlineIcon
} from 'lucide-react';
import CategoryModal from './CategoryModal';
import GalleryModal from './GalleryModal';
import Underline from '@tiptap/extension-underline';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productToEdit: any | null;
}

const COLOR_MAP: Record<string, string> = {
  // --- TUS METÁLICOS Y VALIOSOS ---
  'dorado': '#D4AF37', 'gold': '#D4AF37',
  'plata': '#C0C0C0', 'plateado': '#E5E7EB', 'silver': '#C0C0C0',
  'oro rosa': '#B76E79', 'rose gold': '#B76E79',
  'bronce': '#CD7F32', 'bronze': '#CD7F32',
  'cobre': '#B87333', 'copper': '#B87333',
  'champagne': '#F7E7CE',

  // --- LOS MINIMALISTAS DE FÁBRICA ---
  'crudo': '#FDFBF7', 'raw': '#FDFBF7',
  'arena': '#E6D5C3', 'sand': '#E6D5C3',
  'terracota': '#C86A4B', 'terracotta': '#C86A4B',
  'oliva': '#707A5A', 'olive': '#707A5A',
  'carbón': '#2C2C2C', 'charcoal': '#2C2C2C',

  // --- MONOCROMÁTICOS Y NEUTROS PRO ---
  'negro': '#09090b', 'black': '#000000',
  'blanco': '#ffffff', 'white': '#ffffff',
  'gris': '#71717A', 'gray': '#71717A', 'grey': '#71717A',
  'grafito': '#3F3F46', 'graphite': '#3F3F46',
  'crema': '#FFFDD0', 'cream': '#FFFDD0',
  'marfil': '#FFFFF0', 'ivory': '#FFFFF0',
  'beige': '#F5F5DC', 'taupe': '#483C32',

  // --- TONOS VIVOS E INTENSOS ---
  'rojo': '#EF4444', 'red': '#EF4444',
  'azul': '#3B82F6', 'blue': '#3B82F6',
  'verde': '#22C55E', 'green': '#22C55E',
  'rosado': '#F472B6', 'pink': '#F472B6',
  'naranja': '#F97316', 'orange': '#F97316',
  'amarillo': '#EAB308', 'yellow': '#EAB308',
  'púrpura': '#A855F7', 'purple': '#A855F7', 'morado': '#8B5CF6',
  'ciruela': '#8E4585', 'plum': '#8E4585',

  // --- PALETA CÁLIDA, MUEBLES Y TEXTILES ---
  'marrón': '#78350F', 'brown': '#78350F', 'cafe': '#78350F', 'café': '#78350F',
  'chocolate': '#451A03',
  'mostaza': '#CA8A04', 'mustard': '#CA8A04',
  'ocre': '#C68E17', 'ochre': '#C68E17',
  'vino': '#7F1D1D', 'burgundy': '#7F1D1D', 'burdeos': '#7F1D1D',
  'coral': '#F87171',
  'salmón': '#FA8072', 'salmon': '#FA8072',
  'durazno': '#FFDAB9', 'peach': '#FFDAB9',
  'fucsia': '#D946EF', 'fuchsia': '#D946EF',

  // --- PALETA BOTÁNICA, NÓRDICA Y OCÉANO ---
  'esmeralda': '#047857', 'emerald': '#047857',
  'menta': '#A7F3D0', 'mint': '#A7F3D0',
  'turquesa': '#06B6D4', 'turquoise': '#06B6D4',
  'celeste': '#BAE6FD', 'sky blue': '#BAE6FD',
  'marino': '#1E3A8A', 'navy': '#1E3A8A',
  'azul marino': '#1E3A8A',
  'índigo': '#4338CA', 'indigo': '#4338CA',
  'lavanda': '#E9D5FF', 'lavender': '#E9D5FF',
  'lila': '#F3E8FF', 'lilac': '#F3E8FF',
  'musgo': '#8A9A5B', 'moss': '#8A9A5B',
  'salvia': '#9DC183', 'sage': '#9DC183',
  'bosque': '#228B22', 'forest': '#228B22',
  'denim': '#1560BD'
};

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const buttons = [
    { name: 'bold', icon: <Bold size={14} />, action: () => editor.chain().focus().toggleBold().run() },
    { name: 'italic', icon: <Italic size={14} />, action: () => editor.chain().focus().toggleItalic().run() },
    { name: 'underline', icon: <UnderlineIcon size={14} />, action: () => editor.chain().focus().toggleUnderline().run() },
    { name: 'bulletList', icon: <List size={14} />, action: () => editor.chain().focus().toggleBulletList().run() },
    { name: 'orderedList', icon: <ListOrdered size={14} />, action: () => editor.chain().focus().toggleOrderedList().run() },
  ];

  return (
    <div className="flex gap-1 p-2 border-b border-zinc-200 bg-zinc-50 rounded-t-2xl">
      {buttons.map((btn) => (
        <button
          key={btn.name}
          type="button"
          onClick={btn.action}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive(btn.name) 
              ? 'bg-zinc-200 text-zinc-900' 
              : 'text-zinc-500 hover:bg-zinc-200'
          }`}
        >
          {btn.icon}
        </button>
      ))}
    </div>
  );
};


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
  const [colors, setColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState('');
  const [isExpress, setIsExpress] = useState(productToEdit?.is_express || false);

  

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: description,
    onUpdate: ({ editor }) => {
      setDescription(editor.getHTML());
    },
  }); 
  
  const fetchCategories = async () => {
    const { data: catData } = await supabase.from('categories').select('id, name');
    if (catData) setCategories(catData);
  };

  // Estados para Promociones
  const [isPromoActive, setIsPromoActive] = useState(false);
  const [promoPrice, setPromoPrice] = useState('');


  // Estados para Tallas / Medidas Inteligentes
  const [sizes, setSizes] = useState<string[]>([]);
  const [sizeInput, setSizeInput] = useState('');

  const handleAddSize = (val: string) => {
    const trimmed = val.trim().toUpperCase(); // Lo pasamos a mayúscula para que se vea estandarizado (S, M, L)
    if (trimmed && !sizes.includes(trimmed)) {
      setSizes([...sizes, trimmed]);
      setSizeInput('');
    }
  };

  const [activeSizeSegment, setActiveSizeSegment] = useState('vestir');

  const handleRemoveSize = (indexToRemove: number) => {
    setSizes(sizes.filter((_, i) => i !== indexToRemove));
  };

  useEffect(() => {
    async function loadInitialData() {
      const { data: catData } = await supabase.from('categories').select('id, name');
      if (catData) setCategories(catData);
    
      if (isOpen) {
        if (productToEdit) {
          setName(productToEdit.name || '');
          setPrice(productToEdit.price?.toString() || '');
          setDescription(productToEdit.description || ''); 
          setStock(productToEdit.stock?.toString() || '10');
          setCategoryId(productToEdit.category_id || ''); 
          setCurrentImageUrl(productToEdit.image_url || '');
          
          // --- AQUÍ INSERTAS EL CÓDIGO DE TALLAS Y PROMOS ---
          setSizes(productToEdit.sizes || []);
          setIsPromoActive(!!productToEdit.is_promo);
          setPromoPrice(productToEdit.promo_price?.toString() || '');
          setIsExpress(productToEdit.is_express || false);

          if (productToEdit.colors) {
            if (Array.isArray(productToEdit.colors)) {
              setColors(productToEdit.colors);
            } else if (typeof productToEdit.colors === 'string') {
              try {
                const parsed = JSON.parse(productToEdit.colors);
                setColors(Array.isArray(parsed) ? parsed : [productToEdit.colors]);
              } catch {
                setColors(productToEdit.colors.split(',').map((c: string) => c.trim()).filter(Boolean));
              }
            }
          } else {
            setColors([]);
          }
        } else {
          // --- ESTO ES IMPORTANTE: Resetear al crear uno nuevo ---
          setName('');
          setPrice('');
          setDescription('');
          setStock('10');
          setCategoryId('');
          setCurrentImageUrl('');
          setColors([]);
          setSizes([]);           // Reset
          setIsPromoActive(false); // Reset
          setPromoPrice('');
          setIsExpress(false);       // Reset
        }
        setImageFile(null);
        setColorInput('');
      }
    }
    
    loadInitialData();
  }, [isOpen, productToEdit]);

  useEffect(() => {
    if (editor && description !== editor.getHTML()) {
      editor.commands.setContent(description);
    }
  }, [description, editor]);

  if (!isOpen) return null;

  const handleAddColor = (colorStr: string) => {
    const trimmed = colorStr.trim();
    if (trimmed && !colors.includes(trimmed)) {
      setColors([...colors, trimmed]);
      setColorInput('');
    }
  };

  const handleRemoveColor = (indexToRemove: number) => {
    setColors(colors.filter((_, i) => i !== indexToRemove));
  };

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
      
      // Solo subimos a storage si el usuario seleccionó un archivo nuevo
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
        image_url: finalImageUrl,
        colors: colors,
        sizes: sizes,
        is_express: isExpress,
        is_promo: isPromoActive,
        promo_price: isPromoActive && promoPrice ? parseFloat(promoPrice) : null
      };

      let productId = productToEdit?.id;

      if (productToEdit) {
        // Actualizar producto
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productToEdit.id);
        
        if (error) throw error;
        
        // Si se subió una imagen nueva, actualizamos también la tabla de media
        if (imageFile && finalImageUrl) {
          await supabase
            .from('product_media')
            .upsert({ 
              product_id: productId, 
              url: finalImageUrl, 
              media_type: 'image' 
            });
        }
      } else {
        // Crear nuevo producto
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select('id')
          .single();
          
        if (error) throw error;
        productId = data.id;

        // Registrar en media solo al crear por primera vez
        if (finalImageUrl) {
          await supabase
            .from('product_media')
            .insert({
              product_id: productId,
              url: finalImageUrl,
              media_type: 'image'
            });
        }
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
      {/* MODIFICADO: Ajustado el max-w para acomodar 3 columnas elegantes (max-w-6xl y xl:max-w-[1200px]) */}
      <div className="bg-white w-full max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-[1200px] rounded-3xl sm:rounded-4xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-zinc-100 p-4 sm:p-8 relative animate-in zoom-in-95 fade-in duration-300 max-h-[92vh] sm:max-h-[95vh] overflow-y-auto custom-scrollbar">
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-zinc-50 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 hover:rotate-90 rounded-full transition-all duration-300 z-10"
          title="Cerrar ventana"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-black text-zinc-950 tracking-tight">
            {productToEdit ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <p className="text-xs text-zinc-400 font-medium mt-1">
            {productToEdit ? 'Modifica los detalles de tu inventario.' : 'Añade un nuevo artículo al catálogo de Cirelia.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* DISTRIBUCIÓN GRID EN ESCRITORIO: 3 Columnas Balanceadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
            
            {/* COLUMNA 1: Identidad e Inventario básico */}
            <div className="space-y-5">
              
              {/* NOMBRE DEL PRODUCTO */}
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Nombre del Producto</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Type className="h-4 w-4 text-zinc-400" />
                  </div>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full h-12 bg-zinc-50/50 border border-zinc-200 rounded-xl pl-11 pr-4 font-medium focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all text-sm" placeholder="Ej. Zapatillas Urbanas, Rodillera Pro..." />
                </div>
              </div>

              {/* CATEGORÍA */}
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
                    className="h-12 w-12 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 rounded-xl text-zinc-600 transition-all active:scale-95"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {/* PRECIO Y STOCK */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Precio Regular (₡)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-sm font-black text-zinc-400 select-none">₡</span>
                    </div>
                    <input 
                      type="number" 
                      value={price} 
                      onChange={(e) => setPrice(e.target.value)} 
                      required 
                      className={`w-full h-12 bg-zinc-50/50 border border-zinc-200 rounded-xl pl-11 pr-4 font-medium focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all text-sm ${isPromoActive ? 'line-through text-zinc-400' : 'text-zinc-900'}`} 
                      placeholder="18000" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Stock Total</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Package className="h-4 w-4 text-zinc-400" />
                    </div>
                    <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required className="w-full h-12 bg-zinc-50/50 border border-zinc-200 rounded-xl pl-11 pr-4 font-medium focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all text-sm" placeholder="10" />
                  </div>
                </div>
              </div>

              {/* MÓDULO INTELIGENTE DE PROMOCIÓN */}
              <div className={`p-4 rounded-2xl border transition-all duration-300 ${isPromoActive ? 'bg-sky-50/50 border-sky-200' : 'bg-zinc-50/50 border-zinc-200'}`}>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 cursor-pointer" onClick={() => setIsPromoActive(!isPromoActive)}>
                    <Percent size={14} className={isPromoActive ? 'text-sky-500' : ''} />
                    Activar Promoción Especial
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPromoActive(!isPromoActive)}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${isPromoActive ? 'bg-sky-500' : 'bg-zinc-300'}`}
                  >
                    <span className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-300 ${isPromoActive ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
                
                {isPromoActive && (
                  <div className="mt-4 relative animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-sm font-black text-sky-600 select-none">₡</span>
                    </div>
                    <input 
                      type="number" 
                      value={promoPrice} 
                      onChange={(e) => setPromoPrice(e.target.value)} 
                      required={isPromoActive}
                      className="w-full h-11 bg-white border border-sky-300 rounded-xl pl-11 pr-4 font-bold text-sky-700 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 transition-all text-sm placeholder:text-sky-300 shadow-sm shadow-sky-100" 
                      placeholder="Precio de oferta..." 
                    />
                  </div>
                )}
              </div>

              {/* MÓDULO INTELIGENTE DE TALLAS / MEDIDAS (MEGA LÍNEA COMPRIMIDA) */}
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Ruler size={14} />
                  Tallas o Medidas (Opcional)
                </label>
                <div className="p-3.5 bg-zinc-50/50 border border-zinc-200 rounded-2xl space-y-3">
                  
                  {/* Fila superior: Selector de Tipo + Input manual rápido */}
                  <div className="grid grid-cols-12 gap-2">
                    <select
                      value={activeSizeSegment}
                      onChange={(e) => setActiveSizeSegment(e.target.value)}
                      className="col-span-5 h-9 bg-white border border-zinc-200 rounded-xl px-2 text-[11px] font-bold text-zinc-700 focus:outline-none focus:border-sky-500 appearance-none cursor-pointer"
                    >
                      <optgroup label="Moda y Textil">
                        <option value="vestir">👕 Ropa Adulto</option>
                        <option value="calzado">👟 Calzado Adulto</option>
                        <option value="infantil_ropa">👶 Ropa Infantil</option>
                        <option value="infantil_calzado">🍼 Calzado Infantil</option>
                        <option value="interior_lenceria">👙 Ropa Interior</option>
                        <option value="joyeria_relojes">💍 Joyería y Relojes</option>
                      </optgroup>
                      <optgroup label="Salud y Deporte">
                        <option value="ortopedia">🏥 Ortopedia</option>
                        <option value="deporte_fitness">🏋️‍♂️ Equipamiento Deportivo</option>
                      </optgroup>
                      <optgroup label="Hogar y Vida">
                        <option value="hogar_textil">🛏️ Textiles y Camas</option>
                        <option value="hogar_muebles">🪑 Mobiliario</option>
                        <option value="cocina_comedor">🍽️ Vajilla y Cocina</option>
                      </optgroup>
                      <optgroup label="Tecnología y Misceláneos">
                        <option value="tecnologia_acc">🔌 Tecnología y Accesorios</option>
                        <option value="ferreteria_herramientas">🔧 Ferretería</option>
                        <option value="belleza_cosmeticos">✨ Belleza y Cosméticos</option>
                      </optgroup>
                    </select>

                    <div className="col-span-7 flex gap-1">
                      <input 
                        type="text"
                        value={sizeInput}
                        onChange={(e) => setSizeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSize(sizeInput);
                          }
                        }}
                        className="w-full h-9 bg-white border border-zinc-200 rounded-xl px-2.5 text-[11px] font-medium focus:outline-none focus:border-sky-500 uppercase placeholder:normal-case" 
                        placeholder="Otra medida..." 
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSize(sizeInput)}
                        className="h-9 px-2.5 bg-zinc-950 text-white rounded-xl text-[11px] font-black hover:bg-zinc-800 transition-all active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Renderizado Condicional Inteligente (Solo ocupa 1 línea de altura con scroll interno) */}
                  <div className="bg-white border border-zinc-200/60 p-2 rounded-xl">
                    
                    {/* MODA Y TEXTIL */}
                    {activeSizeSegment === 'vestir' && (
                      <div className="flex flex-wrap gap-1 items-center justify-between">
                        <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar">
                          {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Unitalla'].map((p) => (
                            <button key={p} type="button" onClick={() => handleAddSize(p)} className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 px-2 py-0.5 rounded-md cursor-pointer">{p}</button>
                          ))}
                        </div>
                        <button type="button" onClick={() => ['XS', 'S', 'M', 'L', 'XL'].forEach(t => handleAddSize(t))} className="text-[9px] font-black text-sky-600 hover:text-sky-700 whitespace-nowrap px-1">Set completo</button>
                      </div>
                    )}

                    {activeSizeSegment === 'calzado' && (
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar">
                        {['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'].map((p) => (
                          <button key={p} type="button" onClick={() => handleAddSize(p)} className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 px-2 py-0.5 rounded-md cursor-pointer">{p}</button>
                        ))}
                      </div>
                    )}

                    {activeSizeSegment === 'infantil_ropa' && (
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar">
                        {['0-3M', '3-6M', '6-12M', '12-18M', '2T', '3T', '4T', 'Talla 6', 'Talla 8', 'Talla 10'].map((p) => (
                          <button key={p} type="button" onClick={() => handleAddSize(p)} className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 px-2 py-0.5 rounded-md cursor-pointer">{p}</button>
                        ))}
                      </div>
                    )}

                    {activeSizeSegment === 'infantil_calzado' && (
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar">
                        {['16', '18', '20', '22', '24', '26', '28', '30', '32', '34'].map((p) => (
                          <button key={p} type="button" onClick={() => handleAddSize(p)} className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 px-2 py-0.5 rounded-md cursor-pointer">{p}</button>
                        ))}
                      </div>
                    )}

                    {activeSizeSegment === 'interior_lenceria' && (
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar">
                        {['32A', '32B', '34B', '34C', '36C', '36D', 'Boxer S', 'Boxer M', 'Boxer L'].map((p) => (
                          <button key={p} type="button" onClick={() => handleAddSize(p)} className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 px-2 py-0.5 rounded-md cursor-pointer">{p}</button>
                        ))}
                      </div>
                    )}

                    {activeSizeSegment === 'joyeria_relojes' && (
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar">
                        {['Talla 6', 'Talla 7', 'Talla 8', 'Talla 9', '38mm', '40mm', '42mm', '44mm'].map((p) => (
                          <button key={p} type="button" onClick={() => handleAddSize(p)} className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 px-2 py-0.5 rounded-md cursor-pointer">{p}</button>
                        ))}
                      </div>
                    )}

                    {/* SALUD Y DEPORTE */}
                    {activeSizeSegment === 'ortopedia' && (
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar">
                        {['Estándar', 'Pediátrica', 'Muslo Ancho', 'Ajustable', '20-25 cm', '26-30 cm', '31-35 cm'].map((p) => (
                          <button key={p} type="button" onClick={() => handleAddSize(p)} className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 px-2 py-0.5 rounded-md cursor-pointer">{p}</button>
                        ))}
                      </div>
                    )}

                    {activeSizeSegment === 'deporte_fitness' && (
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar">
                        {['5 lb', '10 lb', '15 lb', '20 lb', 'Suave', 'Media', 'Fuerte'].map((p) => (
                          <button key={p} type="button" onClick={() => handleAddSize(p)} className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 px-2 py-0.5 rounded-md cursor-pointer">{p}</button>
                        ))}
                      </div>
                    )}

                    {/* HOGAR Y VIDA */}
                    {activeSizeSegment === 'hogar_textil' && (
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar">
                        {['Twin', 'Full', 'Queen', 'King', 'California King', '140x220cm'].map((p) => (
                          <button key={p} type="button" onClick={() => handleAddSize(p)} className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 px-2 py-0.5 rounded-md cursor-pointer">{p}</button>
                        ))}
                      </div>
                    )}

                    {activeSizeSegment === 'hogar_muebles' && (
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar">
                        {['Pequeño', 'Mediano', 'Grande', 'Extra Grande'].map((p) => (
                          <button key={p} type="button" onClick={() => handleAddSize(p)} className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 px-2 py-0.5 rounded-md cursor-pointer">{p}</button>
                        ))}
                      </div>
                    )}

                    {activeSizeSegment === 'cocina_comedor' && (
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar">
                        {['11oz', '15oz', '500ml', '1 Litro', '4 piezas', '12 piezas'].map((p) => (
                          <button key={p} type="button" onClick={() => handleAddSize(p)} className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 px-2 py-0.5 rounded-md cursor-pointer">{p}</button>
                        ))}
                      </div>
                    )}

                    {/* TECNOLOGÍA Y MISC */}
                    {activeSizeSegment === 'tecnologia_acc' && (
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar">
                        {['13"', '14"', '15.6"', '1m', '2m', 'Funda Estándar', 'Pro', 'Pro Max'].map((p) => (
                          <button key={p} type="button" onClick={() => handleAddSize(p)} className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 px-2 py-0.5 rounded-md cursor-pointer">{p}</button>
                        ))}
                      </div>
                    )}

                    {activeSizeSegment === 'ferreteria_herramientas' && (
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar">
                        {['1/4"', '1/2"', '3/4"', '8mm', '10mm', '12mm'].map((p) => (
                          <button key={p} type="button" onClick={() => handleAddSize(p)} className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 px-2 py-0.5 rounded-md cursor-pointer">{p}</button>
                        ))}
                      </div>
                    )}

                    {activeSizeSegment === 'belleza_cosmeticos' && (
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar">
                        {['15ml', '30ml', '50ml', '100ml', '250ml', '500ml'].map((p) => (
                          <button key={p} type="button" onClick={() => handleAddSize(p)} className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 px-2 py-0.5 rounded-md cursor-pointer">{p}</button>
                        ))}
                      </div>
                    )}
                    
                  </div>

                  {/* CHIPS SELECCIONADOS */}
                  {sizes.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2 border-t border-zinc-200/60 max-h-20 overflow-y-auto custom-scrollbar">
                      {sizes.map((size, index) => (
                        <div 
                          key={index}
                          className="flex items-center gap-1 bg-zinc-900 text-white pl-2 pr-0.5 py-0.5 rounded-md text-[10px] font-black shadow-xs animate-in zoom-in-95 duration-150"
                        >
                          <span>{size}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSize(index)}
                            className="p-0.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <X size={10} strokeWidth={3} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                </div>
              </div>

            </div>

            {/* COLUMNA 2: Estética y Multimedia */}
            <div className="space-y-5">
              {/* Sección Variantes de Color */}
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Variantes de Color</label>
                <div className="p-4 bg-zinc-50/50 border border-zinc-200 rounded-2xl space-y-3">
                  {/* Selector / Input manual */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Palette className="h-4 w-4 text-zinc-400" />
                      </div>
                      <input 
                        type="text"
                        value={colorInput}
                        onChange={(e) => setColorInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddColor(colorInput);
                          }
                        }}
                        className="w-full h-10 bg-white border border-zinc-200 rounded-xl pl-10 pr-3 font-medium focus:outline-none focus:border-sky-500 text-xs" 
                        placeholder="Ej. Terracota, Arena, #E2725B..." 
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddColor(colorInput)}
                      className="h-10 px-3 bg-zinc-950 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all active:scale-95"
                    >
                      Añadir
                    </button>
                  </div>

                  {/* Sugerencias rápidas */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">
                      Paleta Base Disponible:
                    </span>
                    <div className="max-h-27.5 overflow-y-auto pr-1 flex flex-wrap gap-1.5 items-start scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent">
                      {(() => {
                        const vistasUnicas: string[] = [];
                        const coloresFiltrados = Object.keys(COLOR_MAP).filter((name) => {
                          const hex = COLOR_MAP[name];
                          if (!vistasUnicas.includes(hex)) {
                            vistasUnicas.push(hex);
                            return true;
                          }
                          return false;
                        });

                        return coloresFiltrados.map((colorKey) => {
                          const hexColor = COLOR_MAP[colorKey];
                          return (
                            <button
                              key={colorKey}
                              type="button"
                              onClick={() => handleAddColor(colorKey)}
                              className="text-[10px] font-semibold text-zinc-600 bg-white border border-zinc-200 px-2 py-1 rounded-lg hover:border-zinc-400 transition-all flex items-center gap-1.5 shadow-xs capitalize cursor-pointer active:scale-95"
                            >
                              <span 
                                className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" 
                                style={{ backgroundColor: hexColor }} 
                              />
                              {colorKey}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Chips Seleccionados */}
                  {colors.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-200/60">
                      {colors.map((color, index) => {
                        const isHex = color.startsWith('#');
                        return (
                          <div 
                            key={index}
                            className="flex items-center gap-1.5 bg-white border border-zinc-200 pl-2 pr-1 py-1 rounded-lg text-[11px] font-bold text-zinc-800 shadow-xs animate-in zoom-in-95 duration-150"
                          >
                            <span 
                              className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" 
                              style={{ backgroundColor: isHex ? color : '#E4E4E7' }} 
                            />
                            <span>{color}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveColor(index)}
                              className="p-0.5 hover:bg-zinc-100 rounded text-zinc-400 hover:text-zinc-950 transition-colors"
                            >
                              <X size={12} strokeWidth={2.5} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-400 italic pt-1 text-center">Sin variantes de color especificadas.</p>
                  )}
                </div>
              </div>

              {/* Sección Fotografía */}
              <div className="space-y-4">
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
                        title="Subir imagen principal del producto"
                        placeholder="Seleccionar archivo"
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

                {productToEdit && (
                  <div className="pt-1">
                    <button 
                      type="button" 
                      onClick={() => setIsGalleryOpen(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-sky-50 border border-sky-100 text-sky-700 rounded-xl font-bold text-xs hover:bg-sky-100 transition-all active:scale-[0.98]"
                    >
                      <ImageIcon size={16} />
                      Gestionar galería de fotos
                    </button>
                  </div>
                )}
              </div>

              {/* NUEVO: Toggle Express al final */}
              <div className="flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                <div>
                  <label className="text-xs font-bold text-zinc-900 block">Envío Express</label>
                  <p className="text-[10px] text-zinc-400">Activar para entrega prioritaria</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExpress(!isExpress)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${isExpress ? 'bg-emerald-600' : 'bg-zinc-200'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isExpress ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* COLUMNA 3: Detalles (Descripción con mucho espacio) */}
            <div className="space-y-5 h-full">
              <div className="space-y-1.5 h-full flex flex-col">
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  Descripción
                </label>
                
                {/* MODIFICADO: Aumentada la altura mínima (min-h) para aprovechar el espacio de las 3 columnas */}
                <div className="border border-zinc-200 rounded-2xl bg-white overflow-hidden shadow-sm flex flex-col flex-1">
                  <MenuBar editor={editor} />
                  
                  <div className="relative flex-1">
                    <div className="absolute top-3 left-3 pointer-events-none z-10">
                      <AlignLeft className="h-4 w-4 text-zinc-400" />
                    </div>
                    
                    <div className="min-h-[250px] lg:min-h-[380px] max-h-[450px] overflow-y-auto">
                      <EditorContent
                        editor={editor}
                        className="prose prose-sm max-w-none p-3 pl-10 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ACCIONES DEL FORMULARIO */}
          <div className="flex gap-3 pt-6 mt-4 border-t border-zinc-100">
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
            fetchCategories(); 
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