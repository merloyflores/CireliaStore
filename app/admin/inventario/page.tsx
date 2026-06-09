'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
// Importamos ChevronLeft y ChevronRight para los botones de paginación
import { Settings2, Plus, Trash2, Edit3, Image as ImageIcon, Loader2, LogOut, MessageSquare, Star, X, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProductModal from '../../../components/ProductModal'; 
import ChatHistoryView from '@/components/ChatHistoryView'; 
import ProductFeedbackView from '@/components/ProductFeedbackView';
import SpecManagerModal from '@/components/SpecManagerModal';

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
  
  // ESTADOS ORIGINALES
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]); 
  
  const [activeModal, setActiveModal] = useState<'chats' | 'feedback' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false);
  const [productToEditSpecs, setProductToEditSpecs] = useState<any>(null);

  // ESTADOS PARA FILTROS Y BORRADO MASIVO
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  // ESTADOS PARA PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); 

  useEffect(() => {
    fetchProducts();
    fetchReviews();
    fetchChats(); 
  }, []);

  // Si el usuario busca algo o filtra por categoría, lo devolvemos a la página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

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
      .select(`
        *,
        products (
          name,
          image_url
        )
      `)
      .order('created_at', { ascending: false });
      
    if (!error && data) setReviews(data);
  }

  async function fetchChats() {
    const { data, error } = await supabase
      .from('support_chats')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setChats(data);
    } else if (error) {
      console.error('Error al obtener chats reales:', error.message);
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
      
      if (!error) {
        setSelectedProducts(prev => prev.filter(id => id !== product.id));
        fetchProducts();
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`¿Estás seguro de que deseas eliminar ${selectedProducts.length} productos seleccionados? Esta acción no se puede deshacer.`)) return;

    try {
      const productsToDelete = products.filter(p => selectedProducts.includes(p.id));
      const fileNamesToRemove = productsToDelete
        .map(p => {
          if (p.image_url) {
            const urlParts = p.image_url.split('/');
            return urlParts[urlParts.length - 1];
          }
          return null;
        })
        .filter(Boolean) as string[];

      if (fileNamesToRemove.length > 0) {
        await supabase.storage.from('products').remove(fileNamesToRemove);
      }

      const { error } = await supabase.from('products').delete().in('id', selectedProducts);
      
      if (!error) {
        setSelectedProducts([]); 
        fetchProducts(); 
      }
    } catch (error) {
      console.error('Error al eliminar masivamente:', error);
    }
  };

  const toggleProductSelection = (productId: any) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleLogout = () => {
    document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    router.push('/admin/login');
  };

  const uniqueCategories = Array.from(new Set(products.map(p => p.categories?.name).filter(Boolean)));

  // 1. PRIMERO FILTRAMOS
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || product.categories?.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 2. LUEGO PAGINAMOS LOS RESULTADOS FILTRADOS
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Seleccionar solo los productos visibles en la página actual
  const toggleSelectAll = () => {
    const currentVisibleIds = paginatedProducts.map(p => p.id);
    const areAllVisibleSelected = currentVisibleIds.every(id => selectedProducts.includes(id));

    if (areAllVisibleSelected && currentVisibleIds.length > 0) {
      setSelectedProducts(prev => prev.filter(id => !currentVisibleIds.includes(id)));
    } else {
      const newSelections = currentVisibleIds.filter(id => !selectedProducts.includes(id));
      setSelectedProducts(prev => [...prev, ...newSelections]);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-6 sm:p-10 text-zinc-950">
      
      {/* HEADER DEL DASHBOARD */}
      <div className="flex flex-row max-[1024px]:flex-col justify-between items-center max-[1024px]:items-start gap-4 mb-10 pb-6 border-b border-b-zinc-200">
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

          <div className="h-10 w-px bg-zinc-200 mx-1 hidden sm:block"></div>

          <button 
            onClick={() => openModal()}
            className="flex-1 sm:flex-none bg-zinc-950 text-white px-5 h-12 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-sky-600 transition-all active:scale-95 text-sm shadow-md"
          >
            <Plus size={18} /> Añadir Producto
          </button>

          {/* BOTÓN DE CERRAR SESIÓN AÑADIDO AQUÍ */}
          <button 
            onClick={handleLogout}
            title="Cerrar sesión"
            className="flex-1 sm:flex-none px-4 h-12 rounded-xl font-bold flex items-center justify-center gap-2 border bg-white border-zinc-200 text-zinc-500 hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-all text-sm shadow-sm"
          >
            <LogOut size={16} /> <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA, FILTROS Y ACCIONES MASIVAS */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          
          <div className="relative w-full sm:w-80">
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

          <div className="relative w-full sm:w-64">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
              <Filter size={16} />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-12 pl-10 pr-4 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-950 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-all shadow-sm appearance-none cursor-pointer"
            >
              <option value="">Todas las categorías</option>
              {uniqueCategories.map((category: any, idx) => (
                <option key={idx} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedProducts.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="w-full sm:w-auto px-5 h-12 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all shadow-sm animate-in fade-in"
          >
            <Trash2 size={18} /> 
            Borrar Seleccionados ({selectedProducts.length})
          </button>
        )}
      </div>

      {/* TABLA PRINCIPAL */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-zinc-400 gap-3">
          <Loader2 size={32} className="animate-spin text-zinc-950" />
        </div>
      ) : (
        <>
          <div className="bg-white border border-zinc-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 text-[11px] font-black uppercase tracking-widest">
                    <th className="py-4 pl-6 pr-2 w-12 text-center">
                      <input 
                        type="checkbox"
                        aria-label="Seleccionar todos los productos de esta página"
                        checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedProducts.includes(p.id))}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer accent-zinc-900"
                      />
                    </th>
                    <th className="py-4 px-6">Producto</th>
                    <th className="py-4 px-6 max-[942px]:hidden">Categoría</th>
                    <th className="py-4 px-6 max-[820px]:hidden">Variantes de Color</th>
                    <th className="py-4 px-6 max-[724px]:hidden">Precio</th>
                    <th className="py-4 px-6 max-[590px]:hidden">Stock</th>
                    <th className="py-4 px-6 text-right max-[468px]:px-2">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm font-medium">
                  {paginatedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-zinc-50/50 transition-all">
                      <td className="py-4 pl-6 pr-2 w-12 text-center">
                        <input 
                          type="checkbox"
                          aria-label={`Seleccionar producto ${product.name}`}
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer accent-zinc-900"
                        />
                      </td>

                      <td className="py-4 px-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center text-zinc-400">
                          {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover" /> : <ImageIcon size={18} />}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-950">{product.name}</p>
                          <div 
                            className="text-xs text-zinc-400 line-clamp-1 max-w-xs prose prose-sm **:inline **:m-0"
                            dangerouslySetInnerHTML={{ __html: product.description }} 
                          />
                        </div>
                      </td>
                      
                      <td className="py-4 px-6 text-zinc-500 capitalize max-[942px]:hidden">
                        {product.categories?.name || '-'}
                      </td>

                      <td className="py-4 px-6 max-[820px]:hidden">
                        {product.colors && product.colors.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            {/* APLICADO ORDEN ALFABÉTICO EN LOS COLORES ANTES DE MAPEAR */}
                            {[...product.colors]
                              .sort((a, b) => a.localeCompare(b))
                              .map((colorName: string) => {
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

                      <td className="py-4 px-6 font-bold text-zinc-950 max-[724px]:hidden">₡{product.price?.toLocaleString()}</td>
                      
                      <td className="py-4 px-6 max-[590px]:hidden">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-black ${product.stock > 5 ? 'bg-zinc-100 text-zinc-700' : 'bg-red-50 text-red-600'}`}>
                          {product.stock} unids
                        </span>
                      </td>
                      
                      <td className="py-4 px-6 text-right max-[468px]:px-2">
                        {/* El contenedor ahora se convierte en una mini tarjeta gris unificada en móvil */}
                        <div className="flex justify-end max-[468px]:grid max-[468px]:grid-cols-2 max-[468px]:w-full max-[468px]:bg-zinc-100/80 max-[468px]:p-1.5 max-[468px]:rounded-xl max-[468px]:justify-items-stretch gap-1.5">
                          
                          {/* BOTÓN ESPECIFICACIONES */}
                          <button 
                            onClick={() => {
                              setProductToEditSpecs(product);
                              setIsSpecsModalOpen(true);
                            }}
                            className="p-2 text-zinc-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all flex items-center justify-center max-[468px]:bg-white max-[468px]:text-zinc-600 max-[468px]:shadow-sm max-[468px]:h-9"
                            title="Editar especificaciones"
                          >
                            <Settings2 size={16} />
                          </button>

                          {/* BOTÓN EDITAR */}
                          <button 
                            onClick={() => openModal(product)} 
                            className="p-2 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-all flex items-center justify-center max-[468px]:bg-white max-[468px]:text-zinc-600 max-[468px]:shadow-sm max-[468px]:h-9"
                          >
                            <Edit3 size={16} />
                          </button>
                          
                          {/* BOTÓN ELIMINAR (Ocupa las 2 columnas abajo para cerrar el diseño simétricamente) */}
                          <button 
                            onClick={() => handleDelete(product)} 
                            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex items-center justify-center max-[468px]:bg-white max-[468px]:text-red-500 max-[468px]:shadow-sm max-[468px]:h-9 max-[468px]:col-span-2"
                          >
                            <Trash2 size={16} />
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {/* MENSAJE SI NO HAY RESULTADOS */}
                  {paginatedProducts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-zinc-400">
                        No se encontraron productos con estos filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECCIÓN DE PAGINACIÓN */}
          {filteredProducts.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm">
              
              <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-zinc-500 w-full sm:w-auto text-center sm:text-left">
                <span>
                  Mostrando del <span className="font-bold text-zinc-950">{startIndex + 1}</span> al <span className="font-bold text-zinc-950">{Math.min(startIndex + itemsPerPage, filteredProducts.length)}</span> de <span className="font-bold text-zinc-950">{filteredProducts.length}</span> resultados
                </span>
                
                <div className="h-4 w-px bg-zinc-200 hidden sm:block"></div>
                
                <div className="flex items-center justify-center gap-2">
                  <span className="font-medium">Filas por página:</span>
                  <select 
                    aria-label="Cantidad de filas por página"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1); 
                    }}
                    className="bg-zinc-50 border border-zinc-200 text-zinc-950 font-bold text-sm rounded-lg focus:outline-none focus:border-zinc-400 block p-1.5 cursor-pointer hover:bg-zinc-100 transition-colors"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                
                <div className="flex items-center px-1 gap-1 overflow-x-auto max-w-37.5 sm:max-w-none scrollbar-hide">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-bold transition-all shrink-0 ${
                        currentPage === page 
                          ? 'bg-zinc-950 text-white shadow-md' 
                          : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
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
      {/* MODAL PARA ESPECIFICACIONES */}
      {isSpecsModalOpen && (
        <SpecManagerModal 
          productId={productToEditSpecs?.id} 
          currentSpecs={productToEditSpecs?.specifications} 
          onClose={() => setIsSpecsModalOpen(false)} 
          onSave={() => {
            setIsSpecsModalOpen(false);
            fetchProducts(); // Esto recarga la tabla para ver los cambios reflejados
          }}
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