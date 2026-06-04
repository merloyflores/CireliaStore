'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Trash2, Edit3, Image as ImageIcon, Loader2, LogOut, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProductModal from '../../../components/ProductModal'; 

export default function AdminDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para controlar el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Función única y definida una sola vez
  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('id', { ascending: false });
    if (!error && data) setProducts(data);
    setLoading(false);
  }

  // Wrapper para refresco con retraso (asegura que Supabase termine de escribir antes de recargar)
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

  return (
    <div className="min-h-screen bg-zinc-50 p-6 sm:p-10 text-zinc-950">
      
      {/* HEADER DEL DASHBOARD */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-zinc-200">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Panel de Control</h1>
          <p className="text-zinc-500 text-sm font-medium">Gestiona el inventario oficial de Cirelia Store</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={() => openModal()}
            className="flex-1 sm:flex-none bg-zinc-950 text-white px-5 h-12 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-sky-600 transition-all active:scale-95 text-sm shadow-md"
          >
            <Plus size={18} /> Añadir Producto
          </button>
          <button onClick={handleLogout} className="p-3 bg-white border border-zinc-200 rounded-xl text-zinc-400 hover:text-red-500 transition-all">
            <LogOut size={20} />
          </button>
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
                  <th className="py-4 px-6">Precio</th>
                  <th className="py-4 px-6">Stock</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm font-medium">
                {products.map((product) => (
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
                    <td className="py-4 px-6 text-zinc-500 capitalize">{product.category || '-'}</td>
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

      {/* RENDERIZADO CONDICIONAL DEL MODAL */}
      {isModalOpen && (
        <ProductModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={handleSuccess} 
          productToEdit={editingProduct} 
        />
      )}
    </div>
  );
}