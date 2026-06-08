import { 
  Truck, 
  Package, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronRight
} from 'lucide-react';

const orders = [
  { id: '#CLI-9901', customer: 'Ana Vargas', total: '¢120,000', status: 'En camino', date: 'Hoy, 14:30' },
  { id: '#CLI-9902', customer: 'Carlos Mena', total: '¢45,000', status: 'Preparando', date: 'Hoy, 10:15' },
  { id: '#CLI-9903', customer: 'Elena Rojas', total: '¢210,000', status: 'Entregado', date: 'Ayer, 16:45' },
  { id: '#CLI-9904', customer: 'Marcos Solis', total: '¢32,000', status: 'Pendiente', date: 'Ayer, 09:20' },
];

const statusStyles: Record<string, string> = {
  'En camino': 'bg-sky-100 text-sky-700',
  'Preparando': 'bg-amber-100 text-amber-700',
  'Entregado': 'bg-emerald-100 text-emerald-700',
  'Pendiente': 'bg-zinc-100 text-zinc-600',
};

export default function VentasPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-zinc-950 tracking-tighter">Ventas y Envíos</h1>
        <p className="text-zinc-500">Controla el flujo de tus pedidos en tiempo real.</p>
      </div>

      {/* MÉTRICAS RÁPIDAS DE LOGÍSTICA */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pendientes', count: '2', icon: Clock },
          { label: 'Preparando', count: '5', icon: Package },
          { label: 'En Ruta', count: '3', icon: Truck },
          { label: 'Completados', count: '128', icon: CheckCircle2 },
        ].map((item, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-zinc-50 rounded-xl text-zinc-500">
              <item.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{item.label}</p>
              <p className="text-xl font-black">{item.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* LISTA DE PEDIDOS */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
          <h2 className="font-black text-zinc-950">Historial de Pedidos</h2>
          <button className="text-xs font-bold text-sky-600 hover:underline">Exportar reporte</button>
        </div>
        
        <div className="divide-y divide-zinc-50">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between p-6 hover:bg-zinc-50 transition group cursor-pointer">
              <div className="flex items-center gap-6">
                <div>
                  <p className="font-black text-sm">{order.id}</p>
                  <p className="text-xs text-zinc-400">{order.date}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">{order.customer}</p>
                  <p className="text-xs text-zinc-500">{order.total}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${statusStyles[order.status]}`}>
                  {order.status}
                </span>
                <div className="text-zinc-300 group-hover:text-zinc-600 transition">
                  <ChevronRight size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}