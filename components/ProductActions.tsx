'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '../app/store/useCartStore'; 
import { ShoppingCart, Heart, MessageCircle, Minus, Plus, Trash2, Check } from 'lucide-react';

export default function ProductActions({ product }: { product: any }) {
  // Extraemos las funciones necesarias del store
  const { addToCart, removeFromCart, cart, toggleFavorite, favorites } = useCartStore();
  
  // Verificamos si el producto ya existe en el carrito
  const cartItem = cart.find((item) => item.id === product.id);
  const isFavorite = favorites.some((fav) => fav.id === product.id);
  const stockDisponible = product.stock || 10;

  // Estado local para la cantidad antes de añadir (por defecto 1)
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
              {/* Selector de Cantidad (Actualiza el store directamente) */}
              <div className="flex items-center bg-zinc-100 rounded-2xl p-1 h-16 w-40 shrink-0">
                <button 
                  onClick={() => removeFromCart(product.id)}
                  className="flex-1 flex items-center justify-center hover:bg-white rounded-xl h-full transition-all"
                >
                  <Minus size={16} />
                </button>
                <span className="flex-1 text-center font-black text-xl">{cartItem.quantity}</span>
                <button 
                  onClick={() => addToCart(product)}
                  className="flex-1 flex items-center justify-center hover:bg-white rounded-xl h-full transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Botón Eliminar (Rápido y accesible) */}
              <button 
                onClick={() => removeFromCart(product.id)}
                className="flex-1 h-16 rounded-2xl border-2 border-zinc-100 text-zinc-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all flex items-center justify-center gap-2 font-bold text-xs"
              >
                <Trash2 size={18} /> QUITAR
              </button>
            </div>
          </div>
        ) : (
          /* VISTA: NO ESTÁ EN EL CARRITO */
          <div className="flex flex-col gap-4 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
              {/* Cantidad inicial antes de añadir */}
              <div className="flex items-center bg-zinc-50 border border-zinc-100 rounded-2xl p-1 h-16 w-32 shrink-0">
                <button onClick={() => setLocalQuantity(Math.max(1, localQuantity - 1))} className="flex-1 flex items-center justify-center"><Minus size={14}/></button>
                <span className="flex-1 text-center font-bold">{localQuantity}</span>
                <button onClick={() => setLocalQuantity(Math.min(stockDisponible, localQuantity + 1))} className="flex-1 flex items-center justify-center"><Plus size={14}/></button>
              </div>

              <button 
                onClick={() => {
                  // Añadimos al carrito con la cantidad seleccionada
                  for(let i = 0; i < localQuantity; i++) addToCart(product);
                }}
                className="flex-1 bg-zinc-950 text-white h-16 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-sky-600 transition-all shadow-xl active:scale-95 text-lg"
              >
                <ShoppingCart size={22} /> Añadir al Carrito
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BOTONES SECUNDARIOS (Favoritos y WhatsApp) */}
      <div className="flex gap-4 w-full pt-2">
        {/* Botón Favoritos - Siempre visible para el cliente */}
        <button 
          onClick={() => toggleFavorite(product)}
          className={`flex-1 h-16 rounded-2xl border-2 font-bold transition-all flex items-center justify-center active:scale-90 ${
            isFavorite 
              ? 'bg-red-50 border-red-100 text-red-500 shadow-inner' 
              : 'border-zinc-100 text-zinc-400 hover:text-red-500 hover:border-red-100 bg-white'
          }`}
        >
          <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
        </button>

        {/* WhatsApp siempre disponible */}
        <button 
          onClick={handleWhatsApp}
          className="flex-2 h-16 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold flex items-center justify-center gap-3 hover:bg-emerald-100 transition-all active:scale-95"
        >
          <MessageCircle size={22} />
          <span className="hidden sm:inline">Consultar a un asesor</span>
          <span className="sm:hidden">Consultar</span>
        </button>
      </div>

      {stockDisponible < 5 && (
        <p className="text-[10px] text-red-500 font-black uppercase tracking-[0.2em] text-center mt-2">
          🔥 Quedan muy pocas unidades en Cirelia
        </p>
      )}
    </div>
  );
}