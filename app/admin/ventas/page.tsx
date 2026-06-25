'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
//import { Order as DBOrder } from '@/lib/types';
import { 
  Truck, 
  Package, 
  CheckCircle2, 
  Clock, 
  Search,
  Plus,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  CalendarDays,
  CreditCard,
  Hash
} from 'lucide-react';
import NewSalePanel from '@/components/NewSalePanel';
import OrderDetailModal from '@/components/OrderDetailModal'; // <-- AÑADIDO: Importación del nuevo modal

// ================= TIPADO (TYPESCRIPT) =================
interface UserInfo {
  name: string;
}

export interface Order {
  id: string;
  invoice_number: number | null;
  status: string;
  total_amount: number;
  created_at: string;
  payment_method: string | null;
  delivery_method: string | null;
  users: UserInfo | null;
}

// Mapeo de estados reales de la BD a UI
const statusMap: Record<string, { label: string, styles: string }> = {
  // --- Estados de Pago ---
  'pending':        { label: 'Pendiente',   styles: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
  'payment_failed': { label: 'Pago Fallido', styles: 'bg-rose-50 text-rose-600 border-rose-200' },
  'paid':           { label: 'Pagado',      styles: 'bg-blue-100 text-blue-700 border-blue-200' },
  
  // --- Estados de Logística ---
  'packed':         { label: 'Preparado',   styles: 'bg-amber-100 text-amber-700 border-amber-200' },
  'shipped':        { label: 'En Ruta',     styles: 'bg-sky-100 text-sky-700 border-sky-200' },
  'out_for_delivery': { label: 'En Entrega', styles: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  'delivered':      { label: 'Entregado',   styles: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  
  // --- Estados de Excepción ---
  'returned':       { label: 'Devuelto',    styles: 'bg-purple-100 text-purple-700 border-purple-200' },
  'cancelled':      { label: 'Cancelado',   styles: 'bg-zinc-800 text-zinc-100 border-zinc-900' },
};

export default function VentasPage() {
  // ================= ESTADOS =================
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null); // <-- AÑADIDO: Estado para el modal de detalles

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ================= FETCH DE DATOS =================
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        invoice_number,
        status,
        total_amount,
        created_at,
        payment_method,
        delivery_method,
        users ( name )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      // Forzamos el tipado para evitar conflictos de types con Supabase
      setOrders((data as unknown as Order[]) || []);
    }
    setIsLoading(false);
  };

  // ================= ACTUALIZAR ESTADO =================
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatusId(orderId);
      
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert('Hubo un error al actualizar el estado de la venta.');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // ================= LÓGICA DE FILTROS =================
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      const month = (orderDate.getMonth() + 1).toString();
      const year = orderDate.getFullYear().toString();
      
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        order.id.toLowerCase().includes(searchLower) || 
        (order.invoice_number && order.invoice_number.toString().includes(searchLower)) ||
        (order.users?.name && order.users.name.toLowerCase().includes(searchLower));
      
      const matchesMonth = filterMonth === 'all' || month === filterMonth;
      const matchesYear = filterYear === 'all' || year === filterYear;
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;

      return matchesSearch && matchesMonth && matchesYear && matchesStatus;
    });
  }, [orders, searchQuery, filterMonth, filterYear, filterStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterMonth, filterYear, filterStatus, itemsPerPage]);

  // ================= LÓGICA DE PAGINACIÓN =================
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  // ================= MÉTRICAS DINÁMICAS =================
  const metrics = useMemo(() => {
    return {
      pendientes: filteredOrders.filter(o => o.status === 'pending').length,
      preparando: filteredOrders.filter(o => ['paid', 'packed'].includes(o.status)).length,
      enRuta: filteredOrders.filter(o => o.status === 'shipped').length,
      completados: filteredOrders.filter(o => o.status === 'delivered').length,
    };
  }, [filteredOrders]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div>
          <h1 className="text-3xl font-black text-zinc-950 tracking-tighter">Ventas y Envíos</h1>
          <p className="text-zinc-500 font-medium mt-1">Controla el flujo de tus pedidos e ingresos en tiempo real.</p>
        </div>
        
        <div className="flex flex-row gap-3 w-full md:w-auto">
          <button 
            onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
            className="flex-1 md:flex-none bg-white border border-zinc-200 text-zinc-800 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all shadow-sm"
          >
            <BarChart3 size={18} className="text-indigo-600" />
            <span className="hidden sm:inline">Análisis</span>
          </button>
          
          <button 
            onClick={() => setIsNewSaleOpen(true)}
            className="flex-1 md:flex-none bg-zinc-950 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20 active:scale-95"
          >
            <Plus size={18} />
            Nueva Venta
          </button>
        </div>
      </div>

      {/* MÉTRICAS RÁPIDAS DE LOGÍSTICA (Dinámicas) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pendientes', count: metrics.pendientes, icon: Clock, color: 'text-zinc-600', bg: 'bg-zinc-100', ring: 'ring-zinc-200' },
          { label: 'Preparando', count: metrics.preparando, icon: Package, color: 'text-amber-600', bg: 'bg-amber-100', ring: 'ring-amber-200' },
          { label: 'En Ruta', count: metrics.enRuta, icon: Truck, color: 'text-sky-600', bg: 'bg-sky-100', ring: 'ring-sky-200' },
          { label: 'Entregados', count: metrics.completados, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100', ring: 'ring-emerald-200' },
        ].map((item, i) => (
          <div 
            key={i} 
            className="group bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all duration-300 flex items-center gap-4 overflow-hidden relative"
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.bg.replace('bg-', 'bg-')}`} />
            <div className={`p-3.5 rounded-2xl ${item.bg} ${item.color} shadow-inner shrink-0`}>
              <item.icon size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest truncate group-hover:text-zinc-600 transition-colors">
                {item.label}
              </p>
              <p className="text-3xl font-black text-zinc-950 tracking-tight">
                {isLoading ? (
                  <span className="animate-pulse opacity-50">-</span>
                ) : (
                  <span className="animate-in slide-in-from-bottom-2 duration-500">{item.count}</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ÁREA DE TABLA Y FILTROS */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
        
        {/* Toolbar Único e Integrado */}
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-col lg:flex-row items-center gap-3">
          
          {/* Buscador */}
          <div className="relative w-full lg:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por factura, ID o cliente..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all shadow-sm"
            />
          </div>

          {/* Contenedor de Filtros */}
          <div className="flex flex-wrap w-full lg:w-auto gap-2">
            <select 
              aria-label="Filtrar por mes"
              value={filterMonth} 
              onChange={(e) => setFilterMonth(e.target.value)}
              className="flex-1 lg:flex-none py-2.5 px-3 bg-white border border-zinc-200 rounded-xl text-xs sm:text-sm font-bold text-zinc-700 outline-none cursor-pointer shadow-sm hover:border-zinc-300 min-w-22.5"
            >
              <option value="all">Todos los Meses</option>
              {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>

            <select 
              aria-label="Filtrar por año"
              value={filterYear} 
              onChange={(e) => setFilterYear(e.target.value)}
              className="flex-1 lg:flex-none py-2.5 px-3 bg-white border border-zinc-200 rounded-xl text-xs sm:text-sm font-bold text-zinc-700 outline-none cursor-pointer shadow-sm hover:border-zinc-300 min-w-22.5"
            >
              <option value="all">Años</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>

            <select 
              aria-label="Filtrar por estado"
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 lg:flex-none py-2.5 px-3 bg-white border border-zinc-200 rounded-xl text-xs sm:text-sm font-bold text-zinc-700 outline-none cursor-pointer shadow-sm hover:border-zinc-300 min-w-30"
            >
              <option value="all">Todos los Estados</option>
              {Object.entries(statusMap).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Tabla de Resultados */}
        <div className="divide-y divide-zinc-100 flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
              <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mb-4"></div>
              <p className="text-sm font-bold">Cargando ventas reales...</p>
            </div>
          ) : paginatedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
              <Package size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-bold text-zinc-600">No se encontraron pedidos</p>
              <p className="text-xs">Ajusta tus filtros o realiza una nueva venta.</p>
            </div>
          ) : (
            paginatedOrders.map((order) => {
              const statusConfig = statusMap[order.status] || { label: 'Desconocido', styles: 'bg-zinc-100 text-zinc-600 border-zinc-200' };
              const orderDate = new Intl.DateTimeFormat('es-CR', { 
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
              }).format(new Date(order.created_at));
              
              const isUpdating = updatingStatusId === order.id;
              
              return (
                <div 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)} // <-- AÑADIDO: Click para abrir detalles
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 hover:bg-zinc-50 transition group gap-4 border-b border-zinc-50 last:border-0 cursor-pointer" // <-- AÑADIDO: cursor-pointer
                >
                  
                  {/* Info Izquierda */}
                  <div className="flex items-start md:items-center gap-4">
                    <div className="w-14 h-14 rounded-xl p-2 bg-zinc-100 border border-zinc-200 flex flex-col items-center justify-center shrink-0">
                      {order.invoice_number ? (
                        <>
                          <Hash size={12} className="text-zinc-400 mb-0.5" />
                          <span className="font-black text-sm text-zinc-900">
                            {order.invoice_number.toString().padStart(4, '0')}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] font-bold text-zinc-400">ID</span>
                          <span className="font-black text-xs text-zinc-900 uppercase">
                            {order.id.substring(0, 4)}
                          </span>
                        </>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-base font-bold text-zinc-950 flex items-center gap-2">
                        {order.users?.name || 'Cliente sin nombre'}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-zinc-500 mt-1">
                        <span className="capitalize flex items-center gap-1">
                          <CalendarDays size={12} className="text-zinc-400" />
                          {orderDate}
                        </span>
                        <span className="hidden sm:inline text-zinc-300">•</span>
                        
                        {order.payment_method && (
                          <span className="flex items-center gap-1 capitalize">
                            <CreditCard size={12} className="text-zinc-400" />
                            {order.payment_method.replace('_', ' ')}
                          </span>
                        )}
                        <span className="hidden sm:inline text-zinc-300">•</span>
                        
                        {order.delivery_method && (
                          <span className="flex items-center gap-1 capitalize">
                            <Truck size={12} className="text-zinc-400" />
                            {order.delivery_method}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Info Derecha */}
                  <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto border-t md:border-0 border-zinc-100 pt-3 md:pt-0">
                    <span className="text-lg font-black text-zinc-900">
                      {new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(order.total_amount)}
                    </span>
                    
                    <div className="flex items-center gap-3">
                      {/* <-- AÑADIDO: onClick e.stopPropagation() para que el click aquí NO abra el modal */}
                      <div className="relative group" onClick={(e) => e.stopPropagation()}>
                        <select
                          aria-label="Actualizar estado del pedido"
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          disabled={isUpdating}
                          className={`
                            appearance-none 
                            pl-3.5 pr-9 py-1.5 
                            rounded-full 
                            text-[11px] font-black uppercase tracking-wider
                            border border-transparent
                            outline-none cursor-pointer 
                            transition-all duration-200
                            shadow-sm
                            ${isUpdating ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md hover:border-zinc-300'}
                            ${statusConfig.styles}
                          `}
                        >
                          {Object.entries(statusMap).map(([key, value]) => (
                            <option key={key} value={key} className="bg-white text-zinc-900 font-medium py-2">
                              {value.label}
                            </option>
                          ))}
                        </select>
                        
                        <div className={`
                          absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none 
                          transition-transform duration-300
                          ${isUpdating ? 'animate-spin' : 'group-hover:-translate-y-0.5'}
                        `}>
                          {isUpdating ? (
                            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full opacity-70"></div>
                          ) : (
                            <ChevronRight size={14} className="rotate-90 opacity-40 group-hover:opacity-100" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>
              );
            })
          )}
        </div>

        {/* CONTROLES DE PAGINACIÓN */}
        {!isLoading && filteredOrders.length > 0 && (
          <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium w-full sm:w-auto justify-center">
              <span>Mostrar</span>
              <select 
                aria-label="Seleccionar cantidad de elementos por página"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-zinc-200 rounded-lg px-2 py-1 outline-none text-zinc-900 font-bold shadow-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={40}>40</option>
                <option value={100}>100</option>
              </select>
              <span>por página</span>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-sm font-medium text-zinc-500">
                Mostrando <span className="font-bold text-zinc-900">{startIndex + 1}</span> a <span className="font-bold text-zinc-900">{Math.min(startIndex + itemsPerPage, filteredOrders.length)}</span> de <span className="font-bold text-zinc-900">{filteredOrders.length}</span>
              </span>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-sm transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="px-3 py-1 text-sm font-bold text-zinc-900 min-w-8 text-center">
                  {currentPage}
                </span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-sm transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* INTEGRACIÓN DEL COMPONENTE DE NUEVA VENTA */}
      <NewSalePanel 
        isOpen={isNewSaleOpen}
        onClose={() => {
          setIsNewSaleOpen(false);
          fetchOrders(); 
        }}
      />

      {/* <-- AÑADIDO: INTEGRACIÓN DEL MODAL DE DETALLES DE VENTA --> */}
      {selectedOrder && (
        <OrderDetailModal 
          isOpen={!!selectedOrder}
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

    </div>
  );
}