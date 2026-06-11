'use client';

import { useState } from 'react';
import { useCartStore } from '../app/store/useCartStore'; 
import { ShoppingCart, Heart, Minus, Plus, Trash2, Check, ShieldCheck } from 'lucide-react';

export default function ProductActions({ product }: { product: any }) {
  const { addToCart, removeFromCart, cart, toggleFavorite, favorites } = useCartStore();
  
  const cartItem = cart.find((item) => item.id === product.id);
  const isFavorite = favorites.some((fav) => fav.id === product.id);
  const stockDisponible = product.stock || 10;

  const [localQuantity, setLocalQuantity] = useState(1);

  const handleWhatsApp = () => {
    const mensaje = `¡Hola Cirelia! 👋 Me interesa obtener más información sobre: *${product.name}*. ¿Podrían ayudarme?`;
    window.open(`https://wa.me/50670305676?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  return (
    <div className="flex flex-col gap-5 mb-10 w-full">
      
      {/* SECCIÓN DINÁMICA: Opciones de Compra */}
      <div className="w-full space-y-4">
        {cartItem ? (
          /* VISTA: YA ESTÁ EN EL CARRITO */
          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em] mb-1">
              <Check size={14} strokeWidth={3} /> En tu carrito de compras
            </div>
            
            <div className="flex items-center gap-4 w-full">
              {/* Selector de Cantidad Premium (En Carrito) */}
              <div className="flex items-center bg-zinc-100 rounded-2xl p-1.5 h-16 w-40 shrink-0 shadow-inner">
                <button 
                  onClick={() => removeFromCart(product.id)}
                  className="flex-1 flex items-center justify-center bg-white shadow-sm hover:shadow text-zinc-600 rounded-xl h-full transition-all"
                >
                  <Minus size={16} />
                </button>
                <span className="flex-1 text-center font-black text-xl text-zinc-900">{cartItem.quantity}</span>
                <button 
                  onClick={() => addToCart(product)}
                  className="flex-1 flex items-center justify-center bg-white shadow-sm hover:shadow text-zinc-600 rounded-xl h-full transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Botón Eliminar */}
              <button 
                onClick={() => removeFromCart(product.id)}
                className="flex-1 h-16 rounded-2xl border-2 border-zinc-100 text-zinc-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all flex items-center justify-center gap-2 font-bold text-xs tracking-wider"
              >
                <Trash2 size={18} /> QUITAR
              </button>
            </div>
          </div>
        ) : (
          /* VISTA: NO ESTÁ EN EL CARRITO */
          <div className="flex flex-col gap-4 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
              
              {/* Selector de Cantidad Premium (Antes de añadir) */}
              <div className="flex items-center bg-zinc-100 rounded-2xl p-1.5 h-16 w-36 shrink-0 shadow-inner">
                <button 
                  onClick={() => setLocalQuantity(Math.max(1, localQuantity - 1))} 
                  className="flex-1 flex items-center justify-center bg-white shadow-sm hover:shadow text-zinc-600 rounded-xl h-full transition-all"
                >
                  <Minus size={16}/>
                </button>
                <span className="flex-1 text-center font-black text-lg text-zinc-900">{localQuantity}</span>
                <button 
                  onClick={() => setLocalQuantity(Math.min(stockDisponible, localQuantity + 1))} 
                  className="flex-1 flex items-center justify-center bg-white shadow-sm hover:shadow text-zinc-600 rounded-xl h-full transition-all"
                >
                  <Plus size={16}/>
                </button>
              </div>

              {/* Botón Principal (Añadir) */}
              <button 
                onClick={() => {
                  for(let i = 0; i < localQuantity; i++) addToCart(product);
                }}
                className="flex-1 bg-zinc-950 text-white h-16 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-sky-600 transition-all shadow-xl hover:shadow-sky-600/30 active:scale-95 text-lg"
              >
                <ShoppingCart size={22} /> 
                <span className="hidden sm:inline">Añadir al Carrito</span>
                <span className="sm:hidden">Añadir</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BOTONES SECUNDARIOS (Favoritos y WhatsApp) */}
      <div className="flex gap-4 w-full pt-1">
        
        {/* Botón Favoritos */}
        <button 
          onClick={() => toggleFavorite(product)}
          className={`h-16 w-16 shrink-0 rounded-2xl border-2 font-bold transition-all flex items-center justify-center active:scale-90 ${
            isFavorite 
              ? 'bg-red-50 border-red-100 text-red-500 shadow-inner' 
              : 'border-zinc-100 text-zinc-400 hover:text-red-500 hover:border-red-100 bg-white'
          }`}
        >
          <Heart size={24} fill={isFavorite ? "currentColor" : "none"} className={isFavorite ? "animate-in zoom-in duration-300" : ""} />
        </button>

        {/* Botón WhatsApp PRO */}
        <button 
          onClick={handleWhatsApp}
          className="flex-1 h-16 rounded-2xl bg-[#25D366]/10 text-[#1da851] border border-[#25D366]/20 font-bold flex items-center justify-center gap-3 hover:bg-[#25D366]/20 transition-all active:scale-95"
        >
          {/* SVG Original de WhatsApp */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          <span className="hidden sm:inline text-[#1da851]">Consultar a un asesor</span>
          <span className="sm:hidden text-[#1da851]">Consultar</span>
        </button>
      </div>

      {/* Trust Badge / Info de Stock */}
      <div className="flex flex-col gap-2 mt-2">
        {stockDisponible < 5 && (
          <p className="text-[10px] text-red-500 font-black uppercase tracking-[0.2em] text-center">
            🔥 Quedan muy pocas unidades en Cirelia
          </p>
        )}
        <div className="flex items-center justify-center gap-1.5 text-zinc-400">
          <ShieldCheck size={14} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Pago Seguro y Encriptado</span>
        </div>
      </div>

    </div>
  );
}