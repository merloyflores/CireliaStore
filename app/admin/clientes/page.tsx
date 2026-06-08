import { 
  Users, 
  Mail, 
  Phone, 
  Star, 
  MoreVertical,
  ArrowUpRight
} from 'lucide-react';

const customers = [
  { id: '1', name: 'Ana Vargas', email: 'ana@example.com', orders: 12, spent: '¢450,000', level: 'VIP' },
  { id: '2', name: 'Carlos Mena', email: 'carlos@example.com', orders: 3, spent: '¢120,000', level: 'Regular' },
  { id: '3', name: 'Elena Rojas', email: 'elena@example.com', orders: 1, spent: '¢25,000', level: 'Nuevo' },
];

export default function ClientesPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-zinc-950 tracking-tighter">Clientes</h1>
          <p className="text-zinc-500">Base de datos de tus compradores y niveles de lealtad.</p>
        </div>
        <button className="flex items-center gap-2 bg-zinc-950 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-zinc-800 transition">
          <Users size={18} />
          Nuevo Cliente
        </button>
      </div>

      {/* LISTA DE CLIENTES */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-100 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Contacto</th>
              <th className="px-6 py-4">Pedidos</th>
              <th className="px-6 py-4">Total Gastado</th>
              <th className="px-6 py-4">Lealtad</th>
              <th className="px-6 py-4 text-right">Perfil</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-zinc-950">{c.name}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1 text-xs text-zinc-500">
                    <span className="flex items-center gap-2"><Mail size={12} /> {c.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-bold">{c.orders}</td>
                <td className="px-6 py-4 font-bold">{c.spent}</td>
                <td className="px-6 py-4">
                  <div className={`flex items-center gap-1 w-fit px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                    c.level === 'VIP' ? 'bg-amber-50 text-amber-600' : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    <Star size={10} fill="currentColor" />
                    {c.level}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 hover:bg-zinc-200 rounded-lg transition">
                    <ArrowUpRight size={16} className="text-zinc-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}