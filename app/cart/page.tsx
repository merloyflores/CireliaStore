'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '../store/useCartStore';
import { Trash2, ArrowRight, ShoppingBag, ChevronLeft, Minus, Plus } from 'lucide-react';

function money(amount: number, currency: string = 'CRC') {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export default function CartPage() {
  const cart = useCartStore((s) => s.cart);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-cream-50 px-4">
        <div className="w-28 h-28 bg-cream-200 rounded-full flex items-center justify-center mb-8">
          <ShoppingBag size={40} className="text-ink-400" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink-900 mb-3 text-center">Tu carrito está vacío</h1>
        <p className="text-ink-500 mb-8 max-w-md text-center">
          Parece que aún no has añadido nada. Descubrí nuestros productos.
        </p>
        <Link
          href="/shop"
          className="bg-ink-900 text-cream-50 px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-gold-600 transition-all"
        >
          Explorar catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-cream-50 min-h-screen pb-24 pt-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/shop"
          className="group flex items-center gap-2 text-ink-500 hover:text-ink-900 transition-colors mb-6 text-sm font-bold w-fit"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Continuar comprando
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-7">
            <div className="flex items-end justify-between mb-6">
              <h1 className="font-serif text-3xl sm:text-4xl text-ink-900">Tu carrito</h1>
              <span className="text-ink-500 font-medium bg-cream-200 px-3 py-1 rounded-full text-xs">
                {cart.length} {cart.length === 1 ? 'producto' : 'productos'}
              </span>
            </div>

            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-cream-100 p-4 sm:p-5 rounded-3xl border border-ink-100 flex items-center gap-4 sm:gap-6"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-cream-200 shrink-0 relative">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="96px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-300 font-serif text-2xl">
                        {item.name?.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <h3 className="text-sm sm:text-base font-semibold text-ink-900 leading-tight truncate">{item.name}</h3>
                    <div className="flex items-center border border-ink-200 rounded-full w-fit">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-ink-500 hover:bg-ink-50 rounded-full transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-ink-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-ink-500 hover:bg-ink-50 rounded-full transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="text-sm sm:text-base font-bold text-ink-900">
                      {money(item.price * item.quantity, item.currency)}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-ink-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide"
                    >
                      <Trash2 size={12} />
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-cream-100 rounded-3xl p-6 sm:p-8 border border-ink-100 sticky top-24">
              <h2 className="font-serif text-xl text-ink-900 mb-6">Resumen</h2>

              <div className="space-y-3 pb-6 border-b border-ink-200">
                <div className="flex justify-between text-sm text-ink-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-ink-900">{money(subtotal)}</span>
                </div>
                <p className="text-xs text-ink-400">El envío y los impuestos se calculan en el siguiente paso.</p>
              </div>

              <div className="flex justify-between items-end py-6">
                <span className="text-sm font-medium text-ink-500">Total estimado</span>
                <span className="text-2xl font-bold text-ink-900">{money(subtotal)}</span>
              </div>

              <Link
                href="/checkout"
                className="w-full flex items-center justify-center gap-2 bg-ink-900 text-cream-50 h-14 rounded-2xl font-bold hover:bg-gold-600 transition-all active:scale-[0.98]"
              >
                Ir a pagar <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
