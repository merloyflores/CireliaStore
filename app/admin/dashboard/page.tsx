'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Trash2, Edit3, Image as ImageIcon, Loader2, LogOut, MessageSquare, Star, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProductModal from '../../../components/ProductModal'; 
import ChatHistoryView from '@/components/ChatHistoryView'; 
import ProductFeedbackView from '@/components/ProductFeedbackView';

const COLOR_MAP: Record<string, string> = {
  // --- TUS METÁLICOS Y VALIOSOS ---
  'dorado': '#D4AF37', 'gold': '#D4AF37',
  'plata': '#C0C0C0', 'plateado': '#E5E7EB', 'silver': '#C0C0C0',
  'oro rosa': '#B76E79', 'rose gold': '#B76E79',
  'bronce': '#CD7F32', 'bronze': '#CD7F32',
  'cobre': '#B87333', 'copper': '#B87333',

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

  // --- PALETA CÁLIDA, MUEBLES Y TEXTILES ---
  'marrón': '#78350F', 'brown': '#78350F', 'cafe': '#78350F', 'café': '#78350F',
  'chocolate': '#451A03',
  'mostaza': '#CA8A04', 'mustard': '#CA8A04',
  'ocre': '#C68E17', 'ochre': '#C68E17',
  'vino': '#7F1D1D', 'burgundy': '#7F1D1D', 'burdeos': '#7F1D1D',
  'coral': '#F87171',
  'salmón': '#FA8072', 'salmon': '#FA8072',
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
  'lila': '#F3E8FF', 'lilac': '#F3E8FF'
};

export default function AdminDashboard() {
  const router = useRouter();
  
  // ESTADOS
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]); // Estado listo
  
  const [activeModal, setActiveModal] = useState<'chats' | 'feedback' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
    fetchReviews();
    fetchChats(); // <-- ACTIVADO: Llama a los chats reales al cargar
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, categories:category_id(name)')
      .order('id', { ascending: false });
      
    if (!error && data) setProducts(data);
    setLoading(false);
  }

  async function fetchReviews() {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) setReviews(data);
  }

  // NUEVA FUNCIÓN: Trae las interacciones reales de la tabla 'chats'
  async function fetchChats() {
    const { data, error } = await supabase
      .from('support_chats')
      .select('*')
      .order('created_at', { ascending: false });
      
    // ESTOS LOGS TE DIRÁN LA VERDAD EN LA CONSOLA DEL NAVEGADOR (F12)
    console.log("¿Qué trae data de chats?:", data);
    console.log("¿Hay algún error oculto?:", error);

    if (!error && data) {
      setChats(data);
    } else if (error) {
      console.error('Error al obtener chats reales de support_chats:', error.message, error.code);
    }
  }

  const handleSuccess = () => {
    setTimeout(fetchProducts, 500);
  };
  
  const openModal = (product: any = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (product: any) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${product.name}"?`)) return;

    try {
      if (product.image_url) {
        const urlParts = product.image_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        if (fileName) await supabase.storage.from('products').remove([fileName]);
      }
      const { error } = await supabase.from('products').delete().eq('id', product.id);
      if (!error) fetchProducts();
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  const handleLogout = () => {
    document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    router.push('/admin/login');
  };

  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-50 p-6 sm:p-10 text-zinc-950">
      
      {/* HEADER DEL DASHBOARD */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-b-zinc-200">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Panel de Control</h1>
          <p className="text-zinc-500 text-sm font-medium">Gestiona el inventario oficial de Cirelia Store</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setActiveModal('chats')}
            className="flex-1 sm:flex-none px-4 h-12 rounded-xl font-bold flex items-center justify-center gap-2 border bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 transition-all text-sm shadow-sm"
          >
            <MessageSquare size={16} /> Chats
          </button>

          <button 
            onClick={() => setActiveModal('feedback')}
            className="flex-1 sm:flex-none px-4 h-12 rounded-xl font-bold flex items-center justify-center gap-2 border bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 transition-all text-sm shadow-sm"
          >
            <Star size={16} /> Feedback
          </button>

          <div className="h-10 w-px bg-zinc-200 mx-2 hidden sm:block"></div>

          <button 
            onClick={() => openModal()}
            className="flex-1 sm:flex-none bg-zinc-950 text-white px-5 h-12 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-sky-600 transition-all active:scale-95 text-sm shadow-md"
          >
            <Plus size={18} /> Añadir Producto
          </button>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="mb-6 max-w-md">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar producto por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-4 pr-10 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-950 placeholder-zinc-400 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-all shadow-sm"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 hover:text-zinc-950"
            >
              Borrar
            </button>
          )}
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-zinc-400 gap-3">
          <Loader2 size={32} className="animate-spin text-zinc-950" />
        </div>
      ) : (
        <div className="bg-white border border-zinc-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 text-[11px] font-black uppercase tracking-widest">
                  <th className="py-4 px-6">Producto</th>
                  <th className="py-4 px-6">Categoría</th>
                  <th className="py-4 px-6 hidden lg:table-cell">Variantes de Color</th>
                  <th className="py-4 px-6">Precio</th>
                  <th className="py-4 px-6">Stock</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm font-medium">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-zinc-50/50 transition-all">
                    <td className="py-4 px-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center text-zinc-400">
                        {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover" /> : <ImageIcon size={18} />}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-950">{product.name}</p>
                        <p className="text-xs text-zinc-400 line-clamp-1 max-w-xs">{product.description}</p>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6 text-zinc-500 capitalize">
                      {product.categories?.name || '-'}
                    </td>

                    <td className="py-4 px-6 hidden lg:table-cell">
                      {product.colors && product.colors.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          {product.colors.map((colorName: string) => {
                            const cleanKey = colorName.trim().toLowerCase();
                            const hexColor = COLOR_MAP[cleanKey] || '#D1D5DB'; 
                            return (
                              <div
                                key={colorName}
                                title={colorName}
                                className="w-4 h-4 rounded-full border border-zinc-300 shadow-sm shrink-0"
                                style={{ backgroundColor: hexColor }}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-zinc-300 text-xs italic">Sin variantes</span>
                      )}
                    </td>

                    <td className="py-4 px-6 font-bold text-zinc-950">₡{product.price?.toLocaleString()}</td>
                    
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-black ${product.stock > 5 ? 'bg-zinc-100 text-zinc-700' : 'bg-red-50 text-red-600'}`}>
                        {product.stock} unids
                      </span>
                    </td>
                    
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openModal(product)} className="p-2 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-all">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => handleDelete(product)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL PARA AÑADIR/EDITAR PRODUCTO */}
      {isModalOpen && (
        <ProductModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={handleSuccess} 
          productToEdit={editingProduct} 
        />
      )}

      {/* MODAL EMERGENTE GENERAL */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setActiveModal(null)} 
          />
          
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-zinc-100 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-100">
              <h2 className="text-sm font-black text-zinc-950 uppercase tracking-widest">
                {activeModal === 'chats' ? 'Historial de Interacciones' : 'Comentarios de Productos'}
              </h2>
              <button 
                onClick={() => setActiveModal(null)} 
                className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400 hover:text-zinc-900"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-zinc-50/50 rounded-b-3xl">
              {activeModal === 'chats' ? (
                <ChatHistoryView chats={chats} />
              ) : (
                <ProductFeedbackView feedbacks={reviews} />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}