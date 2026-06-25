'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  X, 
  MessageSquare, 
  Loader2, 
  Save, 
  ShoppingBag, 
  MapPin, 
  CreditCard,
  Truck,
  Tag,
  User,
  CheckCircle2
} from 'lucide-react';

// ================= TIPADO DE COMPONENTES =================
// 👇 El componente usará esta interfaz local sin conflictos
export interface Order {
  id: string;
  invoice_number?: string | number | null;
  order_notes?: string | null;
  shipping_cost?: number | null;
  total_amount: number;
  payment_method?: string | null;
  delivery_method?: string | null;
  users?: {
    name: string;
  } | null;
}

interface ProductRelation {
  name: string;
  price: number;
}
// ... el resto de tus interfaces (OrderItem, etc) sigue aquí abajo
interface ProductRelation {
  name: string;
  price: number;
}

interface OrderItem {
  id: string;
  quantity: number;
  price_at_purchase: number;
  discount: number | null;
  products: ProductRelation | null;
}

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderDetailModal({ order, isOpen, onClose }: OrderDetailModalProps) {
  // ================= ESTADOS =================
  const [items, setItems] = useState<OrderItem[]>([]);
  const [noteText, setNoteText] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Desglose financiero
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [totalDiscount, setTotalDiscount] = useState<number>(0);

  // Formateador CRC
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      maximumFractionDigits: 0
    }).format(amount);
  };

  useEffect(() => {
    if (isOpen && order?.id) {
      // 1. Precargamos la nota temporalmente por si ya viene en el objeto
      setNoteText((order as any).order_notes || '');
      setSaveSuccess(false); 
      // 2. Traemos los datos frescos de la base de datos
      fetchDetails();
    }
  }, [isOpen, order]);

  // ================= EXTRACCIÓN DE DATOS AISLADA =================
  const fetchDetails = async () => {
    if (!order?.id) return;
    setLoading(true);
    
    // AISLAMOS LA PETICIÓN DE NOTAS
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('order_notes')
        .eq('id', order.id)
        .single();

      if (!orderError && orderData) {
        setNoteText(orderData.order_notes || '');
      }
    } catch (error) {
      console.error('Error extrayendo la nota:', error);
    }

    // AISLAMOS LA PETICIÓN DE PRODUCTOS
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('id, quantity, price_at_purchase, discount, products(name, price)')
        .eq('order_id', order.id);

      if (!itemsError && itemsData) {
        setItems(itemsData as unknown as OrderItem[]);
        const calculatedDiscount = (itemsData as unknown as OrderItem[])?.reduce(
          (acc, item) => acc + (Number(item.discount) || 0), 0
        ) || 0;
        setTotalDiscount(calculatedDiscount);
      }
    } catch (error) {
      console.error('Error extrayendo los productos:', error);
    } 
    
    setShippingCost((order as any).shipping_cost || 0);
    setLoading(false);
  };

  // ================= ACTUALIZACIÓN DE LA NOTA =================
  const saveNote = async () => {
    if (!order?.id) return;
    setSubmittingNote(true);
    setSaveSuccess(false);
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_notes: noteText.trim() })
        .eq('id', order.id);
      
      if (error) throw error;
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error actualizando la nota en la orden:', error);
      alert('No se pudo guardar la observación. Verifica la conexión.');
    } finally {
      setSubmittingNote(false);
    }
  };

  if (!isOpen || !order) return null;

  const calculatedSubtotal = items.reduce(
    (acc, item) => acc + (item.price_at_purchase * item.quantity), 0
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div 
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-xl bg-white shadow-2xl h-full flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Encabezado */}
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-black text-zinc-950 tracking-tight">
              {order.invoice_number 
                ? `Pedido #${order.invoice_number.toString().padStart(4, '0')}` 
                : `Pedido Temporal: ${order.id.substring(0, 6).toUpperCase()}`
              }
            </h2>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Detalle Operativo del Sistema</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-xl transition-all"
          >
            <X size={20}/>
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
              <Loader2 className="animate-spin text-zinc-900 mb-2" size={28} />
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Extrayendo registros...</p>
            </div>
          ) : (
            <>
              {/* Sección 1: Datos del Destinatario */}
              <section className="bg-zinc-50 border border-zinc-200/60 p-4 rounded-2xl space-y-3 shadow-inner">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <User size={13} className="text-zinc-500" /> Datos del Destinatario
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[11px] text-zinc-400 font-bold">Cliente</p>
                    <p className="font-bold text-zinc-900">{order.users?.name || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-400 font-bold">Método de Pago</p>
                    <p className="font-bold text-zinc-900 capitalize flex items-center gap-1.5 mt-0.5">
                      <CreditCard size={12} className="text-zinc-400" />
                      {order.payment_method ? order.payment_method.replace('_', ' ') : 'Pendiente'}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[11px] text-zinc-400 font-bold">Método de Distribución / Destino</p>
                    <p className="font-bold text-zinc-900 flex items-center gap-1.5 mt-0.5 capitalize">
                      <Truck size={12} className="text-zinc-400" />
                      {order.delivery_method || 'Retiro en Sucursal'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Sección 2: Líneas del Pedido */}
              <section className="border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-zinc-50/70 p-3 px-4 border-b border-zinc-200 flex items-center gap-2">
                  <ShoppingBag size={14} className="text-zinc-600" />
                  <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Líneas del Pedido</h3>
                </div>
                <div className="divide-y divide-zinc-100 bg-white">
                  {items.length === 0 ? (
                    <div className="p-6 text-center text-zinc-400 text-xs font-medium">
                      No hay artículos registrados para esta transacción.
                    </div>
                  ) : (
                    items.map((item) => (
                      <div key={item.id} className="p-4 flex justify-between items-start text-sm hover:bg-zinc-50/50 transition-colors">
                        <div>
                          <p className="font-bold text-zinc-900">{item.products?.name || 'Producto del Sistema'}</p>
                          <p className="text-xs text-zinc-500 font-medium mt-0.5">Cantidad: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-zinc-900">{formatCurrency(item.price_at_purchase * item.quantity)}</p>
                          {item.discount && item.discount > 0 ? (
                            <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1 justify-end mt-0.5">
                              <Tag size={10} /> -{formatCurrency(item.discount)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-zinc-50/40 p-4 border-t border-zinc-200 space-y-2 text-sm">
                  <div className="flex justify-between text-zinc-500 font-medium">
                    <span>Subtotal del pedido</span>
                    <span>{formatCurrency(calculatedSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span className="flex items-center gap-1">Descuentos aplicados</span>
                    <span>-{formatCurrency(totalDiscount)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500 font-medium">
                    <span>Costo de envío logístico</span>
                    <span>{formatCurrency(shippingCost)}</span>
                  </div>
                  <div className="border-t border-zinc-200 pt-3 mt-1 flex justify-between text-base font-black text-zinc-950">
                    <span>Monto Final Total</span>
                    <span className="text-lg text-zinc-950 font-black">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </section>

              {/* Sección 3: Área de Texto Única para Observaciones */}
              <section className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-zinc-600" />
                  <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Observaciones del Pedido</h3>
                </div>
                
                <div className="flex flex-col gap-3">
                  <textarea 
                    value={noteText} 
                    onChange={(e) => setNoteText(e.target.value)}
                    disabled={submittingNote}
                    placeholder="Escribe aquí las alertas, direcciones o detalles específicos de esta compra..."
                    rows={4}
                    className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all bg-white placeholder-zinc-400 shadow-xs resize-none disabled:opacity-60"
                  />
                  <button 
                    onClick={saveNote} 
                    disabled={submittingNote}
                    className="bg-zinc-950 text-white py-2.5 px-4 rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto self-end"
                  >
                    {submittingNote ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : saveSuccess ? (
                      <><CheckCircle2 size={16} className="mr-2 text-emerald-400"/> Guardado</>
                    ) : (
                      <><Save size={16} className="mr-2"/> Actualizar Observaciones</>
                    )}
                  </button>
                </div>
              </section>
            </>
          )}
        </div>
        
      </div>
    </div>
  );
}