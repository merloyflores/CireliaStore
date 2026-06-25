import { useState, useEffect } from 'react';
import { Search, X, Check, Loader2, Filter, ImageIcon, Plus, Minus } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  discountAmount: number;
  hasOffer: boolean; // Asegúrate de que esta línea exista
  stock: number;
  category: string;
  image?: string;
  quantity?: number;
}

interface ProductSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProducts: (products: Product[]) => void;
}

export default function ProductSelectorModal({ isOpen, onClose, onAddProducts }: ProductSelectorModalProps) {
  // Estados de carga e inventario
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estados de Filtrado y Búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Estado de Selección Múltiple
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  // 1. Cargar productos desde Supabase usando el esquema real
  useEffect(() => {
    if (!isOpen) return;

    const fetchInventory = async () => {
      try {
        setLoading(true);
        
        // Consulta exacta: image_url y JOIN con la tabla categories para el nombre
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, promo_price, stock, image_url, categories(name)')
          .order('name', { ascending: true });

        if (error) {
          console.error('Error de Supabase:', error.message, error.details);
          throw error;
        }

        if (data) {
          const formattedProducts = data.map((p: any) => {
            const hasOffer = p.promo_price && p.promo_price > 0 && p.promo_price < p.price;
            const discount = hasOffer ? (p.price - p.promo_price) : 0;

            return {
              id: p.id,
              name: p.name,
              price: hasOffer ? p.promo_price : p.price,
              originalPrice: p.price,
              discountAmount: discount,
              // ¡AQUÍ ESTABA EL PROBLEMA, ESTA LÍNEA FALTABA!
              hasOffer: hasOffer, 
              stock: p.stock || 0,
              image: p.image_url,
              category: p.categories?.name || 'General'
            };
          });

          setProducts(formattedProducts);
          
          const uniqueCategories = Array.from(
            new Set(formattedProducts.map((p) => p.category).filter(Boolean))
          );
          setCategories(uniqueCategories);
        }
      } catch (err: any) {
        console.error('❌ Error de conexión con productos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
    
    // Limpiar estados al abrir el modal
    setSelectedProducts([]);
    setSearchTerm('');
    setSelectedCategory('all');
    setShowFilterMenu(false);
  }, [isOpen]);

  if (!isOpen) return null;

  // 2. Controladores de Selección Múltiple y Cantidad
  const updateQuantity = (product: Product, delta: number) => {
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.id === product.id);
      
      if (!existing) {
        return [...prev, { ...product, quantity: 1 }];
      }

      const newQuantity = (existing.quantity || 1) + delta;

      if (newQuantity <= 0) {
        return prev.filter(p => p.id !== product.id);
      }

      if (newQuantity > product.stock) return prev;

      return prev.map(p => p.id === product.id ? { ...p, quantity: newQuantity } : p);
    });
  };

  const handleConfirmSelection = () => {
    if (selectedProducts.length > 0) {
      onAddProducts(selectedProducts);
      onClose();
    }
  };

  // 3. Procesar filtros en memoria
  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = product.name?.toLowerCase().includes(searchLower) || 
                          product.category?.toLowerCase().includes(searchLower);
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center rounded-3xl justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-2xl rounded-t-[2.5rem] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
        {/* HEADER */}
        <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50 shrink-0">
          <div>
            <h3 className="font-black text-lg text-zinc-900">Seleccionar Productos</h3>
            <p className="text-xs text-zinc-500 font-medium">Marca uno o varios artículos para la orden</p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-zinc-400 hover:text-zinc-900 p-2 bg-white border border-zinc-100 rounded-xl shadow-sm transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* BÚSQUEDA Y FILTROS */}
        <div className="p-4 border-b border-zinc-50 bg-white shrink-0 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nombre o categoría..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
              />
            </div>
            <button 
              type="button"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`px-4 py-2.5 border rounded-xl flex items-center gap-2 font-bold text-sm transition-all ${
                selectedCategory !== 'all' || showFilterMenu
                  ? 'bg-zinc-900 border-zinc-900 text-white' 
                  : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              <Filter size={16} /> 
              <span className="hidden sm:inline">Filtrar</span>
            </button>
          </div>

          {showFilterMenu && (
            <div className="flex flex-wrap gap-1.5 p-3 bg-zinc-50 rounded-xl border border-zinc-100 animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedCategory === 'all' 
                    ? 'bg-white border border-zinc-900 text-zinc-900 shadow-sm' 
                    : 'text-zinc-500 hover:bg-zinc-100'
                }`}
              >
                Todos
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedCategory === cat 
                      ? 'bg-white border border-zinc-900 text-zinc-900 shadow-sm' 
                      : 'text-zinc-500 hover:bg-zinc-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* LISTA DE PRODUCTOS */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-zinc-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400 gap-2">
              <Loader2 className="animate-spin text-zinc-900" size={24} />
              <p className="text-xs font-bold">Consultando inventario real...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <p className="text-sm font-bold">No se encontraron productos</p>
              <p className="text-xs mt-0.5">Intenta cambiar el término de búsqueda o filtro</p>
            </div>
          ) : (
            filteredProducts.map(product => {
              const selectedItem = selectedProducts.find(p => p.id === product.id);
              const isSelected = !!selectedItem;
              const quantity = selectedItem?.quantity || 0;
              const outOfStock = product.stock <= 0;

              return (
                <div 
                  key={product.id} 
                  className={`flex items-center justify-between p-3.5 rounded-2xl border bg-white transition-all select-none ${
                    outOfStock ? 'opacity-50 cursor-not-allowed' : ''
                  } ${isSelected ? 'border-zinc-900 ring-1 ring-zinc-900 bg-zinc-50/30' : 'border-zinc-100'}`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Imagen del producto */}
                    <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-zinc-100 shadow-sm">
                      {product.image ? (
                        <img src={product.image} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={18} className="text-zinc-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-zinc-900 text-sm leading-tight truncate">{product.name}</p>
                      
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        {/* Visualización de Etiqueta Oferta */}
                        {product.hasOffer && (
                          <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wide">
                            Oferta
                          </span>
                        )}
                        
                        {/* Precio Final (Promo o Normal) */}
                        <span className={`font-black ${product.hasOffer ? 'text-red-600' : 'text-zinc-800'}`}>
                          {new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(product.price)}
                        </span>
                        
                        {/* Precio Original Tachado (Solo si tiene oferta) */}
                        {product.hasOffer && (
                          <span className="text-zinc-400 line-through decoration-zinc-400 font-medium">
                            {new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(product.originalPrice || 0)}
                          </span>
                        )}

                        <span className="text-zinc-300">•</span>
                        <span className={outOfStock ? 'text-red-500 font-bold' : 'text-emerald-600 font-medium'}>
                          {outOfStock ? 'Agotado' : `Stock: ${product.stock}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CONTROLES DE CANTIDAD */}
                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl">
                        <button onClick={() => updateQuantity(product, -1)} className="p-1.5 hover:bg-white rounded-lg transition-all"><Minus size={14}/></button>
                        <span className="font-black text-sm w-6 text-center">{quantity}</span>
                        <button onClick={() => updateQuantity(product, 1)} disabled={quantity >= product.stock} className="p-1.5 hover:bg-white rounded-lg transition-all disabled:opacity-30"><Plus size={14}/></button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => updateQuantity(product, 1)}
                        disabled={outOfStock}
                        className="text-xs font-bold bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-800 transition-all disabled:bg-zinc-200"
                      >
                        Añadir
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-zinc-100 bg-white flex items-center justify-between gap-3 shrink-0 sticky bottom-0">
          <div className="text-left">
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Seleccionados</p>
            <p className="text-sm font-black text-zinc-900">
              {selectedProducts.reduce((acc, p) => acc + (p.quantity || 1), 0)} artículos
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 text-xs font-bold rounded-xl hover:bg-zinc-50 transition-all sm:inline-block hidden"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={selectedProducts.length === 0}
              onClick={handleConfirmSelection}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              Confirmar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}