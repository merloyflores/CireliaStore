import { useState } from 'react';
import { User, Package, Trash2, Calendar, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // Asegúrate de importar tu cliente de supabase

export default function ProductFeedbackView({ feedbacks: initialFeedbacks }: { feedbacks: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks);

  // Filtrado
  const filteredFeedbacks = feedbacks.filter((item) => {
    const product = Array.isArray(item.products) ? item.products[0] : item.products;
    return product?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Función para borrar
  const deleteFeedback = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este comentario?')) return;
    
    const { error } = await supabase.from('product_reviews').delete().eq('id', id);
    
    if (!error) {
      setFeedbacks(feedbacks.filter(f => f.id !== id));
    } else {
      alert('Error al eliminar');
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-zinc-400" size={18} />
        <input
          type="text"
          placeholder="Buscar comentarios por producto..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredFeedbacks.length === 0 ? (
          <div className="col-span-full text-center py-16 border-2 border-dashed border-zinc-100 rounded-3xl">
            <p className="text-sm font-medium text-zinc-400">No se encontraron comentarios.</p>
          </div>
        ) : (
          filteredFeedbacks.map((item) => {
            const product = Array.isArray(item.products) ? item.products[0] : item.products;
            
            return (
              <div key={item.id} className="flex flex-col p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm hover:border-zinc-300 transition-all">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-50 border border-zinc-200">
                      {product?.image_url ? <img src={product.image_url} className="w-full h-full object-cover" /> : <Package size={20} className="m-auto text-zinc-300" />}
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider">{product?.name || 'Producto'}</h3>
                  </div>
                  {/* Botón de borrar */}
                  <button 
                    onClick={() => deleteFeedback(item.id)}
                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex-grow mb-5">
                  <p className="text-sm text-zinc-600 italic">"{item.comment}"</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                      {item.user_name?.charAt(0) || 'U'}
                    </div>
                    <span className="text-xs font-bold text-zinc-900">{item.user_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium">
                    <Calendar size={10} />
                    {new Date(item.created_at).toLocaleDateString('es-CR')}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}