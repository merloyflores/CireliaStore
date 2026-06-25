'use client';

import { StarIcon } from '@heroicons/react/20/solid';
import { HeartIcon, ShoppingCartIcon, CheckIcon, XCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useCartStore } from '../app/store/useCartStore';

export default function ProductCard({ product }: { product: any }) {
  const { addToCart, cart, toggleFavorite, favorites } = useCartStore();

  const isInCart = cart.some((item) => item.id === product.id);
  const isFavorite = favorites.some((fav) => fav.id === product.id);
  const isOutOfStock = product.stock === 0;

  // Lógica de Precios y Descuento segura
  const price = Number(product.price) || 0;
  const promoPrice = Number(product.promo_price) || 0;
  // Solo hay promo si hay precio promo y es menor al normal
  const hasPromo = promoPrice > 0 && promoPrice < price;
  const isPromoTag = product.is_promo === true;
  const discountPercentage = hasPromo ? Math.round(((price - promoPrice) / price) * 100) : 0;

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    action();
  };

  return (
    <Link href={`/product/${product.id}`} className="group block h-full">
      <div className={`bg-white border border-zinc-100 rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full cursor-pointer relative ${isOutOfStock ? 'opacity-70 grayscale-[0.5]' : ''}`}>

        {/* BOTÓN FAVORITOS */}
        <button
          onClick={(e) => handleAction(e, () => toggleFavorite(product))}
          className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-zinc-100 hover:scale-110 transition-all active:scale-90"
        >
          {isFavorite ? <HeartSolid className="h-5 w-5 text-red-500" /> : <HeartIcon className="h-5 w-5 text-zinc-400 hover:text-red-500" />}
        </button>

        {/* Contenedor de Imagen */}
        <div className="relative aspect-square mb-4 bg-zinc-50 rounded-xl overflow-hidden">
          {/* TAG DE DESCUENTO (Solo aparece si hasPromo es true) */}
          {hasPromo && (
            <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg z-10">
              -{discountPercentage}%
            </div>
          )}

          <img
            src={product.image_url}
            alt={product.name}
            className="object-contain w-full h-full p-4 group-hover:scale-110 transition-transform duration-700"
          />

          <div className="absolute bottom-3 left-3 flex flex-col gap-2">
            {isPromoTag && (
              <div className="bg-amber-400 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                <SparklesIcon className="h-3 w-3" /> OFERTA ESPECIAL
              </div>
            )}
            {product.is_fast_delivery && (
              <div className="bg-white/90 backdrop-blur-sm text-emerald-600 text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm border border-emerald-50">
                <span>⚡</span> EXPRESS
              </div>
            )}
          </div>
        </div>

        {/* Info del Producto */}
        <div className="flex flex-col grow">
          <div className="flex flex-col">
            {/* LOGICA DE PRECIO TACHADO */}
            {hasPromo ? (
              <div className="flex items-center gap-2">
                <span className="text-zinc-950 font-black text-xl tracking-tighter">
                  ₡{promoPrice.toLocaleString('es-CR')}
                </span>
                <span className="text-zinc-400 font-medium text-xs line-through decoration-zinc-400">
                  ₡{price.toLocaleString('es-CR')}
                </span>
              </div>
            ) : (
              <span className="text-zinc-950 font-black text-xl tracking-tighter">
                ₡{price.toLocaleString('es-CR')}
              </span>
            )}
          </div>

          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-black mt-2">
            {product.brand || 'Cirelia'}
          </span>

          <h3 className="text-sm text-zinc-600 font-medium line-clamp-2 mt-1 leading-tight h-10 group-hover:text-sky-600 transition-colors">
            {product.name}
          </h3>

          {/* Estrellas */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => <StarIcon key={i} className="h-3 w-3" />)}
            </div>
            <span className="text-[10px] text-zinc-400 font-bold tracking-widest">({product.review_count || '24'})</span>
          </div>

          {/* BOTÓN ACCIÓN */}
          <button
            onClick={(e) => handleAction(e, () => addToCart(product))}
            disabled={isOutOfStock}
            className={`mt-5 w-full h-12 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${isOutOfStock
                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                : isInCart
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  : 'bg-zinc-950 text-white hover:bg-sky-600 shadow-lg shadow-zinc-200'
              }`}
          >
            {isOutOfStock ? (
              <>
                <XCircleIcon className="h-4 w-4" /> SIN STOCK
              </>
            ) : isInCart ? (
              <>
                <CheckIcon className="h-4 w-4 stroke-[3px]" /> EN CARRITO
              </>
            ) : (
              <>
                <ShoppingCartIcon className="h-4 w-4" /> AÑADIR
              </>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}