'use client';

import { useState } from 'react';
import { useCartStore } from '../store/useCartStore';
import SectionContainer from "@/components/SectionContainer";
import Link from 'next/link';
import { Trash2, ArrowRight, ShoppingBag, ChevronLeft, CreditCard, Smartphone, ShieldCheck, Lock, Info, Receipt, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// 1. Inicializamos Stripe limpiando cualquier espacio invisible de la variable de entorno
const rawStripeKey = process.env.NEXT_PUBLIC_STRIPE_KEY || "";
const cleanStripeKey = rawStripeKey.replace(/\s+/g, '').trim();
const stripePromise = loadStripe(cleanStripeKey);

// Constante de métodos de pago
const paymentMethods = [
  { id: 'card', name: 'Tarjeta de Crédito/Débito', icon: <CreditCard size={20} />, desc: 'Pago seguro en línea' },
  { id: 'paypal', name: 'PayPal', icon: <span className="font-black text-xs">P</span>, desc: 'Comisión del 5%' },
  { id: 'sinpe', name: 'SINPE Móvil', icon: <Smartphone size={20} />, desc: 'Transferencia directa' },
  { id: 'emma', name: 'Emma Pay', icon: <ShieldCheck size={20} />, desc: 'Paga a cuotas' },
];

// 2. Sub-componente seguro que maneja el formulario
const CheckoutSidebar = ({ cart, subtotal, taxes, baseTotal }: any) => {
  const stripe = useStripe();
  const elements = useElements();
  
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [cardHolder, setCardHolder] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Cálculos dinámicos basados en la selección
  const paypalFee = selectedPayment === 'paypal' ? baseTotal * 0.05 : 0;
  const finalTotal = baseTotal + paypalFee;

  const handleWhatsAppFlow = () => {
    // Función para formatear a Colones
    const formatCurrency = (amount: number) => 
      new Intl.NumberFormat('es-CR', { 
        style: 'currency', 
        currency: 'CRC',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
      }).format(amount);
      
    const productosMsg = cart.map((item: any) => `▪ ${item.name} (x${item.quantity}) - ${formatCurrency(item.price * item.quantity)}`).join('%0A');
    
    let mensaje = `¡Hola! 👋 Me gustaría procesar mi pedido.%0A%0A*📦 RESUMEN DEL PEDIDO:*%0A${productosMsg}%0A%0A*📊 DESGLOSE:*%0ASubtotal: ${formatCurrency(subtotal)}%0AIVA (13%): ${formatCurrency(taxes)}`;
    
    if (paypalFee > 0) mensaje += `%0AComisión PayPal: ${formatCurrency(paypalFee)}`;
    
    mensaje += `%0A*TOTAL: ${formatCurrency(finalTotal)}*%0A%0A*💳 MÉTODO DE PAGO:* ${paymentMethods.find(m => m.id === selectedPayment)?.name}`;

    window.open(`https://wa.me/50670305676?text=${mensaje}`, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedPayment !== 'card') {
      handleWhatsAppFlow();
      return;
    }

    if (!stripe || !elements) {
      console.error("Stripe.js aún no se ha cargado");
      return;
    }

    setIsProcessing(true);
    
    // Verificación explícita
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
        console.error("El elemento CardElement no se encuentra en el DOM");
        setIsProcessing(false);
        return;
    }

    try {
      const result = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: { name: cardHolder },
      });

      if (result.error) {
        // En lugar de loguear el objeto vacío, logueamos el stringify
        console.error("Detalle completo del error:", JSON.stringify(result.error, null, 2));
        alert(`Error: ${result.error.message || "Ocurrió un error desconocido con la tarjeta"}`);
      } else {
        console.log("[Stripe Success]", result.paymentMethod);
        alert(`¡Validación exitosa! ID: ${result.paymentMethod.id}`);
      }
    } catch (err) {
      console.error("Error inesperado en la llamada a Stripe:", err);
    }
    
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-200/60 sticky top-12">
      <h2 className="text-2xl font-black mb-8 text-zinc-900 tracking-tight flex items-center gap-3">
        <Lock size={24} className="text-green-500" />
        Pago Seguro
      </h2>
      
      {/* SELECTOR DE MÉTODOS DE PAGO */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {paymentMethods.map((m) => (
          <button 
            type="button" 
            key={m.id} 
            onClick={() => setSelectedPayment(m.id)}
            className={`flex flex-col items-start gap-3 p-4 rounded-2xl border-2 transition-all duration-200 ${
              selectedPayment === m.id 
                ? 'border-zinc-900 bg-zinc-900 text-white shadow-md' 
                : 'border-zinc-100 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:bg-white'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedPayment === m.id ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
              {m.icon}
            </div>
            <div className="text-left">
              <p className={`text-sm font-bold leading-tight ${selectedPayment === m.id ? 'text-white' : 'text-zinc-900'}`}>{m.name}</p>
              <p className={`text-[10px] mt-1 font-medium ${selectedPayment === m.id ? 'text-zinc-300' : 'text-zinc-400'}`}>{m.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* FORMULARIO DE TARJETA CON STRIPE */}
      {selectedPayment === 'card' && (
        <div className="mb-8 p-5 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black text-zinc-900 uppercase tracking-widest">Datos del Titular</p>
            <div className="flex gap-1">
              <div className="w-8 h-5 bg-zinc-200 rounded flex items-center justify-center text-[8px] font-bold text-zinc-500">VISA</div>
              <div className="w-8 h-5 bg-zinc-200 rounded flex items-center justify-center text-[8px] font-bold text-zinc-500">MC</div>
            </div>
          </div>
          
          <input 
            type="text" 
            placeholder="Nombre como aparece en la tarjeta" 
            required={selectedPayment === 'card'}
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-xl p-3.5 text-sm font-medium outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
          />
          
          <div className="w-full bg-white border border-zinc-200 rounded-xl p-3.5 transition-all focus-within:border-zinc-900 focus-within:ring-1 focus-within:ring-zinc-900">
            <CardElement 
              onReady={() => console.log("Stripe CardElement listo")}
              onChange={(event) => {
                if (event.error) console.log("Error de validación en tiempo real:", event.error.message);
              }}
              options={{
                style: {
                  base: {
                    fontSize: '14px',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    color: '#18181b',
                    '::placeholder': { color: '#a1a1aa' },
                  },
                  invalid: { color: '#ef4444' },
                },
              }}
            />
          </div>

          <div className="bg-sky-50 p-4 rounded-xl border border-sky-100 flex items-start gap-3">
            <Info size={16} className="text-sky-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-sky-800 font-medium leading-relaxed">
              El procesamiento se realiza a través de Stripe (PCI-DSS). Nosotros no almacenamos los datos de tu tarjeta.
            </p>
          </div>
        </div>
      )}

      {/* RESUMEN FINANCIERO */}
      <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 mb-8 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Receipt size={16} className="text-zinc-400" />
          <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Resumen de Orden</h3>
        </div>
        
        <div className="flex justify-between text-sm font-medium text-zinc-600">
          <span>Subtotal</span>
          <span>{new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(subtotal)}</span>
        </div>
        
        <div className="flex justify-between text-sm font-medium text-zinc-600">
          <span className="flex items-center gap-1">Impuestos (IVA 13%)</span>
          <span>{new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(taxes)}</span>
        </div>

        {selectedPayment === 'paypal' && (
          <div className="flex justify-between text-sm font-medium text-amber-600">
            <span>Comisión PayPal (5%)</span>
            <span>+{new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(paypalFee)}</span>
          </div>
        )}
        
        <div className="pt-4 mt-2 border-t border-zinc-200 flex justify-between items-end">
          <div>
            <span className="block text-sm font-medium text-zinc-500">Total a pagar</span>
            <span className="block text-xs text-zinc-400 mt-0.5">Incluye impuestos aplicables</span>
          </div>
          <span className="text-3xl font-black text-zinc-900">
            {new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(finalTotal)}
          </span>
        </div>
      </div>

      {/* BOTÓN DE ACCIÓN */}
      <button 
        type="submit"
        disabled={isProcessing || (selectedPayment === 'card' && !stripe)}
        className="w-full bg-zinc-900 text-white h-16 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all shadow-[0_8px_20px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_25px_rgb(0,0,0,0.18)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>
            <Loader2 size={20} className="animate-spin" /> Procesando...
          </>
        ) : (
          <>
            Procesar Pedido <ArrowRight size={20} />
          </>
        )}
      </button>
    </form>
  );
};

// 3. Componente Principal (Vista)
export default function CartPage() {
  const { cart, removeFromCart } = useCartStore();

  const subtotal = cart.reduce((acc: any, item: any) => acc + (item.price * item.quantity), 0);
  const taxRate = 0.13;
  const taxes = subtotal * taxRate;
  const baseTotal = subtotal + taxes;

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-zinc-50 px-4">
        <div className="w-32 h-32 bg-zinc-200/50 rounded-full flex items-center justify-center mb-8">
          <ShoppingBag size={48} className="text-zinc-400" />
        </div>
        <h1 className="text-4xl font-black text-zinc-900 mb-3 tracking-tight">Tu carrito está vacío</h1>
        <p className="text-zinc-500 mb-8 max-w-md text-center">Parece que aún no has añadido nada. Descubre nuestros productos y encuentra lo que buscas.</p>
        <Link href="/shop" className="bg-zinc-900 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-zinc-900/20 hover:bg-zinc-800 hover:-translate-y-1 transition-all">
          Explorar Catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 min-h-screen pb-24 pt-12">
      <SectionContainer>
        <Link href="/shop" className="group flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors mb-8 text-sm font-bold w-fit">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
          Continuar comprando
        </Link>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
          
          {/* LADO IZQUIERDO: PRODUCTOS */}
          <div className="xl:col-span-7 space-y-6">
            <div className="flex items-end justify-between mb-8">
              <h1 className="text-4xl lg:text-5xl font-black text-zinc-900 tracking-tight">Tu Carrito</h1>
              <span className="text-zinc-500 font-medium mb-2 bg-zinc-100 px-3 py-1 rounded-full text-xs">
                {cart.length} {cart.length === 1 ? 'producto' : 'productos'}
              </span>
            </div>
            
            <div className="space-y-4">
              {cart.map((item: any) => (
                <div key={item.id} className="group bg-white p-5 rounded-3xl shadow-sm border border-zinc-200 flex items-center gap-6 hover:border-zinc-300 transition-all duration-300">
                  
                  {/* Imagen */}
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-zinc-100 shrink-0 shadow-inner">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest bg-sky-50 px-2 py-0.5 rounded w-fit">
                      {item.category}
                    </span>
                    <h3 className="text-lg font-bold text-zinc-900 leading-tight">{item.name}</h3>
                    <p className="text-zinc-400 text-xs font-semibold">Cantidad: <span className="text-zinc-900">{item.quantity}</span></p>
                  </div>

                  {/* Precio y Acciones */}
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-lg font-black text-zinc-900">
                      {new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(item.price * item.quantity)}
                    </p>
                    <button 
                      onClick={() => removeFromCart(item.id)} 
                      className="text-zinc-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide"
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LADO DERECHO: STRIPE PROVIDER */}
          <div className="xl:col-span-5 relative">
            {stripePromise && (
              <Elements stripe={stripePromise}>
                <CheckoutSidebar 
                  cart={cart} 
                  subtotal={subtotal} 
                  taxes={taxes} 
                  baseTotal={baseTotal} 
                />
              </Elements>
            )}
          </div>

        </div>
      </SectionContainer>
    </div>
  );
}