import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-zinc-950 tracking-tighter">Dashboard</h1>
        <p className="text-zinc-500">Bienvenido de nuevo, Admin. Aquí tienes el resumen de tu tienda hoy.</p>
      </div>

      {/* TARJETAS DE KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ventas Totales', value: '¢1,250,000', icon: TrendingUp, color: 'text-sky-600' },
          { label: 'Pedidos Hoy', value: '14', icon: ShoppingBag, color: 'text-emerald-600' },
          { label: 'Nuevos Clientes', value: '8', icon: Users, color: 'text-indigo-600' },
          { label: 'Alertas Stock', value: '3', icon: AlertTriangle, color: 'text-amber-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-start justify-between hover:border-zinc-200 transition-colors">
            <div>
              <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-zinc-950 mt-1">{stat.value}</h3>
            </div>
            <div className={`p-2 bg-zinc-50 rounded-xl ${stat.color}`}>
              <stat.icon size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* SECCIÓN PRINCIPAL (Tabla + Alertas) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* TABLA DE PEDIDOS */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-black text-zinc-950">Pedidos Recientes</h2>
            <button className="text-xs font-bold text-sky-600 hover:text-sky-700">Ver todos</button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg border border-zinc-200 flex items-center justify-center font-bold text-xs">#10{i}</div>
                  <div>
                    <p className="text-sm font-bold">Cliente {i+1}</p>
                    <p className="text-xs text-zinc-400">Hace 2 horas</p>
                  </div>
                </div>
                <span className="text-xs font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">ENTREGADO</span>
              </div>
            ))}
          </div>
        </div>

        {/* ALERTA DE STOCK */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
          <h2 className="font-black text-zinc-950 mb-6">Stock Crítico</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm p-3 bg-amber-50 text-amber-800 rounded-xl font-medium border border-amber-100">
              <AlertTriangle size={16} />
              Sillas Eames: 2 unidades
            </div>
            <div className="flex items-center gap-3 text-sm p-3 bg-red-50 text-red-800 rounded-xl font-medium border border-red-100">
              <AlertTriangle size={16} />
              Lámpara Nórdica: 0 unidades
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}