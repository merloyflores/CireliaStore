'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '../store/useCartStore';
import { Heart, ChevronLeft, ShoppingBag } from 'lucide-react';

function money(amount: number, currency: string = 'CRC') {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export default function FavoritesPage() {
  const favorites = useCartStore((s) => s.favorites);
  const toggleFavorite = useCartStore((s) => s.toggleFavorite);
  const addToCart = useCartStore((s) => s.addToCart);

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-cream-50 px-4">
        <div className="w-28 h-28 bg-cream-200 rounded-full flex items-center justify-center mb-8">
          <Heart size={40} className="text-ink-400" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink-900 mb-3 text-center">Tu lista está vacía</h1>
        <p className="text-ink-500 mb-8 max-w-md text-center">Guardá las piezas que más te gusten para verlas más tarde.</p>
        <Link href="/shop" className="bg-ink-900 text-cream-50 px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-gold-600 transition-all">
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

        <div className="flex items-end justify-between mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl text-ink-900">Favoritos</h1>
          <span className="text-ink-500 font-medium bg-cream-200 px-3 py-1 rounded-full text-xs">
            {favorites.length} {favorites.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {favorites.map((product) => (
            <div key={product.id} className="group relative bg-white rounded-2xl border border-ink-100 overflow-hidden hover:shadow-lg hover:shadow-ink-900/5 transition-all">
              <button
                onClick={() => toggleFavorite(product)}
                className="absolute top-3 right-3 z-10 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-red-500 shadow-sm hover:bg-red-500 hover:text-white transition-colors"
                title="Quitar de favoritos"
              >
                <Heart size={16} fill="currentColor" />
              </button>

              <Link href={`/product/${product.id}`} className="block">
                <div className="relative aspect-square bg-cream-200">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, 25vw" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-300 font-serif text-3xl">
                      {product.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-ink-900 truncate">{product.name}</h3>
                  <span className="text-sm font-bold text-ink-700 mt-1 block">{money(product.price, product.currency)}</span>
                </div>
              </Link>

              <button
                onClick={() => addToCart(product)}
                className="w-full flex items-center justify-center gap-2 bg-cream-100 hover:bg-ink-900 hover:text-cream-50 text-ink-700 text-xs font-bold py-3 border-t border-ink-100 transition-colors"
              >
                <ShoppingBag size={14} /> Agregar al carrito
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
