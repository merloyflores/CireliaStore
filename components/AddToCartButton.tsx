'use client';

import { useState } from 'react';
import { ShoppingBag, Heart, Check, Minus, Plus } from 'lucide-react';
import { useCartStore } from '@/app/store/useCartStore';

export default function AddToCartButton({ product }: { product: any }) {
  const addToCart = useCartStore((s) => s.addToCart);
  const toggleFavorite = useCartStore((s) => s.toggleFavorite);
  const favorites = useCartStore((s) => s.favorites);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const isFav = favorites.some((f) => f.id === product.id);
  const outOfStock = (product.stock ?? 0) <= 0;
  const effectivePrice =
    product.is_on_sale && product.sale_price ? Number(product.sale_price) : Number(product.price);

  const handleAdd = () => {
    if (outOfStock) return;
    for (let i = 0; i < qty; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        price: effectivePrice,
        image_url: product.image_url,
        currency: product.currency,
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="flex flex-col gap-4">
      {!outOfStock && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">Cantidad</span>
          <div className="flex items-center border border-ink-200 rounded-full overflow-hidden">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-9 h-9 flex items-center justify-center text-ink-500 hover:bg-ink-50 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-10 text-center text-sm font-bold text-ink-900">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(product.stock ?? 99, q + 1))}
              className="w-9 h-9 flex items-center justify-center text-ink-500 hover:bg-ink-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleAdd}
          disabled={outOfStock}
          className={`flex-1 flex items-center justify-center gap-2 h-13 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] ${
            outOfStock
              ? 'bg-ink-100 text-ink-400 cursor-not-allowed'
              : added
                ? 'bg-emerald-600 text-cream-50'
                : 'bg-ink-900 text-cream-50 hover:bg-gold-600'
          }`}
        >
          {outOfStock ? (
            'Agotado'
          ) : added ? (
            <>
              <Check className="w-4 h-4" /> Agregado al carrito
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" /> Agregar al carrito
            </>
          )}
        </button>
        <button
          onClick={() => toggleFavorite({ id: product.id, name: product.name, price: effectivePrice, image_url: product.image_url })}
          className={`w-13 h-13 shrink-0 flex items-center justify-center rounded-2xl border transition-colors ${
            isFav ? 'bg-gold-50 border-gold-300 text-gold-600' : 'border-ink-200 text-ink-400 hover:border-gold-300 hover:text-gold-600'
          }`}
        >
          <Heart className="w-5 h-5" fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>
    </div>
  );
}
