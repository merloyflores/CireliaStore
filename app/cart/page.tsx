'use client';

import { useState } from 'react';
import { useCartStore } from '../store/useCartStore';
import SectionContainer from "@/components/SectionContainer";
import Link from 'next/link';
import { Trash2, ArrowRight, ShoppingBag, ChevronLeft, CreditCard, Smartphone, ShieldCheck, Lock } from 'lucide-react';

export default function CartPage() {
  const { cart, removeFromCart } = useCartStore();
  const [selectedPayment, setSelectedPayment] = useState('card');
  
  // Estado para el formulario de tarjeta "Provisional"
  const [cardInfo, setCardInfo] = useState({ holder: '', number: '', expiry: '', cvc: '' });

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const paypalFee = selectedPayment === 'paypal' ? subtotal * 0.05 : 0;
  const total = subtotal + paypalFee;

  const paymentMethods = [
    { id: 'card', name: 'Tarjeta de Crédito', icon: <CreditCard size={20} />, desc: 'Procesamiento Seguro' },
    { id: 'emma', name: 'Emma Pay', icon: <ShieldCheck size={20} />, desc: 'Cuotas mensuales' },
    { id: 'sinpe', name: 'SINPE Móvil', icon: <Smartphone size={20} />, desc: 'WhatsApp +(506) 7030-5676' },
    { id: 'paypal', name: 'PayPal', icon: <span className="font-black text-xs">P</span>, desc: '+5% comisión' },
  ];

  const handleFinalize = () => {
    const productosMsg = cart.map(item => `- ${item.name} (x${item.quantity})`).join('%0A');
    let mensaje = '';

    if (selectedPayment === 'card') {
      mensaje = `¡Hola Cirelia! 👋 Quiero pagar con TARJETA.%0A%0A*Pedido:*%0A${productosMsg}%0A%0A*Total:* $${total.toLocaleString()}%0A*Cliente:* ${cardInfo.holder}%0A*Solicito link de pago seguro.*`;
    } else if (selectedPayment === 'sinpe') {
      mensaje = `¡Hola Cirelia! 👋 Quiero pagar por SINPE MÓVIL.%0A%0A*Pedido:*%0A${productosMsg}%0A%0A*Total:* $${total.toLocaleString()}`;
    } else {
      mensaje = `¡Hola Cirelia! 👋 Me interesa el método ${selectedPayment} para mi pedido de $${total.toLocaleString()}.`;
    }

    window.open(`https://wa.me/50670305676?text=${mensaje}`, '_blank');
  };

  if (cart.length === 0) {
    return (
      <div className="py-40 text-center bg-white min-h-screen">
        <ShoppingBag size={80} className="mx-auto text-zinc-100 mb-8" />
        <h1 className="text-4xl font-black text-zinc-950 mb-4 tracking-tighter">Tu carrito está vacío</h1>
        <Link href="/shop" className="bg-sky-600 text-white px-10 py-4 rounded-full font-bold shadow-lg hover:bg-sky-700 transition-all inline-block">Explorar Catálogo</Link>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 min-h-screen">
      <SectionContainer>
        <Link href="/shop" className="flex items-center gap-2 text-zinc-400 hover:text-zinc-950 transition mb-10 text-xs font-black uppercase tracking-widest">
          <ChevronLeft size={14} /> Continuar comprando
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* LISTA DE ARTÍCULOS (Lado Izquierdo) */}
          <div className="lg:col-span-2 space-y-4">
            <h1 className="text-5xl font-black text-zinc-950 mb-8 tracking-tighter">Tu Selección</h1>
            {cart.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-zinc-100 flex items-center gap-6">
                <div className="w-24 h-24 rounded-3xl overflow-hidden bg-zinc-100 shrink-0">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest">{item.category}</span>
                  <h3 className="text-lg font-black text-zinc-950 leading-tight">{item.name}</h3>
                  <p className="text-zinc-400 text-sm font-medium">Cant: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-zinc-950">${(item.price * item.quantity).toLocaleString()}</p>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-full transition"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>

          {/* CHECKOUT BOX (Lado Derecho) */}
          <div className="bg-zinc-950 rounded-[3rem] p-8 text-white h-fit shadow-2xl sticky top-8 border border-zinc-800">
            <h2 className="text-2xl font-black mb-6 tracking-tighter">Checkout Seguro</h2>
            
            {/* MÉTODOS DE PAGO */}
            <div className="space-y-2 mb-8">
              {paymentMethods.map((m) => (
                <button 
                  key={m.id} 
                  onClick={() => setSelectedPayment(m.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${selectedPayment === m.id ? 'border-sky-500 bg-sky-500/10' : 'border-zinc-800 bg-zinc-900/40'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedPayment === m.id ? 'bg-sky-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>{m.icon}</div>
                  <div className="text-left"><p className="text-xs font-bold">{m.name}</p></div>
                </button>
              ))}
            </div>

            {/* FORMULARIO DE TARJETA (Solo si se selecciona tarjeta) */}
            {selectedPayment === 'card' && (
              <div className="mb-8 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Detalles de Facturación</p>
                <input 
                  type="text" placeholder="Nombre completo del titular" 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs outline-none focus:border-sky-500 transition"
                  onChange={(e) => setCardInfo({...cardInfo, holder: e.target.value})}
                />
                <div className="flex gap-2">
                  <input type="text" placeholder="MM/AA" className="w-1/2 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs outline-none focus:border-sky-500" />
                  <input type="text" placeholder="CVC" className="w-1/2 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs outline-none focus:border-sky-500" />
                </div>
                <div className="bg-zinc-900/50 p-3 rounded-xl border border-dashed border-zinc-800 flex items-start gap-3">
                  <Lock size={14} className="text-sky-500 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-zinc-400 font-medium">Tus datos están protegidos. Para tu seguridad, el cobro se procesará mediante un link oficial enviado por nuestro equipo.</p>
                </div>
              </div>
            )}

            <div className="border-t border-zinc-800 pt-6 mb-8 space-y-2 text-sm font-medium">
              <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span>${subtotal.toLocaleString()}</span></div>
              {selectedPayment === 'paypal' && <div className="flex justify-between text-amber-400"><span>Impuesto PayPal</span><span>+${paypalFee.toLocaleString()}</span></div>}
              <div className="flex justify-between text-3xl font-black pt-4 border-t border-zinc-800"><span>Total</span><span className="text-sky-400">${total.toLocaleString()}</span></div>
            </div>

            <button 
              onClick={handleFinalize}
              className="w-full bg-white text-zinc-950 h-16 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-sky-500 hover:text-white transition-all shadow-xl active:scale-95"
            >
              Completar Pedido <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}