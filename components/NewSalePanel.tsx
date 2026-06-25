import { useState } from 'react';
import { X, UserPlus, ShoppingBag, CreditCard, ChevronDown, Trash, Truck, Loader2 } from 'lucide-react';
import ClientSelectorModal from './ClientSelectorModal';
import ProductSelectorModal from './ProductSelectorModal';
import { supabase } from '@/lib/supabase'; // <-- Importación de Supabase

const paymentMethods = ['SINPE Móvil', 'Efectivo', 'Tarjeta POS', 'Emma Pay', 'Transferencia IBAN'];
const deliveryMethods = ['Recogida en tienda', 'Correos de Costa Rica', 'Uber Flash', 'DiDi Entrega', 'inDrive', 'Taxi', 'Transportista', 'Entrega Personal'];

export default function NewSalePanel({ isOpen, onClose }: any) {
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState(deliveryMethods[0]);
  const [deliveryCost, setDeliveryCost] = useState<number>(0);
  
  // Estado del POS
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]);
  const [taxPercentage, setTaxPercentage] = useState<number>(0); 
  
  // Estado de carga para el botón de confirmar
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Lógica completa de carrito y cálculos
  const handleAddProducts = (newProducts: any[]) => {
    setCart(currentCart => {
      let updatedCart = [...currentCart];

      newProducts.forEach((newProduct) => {
        const existingIndex = updatedCart.findIndex(item => item.id === newProduct.id);
        const incomingQty = newProduct.quantity || 1;
        
        if (existingIndex > -1) {
          const newTotalQty = updatedCart[existingIndex].quantity + incomingQty;
          if (newTotalQty <= (newProduct.stock || 0)) {
            updatedCart[existingIndex].quantity = newTotalQty;
          }
        } else {
          if (incomingQty <= (newProduct.stock || 0)) {
            updatedCart.push({ 
              ...newProduct, 
              quantity: incomingQty,
              manualDiscount: 0, 
              autoDiscount: newProduct.discountAmount || 0 
            });
          }
        }
      });
      return updatedCart;
    });
    setIsProductModalOpen(false);
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateProductDiscount = (id: string, discount: number) => {
    setCart(currentCart => 
      currentCart.map(item => 
        item.id === id ? { ...item, manualDiscount: discount } : item
      )
    );
  };

  // Cálculos consolidados y desgloses (Con protecciones para evitar valores indefinidos)
  const subtotalOriginal = cart.reduce((acc, item) => acc + ((item.originalPrice ?? item.price ?? 0) * (item.quantity ?? 0)), 0);
  const totalAutoDiscount = cart.reduce((acc, item) => acc + ((item.autoDiscount ?? 0) * (item.quantity ?? 0)), 0);
  const totalManualDiscount = cart.reduce((acc, item) => acc + ((item.manualDiscount ?? 0) * (item.quantity ?? 0)), 0);
  const totalDiscounts = totalAutoDiscount + totalManualDiscount;
  
  const taxableBase = subtotalOriginal - totalDiscounts;
  const taxAmount = taxableBase * (taxPercentage / 100);
  const grandTotal = taxableBase + Number(deliveryCost || 0) + taxAmount;

  // --- LÓGICA DE GUARDADO ADAPTADA A TU BASE DE DATOS REAL ---
  const handleConfirmSale = async () => {
    if (!selectedClient || cart.length === 0) return;

    try {
      setIsSubmitting(true);

      // Mapeamos la dirección de envío/entrega obligatoria como JSONB
      const shippingAddressJson = {
        client_name: selectedClient.name || 'Cliente General',
        delivery_method: deliveryMethod,
        phone: selectedClient.phone || '',
        address_details: deliveryMethod === 'Envío a domicilio' ? 'Envío requerido' : 'Retiro en tienda'
      };

      // 1. Estructura exacta para la tabla 'orders'
      const orderPayload = {
        user_id: selectedClient.id,               // Mapeado a user_id
        status: 'completed',                      // Cambiado a completado directamente
        total_amount: grandTotal,                 // Mapeado a total_amount (numeric)
        shipping_address: shippingAddressJson,    // Objeto JSONB obligatorio (not null)
        delivery_method: deliveryMethod,
        delivery_cost: Number(deliveryCost || 0), // Forzado numérico seguro
        payment_method: paymentMethod,
        subtotal: subtotalOriginal,               // numeric
        tax_amount: taxAmount,                    // numeric
        tax_percentage: taxPercentage,            // numeric
        discount_amount: totalDiscounts           // numeric
      };

      console.log("📦 Enviando a tabla 'orders':", orderPayload);

      // Insertar la cabecera de la orden
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select('id')
        .single();

      if (orderError) throw orderError;

      // 2. Estructura exacta para la tabla 'order_items'
      const orderItems = cart.map(item => {
        const basePrice = item.originalPrice ?? item.price ?? 0;
        const totalDiscountOnItem = (item.autoDiscount || 0) + (item.manualDiscount || 0);
        // El precio real pagado por unidad (Precio original menos el descuento por unidad)
        const finalPriceAtPurchase = basePrice - totalDiscountOnItem; 
        
        return {
          order_id: orderData.id,
          product_id: item.id,
          variant_id: null, 
          quantity: item.quantity || 1,
          price_at_purchase: finalPriceAtPurchase, // Mapeado a price_at_purchase (numeric)
          original_price: basePrice,               // Mapeado a original_price (numeric)
          discount_amount: totalDiscountOnItem     // Descuento total por ítem mapeado de forma segura
        };
      });

      console.log("📦 Enviando a tabla 'order_items':", orderItems);

      // Insertar el detalle de los productos
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // --- DISMINUCIÓN DE INVENTARIO PRODUCTO POR PRODUCTO ---
      for (const item of cart) {
        const nuevoStock = (item.stock || 0) - (item.quantity || 0);
        
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: nuevoStock })
          .eq('id', item.id);

        if (updateError) {
          console.error(`Error al actualizar stock del producto ${item.id}:`, updateError);
        }
      }

      // 3. Éxito absoluto: Limpiar estados y cerrar el panel
      setCart([]);
      setSelectedClient(null);
      setDeliveryCost(0);
      setTaxPercentage(0);
      
      if (typeof onClose === 'function') onClose(); 
      alert('✅ ¡Venta registrada con éxito en Supabase!');
      
    } catch (error: any) {
      console.error('❌ ERROR DE SUPABASE:', error);
      
      const errorMsg = error?.message || 'Error desconocido';
      const errorDetails = error?.details || 'Revisa la consola.';
      
      alert(`🛑 ERROR AL GUARDAR LA VENTA:\n\nMensaje: ${errorMsg}\nDetalles: ${errorDetails}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Cabecera */}
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
          <div>
            <h2 className="text-xl font-black text-zinc-950">Registrar Venta POS</h2>
            <p className="text-xs text-zinc-500 font-medium">Ingreso manual de pedidos</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-200 transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Cuerpo del POS */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* SECCIÓN CLIENTE */}
          <section className="space-y-3">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <UserPlus size={14} /> Cliente
            </h3>
            
            {selectedClient ? (
              <div className="bg-sky-50/60 border border-sky-100 p-4 rounded-2xl flex justify-between items-center group transition-all hover:bg-sky-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-black text-sm border border-sky-200/50 overflow-hidden shrink-0 shadow-sm">
                    {selectedClient.image ? (
                      <img 
                        src={selectedClient.image} 
                        alt={selectedClient.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerText = selectedClient.name ? selectedClient.name.charAt(0).toUpperCase() : 'C';
                          }
                        }}
                      />
                    ) : (
                      selectedClient.name ? selectedClient.name.charAt(0).toUpperCase() : 'C'
                    )}
                  </div>
                  
                  <div className="space-y-0.5">
                    <p className="font-bold text-sky-950 text-sm">{selectedClient.name}</p>
                    <div className="text-xs text-sky-700 font-medium flex flex-wrap items-center gap-x-2 gap-y-0.5 opacity-90">
                      <span>{selectedClient.email}</span>
                      {(selectedClient.dni || selectedClient.phone) && (
                        <span className="text-sky-300 select-none">•</span>
                      )}
                      {selectedClient.dni && <span>ID: {selectedClient.dni}</span>}
                      {selectedClient.dni && selectedClient.phone && (
                        <span className="text-sky-300 select-none">•</span>
                      )}
                      {selectedClient.phone && <span>Tel: {selectedClient.phone}</span>}
                    </div>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => setSelectedClient(null)} 
                  className="text-xs font-black text-sky-600 bg-white border border-sky-200 px-3 py-1.5 rounded-xl hover:bg-sky-100 hover:border-sky-300 transition-all shadow-sm"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => setIsClientModalOpen(true)}
                className="w-full py-4 border-2 border-dashed border-zinc-200 rounded-2xl text-zinc-500 font-bold text-sm hover:border-zinc-400 hover:text-zinc-700 transition-colors bg-zinc-50/50 flex items-center justify-center gap-2"
              >
                + Seleccionar o Crear Cliente
              </button>
            )}
          </section>

          {/* SECCIÓN PRODUCTOS */}
          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <ShoppingBag size={14} /> Productos
              </h3>
              <button onClick={() => setIsProductModalOpen(true)} className="text-xs font-bold text-sky-600 hover:underline">
                + Añadir
              </button>
            </div>
            
            <div className="space-y-2 max-h-75 overflow-y-auto pr-2">
            {cart.map(item => {
              const basePrice = item.originalPrice ?? item.price;
              const finalLinePrice = (basePrice * item.quantity) - (item.autoDiscount * item.quantity) - (item.manualDiscount * item.quantity);

              return (
                <div key={item.id} className="p-3 bg-white border border-zinc-100 rounded-xl shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-zinc-500 font-medium">
                        {item.quantity} x ¢{basePrice.toLocaleString()}
                      </p>
                      {item.autoDiscount > 0 && (
                        <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-black">
                          -¢{item.autoDiscount.toLocaleString()} OFF
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="font-black text-sm text-zinc-900">
                        ¢{finalLinePrice.toLocaleString()}
                      </span>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-50">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Desc. Extra (¢)</span>
                    <input 
                      type="number"
                      aria-label="Descuento manual"
                      placeholder="0"
                      value={item.manualDiscount || ''}
                      onChange={(e) => updateProductDiscount(item.id, Number(e.target.value))}
                      className="w-20 p-1 text-xs font-bold border border-zinc-200 rounded-lg text-red-600 outline-none focus:border-red-400 bg-zinc-50"
                    />
                  </div>
                </div>
              );
            })}
              
              {cart.length === 0 && (
                <div className="text-center py-6 text-sm text-zinc-400 font-medium bg-zinc-50 rounded-xl border border-zinc-100">
                  Carrito vacío
                </div>
              )}
            </div>
          </section>

          {/* VISTA PREMIUM DE PAGO Y ENTREGA REDISEÑADA */}
          <div className="space-y-5">
            {/* BLOQUE PAGO */}
            <section className="bg-zinc-50/70 border border-zinc-100 p-4 rounded-2xl space-y-3">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <CreditCard size={14} className="text-zinc-500" /> Método de Pago
              </h3>
              <div className="relative">
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)} 
                  className="w-full bg-white border border-zinc-200 rounded-xl p-3.5 pr-10 text-sm font-bold text-zinc-800 outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 shadow-sm appearance-none transition-all"
                >
                  {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <div className="absolute right-3.5 top-4.5 pointer-events-none text-zinc-400">
                  <ChevronDown size={16} />
                </div>
              </div>
            </section>

            {/* BLOQUE ENTREGA */}
            <section className="bg-zinc-50/70 border border-zinc-100 p-4 rounded-2xl space-y-3">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Truck size={14} className="text-zinc-500" /> Logística de Entrega
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div className="sm:col-span-3 relative">
                  <select 
                    value={deliveryMethod} 
                    onChange={(e) => setDeliveryMethod(e.target.value)} 
                    className="w-full bg-white border border-zinc-200 rounded-xl p-3.5 pr-10 text-sm font-bold text-zinc-800 outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 shadow-sm appearance-none transition-all"
                  >
                    {deliveryMethods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <div className="absolute right-3.5 top-4.5 pointer-events-none text-zinc-400">
                    <ChevronDown size={16} />
                  </div>
                </div>

                <div className="sm:col-span-2 relative">
                  <span className="absolute left-4 top-3.5 text-sm font-bold text-zinc-400">¢</span>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={deliveryCost || ''}
                    onChange={(e) => setDeliveryCost(Number(e.target.value))}
                    className="w-full bg-white border border-zinc-200 rounded-xl p-3.5 pl-9 text-sm font-bold text-zinc-800 outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 shadow-sm transition-all"
                  />
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* FOOTER TOTALES */}
        <div className="p-6 border-t border-zinc-200 bg-zinc-50 space-y-3 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
          {/* Subtotal */}
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-zinc-500">Subtotal</span>
            <span className="font-bold text-zinc-900">{new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(subtotalOriginal)}</span>
          </div>

          {/* Desglose de Descuentos */}
          {(totalAutoDiscount > 0 || totalManualDiscount > 0) && (
            <div className="space-y-1.5 py-2 border-t border-zinc-200/60">
              {totalAutoDiscount > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-red-500">Ofertas de base aplicadas</span>
                  <span className="font-bold text-red-600">- {new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(totalAutoDiscount)}</span>
                </div>
              )}
              {totalManualDiscount > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-red-500">Descuentos extra (manual)</span>
                  <span className="font-bold text-red-600">- {new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(totalManualDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm pt-1">
                <span className="font-black text-red-600">Total Ahorro Cliente</span>
                <span className="font-black text-red-700">- {new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(totalDiscounts)}</span>
              </div>
            </div>
          )}

          {/* Costo Envío */}
          <div className="flex justify-between items-center text-sm border-t border-zinc-200/60 pt-2">
            <span className="font-medium text-zinc-500">Envío</span>
            <span className="font-bold text-zinc-900">{new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(deliveryCost)}</span>
          </div>

          {/* Impuesto */}
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-zinc-500">Impuesto (%)</span>
              <input 
                type="number"
                aria-label="Porcentaje de impuesto"
                value={taxPercentage}
                onChange={(e) => setTaxPercentage(Number(e.target.value))}
                className="w-12 text-center bg-white border border-zinc-200 rounded-lg p-1 text-xs font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-950"
              />
            </div>
            <span className="font-bold text-zinc-900">
              {new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(taxAmount)}
            </span>
          </div>
          
          {/* Total Final */}
          <div className="flex justify-between items-end pt-3 border-t border-zinc-200">
            <span className="text-sm font-black text-zinc-500">Total a cobrar</span>
            <span className="text-3xl font-black text-zinc-950">
              {new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(grandTotal)}
            </span>
          </div>

          {/* BOTÓN CON ESTADO DE CARGA Y FUNCIÓN ONCLICK */}
          <button 
            disabled={!selectedClient || cart.length === 0 || isSubmitting}
            onClick={handleConfirmSale}
            className="w-full bg-zinc-950 text-white h-14 rounded-xl font-black text-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-2 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Procesando...
              </>
            ) : (
              'Confirmar Venta'
            )}
          </button>
        </div>

      </div>

      <ClientSelectorModal 
        isOpen={isClientModalOpen} 
        onClose={() => setIsClientModalOpen(false)} 
        onSelectClient={setSelectedClient}
      />
      <ProductSelectorModal 
        isOpen={isProductModalOpen} 
        onClose={() => setIsProductModalOpen(false)} 
        onAddProducts={handleAddProducts} 
      />
    </div>
  );
}