import { 
  Plus, 
  Search, 
  MoreVertical, 
  Filter, 
  Package 
} from 'lucide-react';

// Datos ficticios para adornar
const products = [
  { id: '001', name: 'Silla Eames', category: 'Hogar', stock: 12, price: '¢45,000', status: 'Activo' },
  { id: '002', name: 'Lámpara Nórdica', category: 'Iluminación', stock: 0, price: '¢28,500', status: 'Agotado' },
  { id: '003', name: 'Mesa de Centro', category: 'Hogar', stock: 5, price: '¢85,000', status: 'Activo' },
];

export default function InventarioPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER DE ACCIÓN */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-950 tracking-tighter">Inventario</h1>
          <p className="text-zinc-500">Gestiona, edita y supervisa tus productos.</p>
        </div>
        <button className="flex items-center gap-2 bg-zinc-950 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-zinc-800 transition shadow-lg">
          <Plus size={18} />
          Nuevo Producto
        </button>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o SKU..." 
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition">
          <Filter size={18} />
          Filtrar
        </button>
      </div>

      {/* TABLA DE PRODUCTOS */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Precio</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-zinc-950">{p.name}</td>
                  <td className="px-6 py-4 text-zinc-500 text-sm">{p.category}</td>
                  <td className="px-6 py-4 font-mono font-bold text-sm">{p.stock}</td>
                  <td className="px-6 py-4 font-bold text-sm">{p.price}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      p.status === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-zinc-400 hover:text-zinc-950">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}