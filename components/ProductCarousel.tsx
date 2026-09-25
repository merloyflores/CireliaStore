'use client';

/**
 * Fila de productos con scroll horizontal estilo Netflix: flechas a los
 * costados, arrastre táctil nativo, y "loop infinito" cuando hay
 * suficientes productos (triplicamos la lista y saltamos sin animación
 * cuando el scroll se acerca a los bordes de la copia del medio — el
 * truco clásico de los carruseles infinitos).
 *
 * Con pocos productos (4 o menos) no tiene sentido fingir un loop, así
 * que se muestra como una fila simple sin flechas.
 *
 * `cardStyle` elige el diseño de tarjeta: 'classic' (la de siempre,
 * solo imagen/nombre/precio) o 'commerce' (suma insignias de
 * promo/envío rápido/agotado y un botón para agregar al carrito sin
 * salir del home, como Gollo/Temu).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ShoppingBag, Check, Zap, Star } from 'lucide-react';
import { useCartStore } from '@/app/store/useCartStore';
import type { CardStyle } from '@/lib/blockBackground';

export type { CardStyle };

type Product = {
  id: string;
  name: string;
  price: number;
  sale_price?: number | null;
  image_url?: string | null;
  currency?: string;
  stock?: number | null;
  is_promo?: boolean | null;
  promo_price?: number | null;
  promo_badge?: string | null;
  is_fast_delivery?: boolean | null;
  is_express?: boolean | null;
  brand?: string | null;
  rating?: number | null;
  review_count?: number | null;
};

function money(amount: number, currency: string = 'CRC') {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export default function ProductCarousel({
  products,
  showSale = false,
  cardStyle = 'classic',
}: {
  products: Product[];
  showSale?: boolean;
  cardStyle?: CardStyle;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const loop = products.length > 4;
  const items = loop ? [...products, ...products, ...products] : products;

  // Arranca posicionado en la copia del medio, así hay margen para
  // "scrollear" hacia atrás sin quedarse sin contenido de ese lado.
  useEffect(() => {
    const el = trackRef.current;
    if (!loop || !el) return;
    el.scrollLeft = el.scrollWidth / 3;
  }, [loop, products.length]);

  // Cuando el scroll se acerca demasiado al principio o al final de la
  // lista triplicada, saltamos instantáneamente (sin animación) al
  // punto equivalente de la copia del medio — el usuario nunca ve el
  // salto porque el contenido en esa posición es idéntico.
  const handleScroll = useCallback(() => {
    const el = trackRef.current;
    if (!loop || !el) return;
    const third = el.scrollWidth / 3;
    if (el.scrollLeft < third * 0.5) {
      el.scrollLeft += third;
    } else if (el.scrollLeft > third * 1.5) {
      el.scrollLeft -= third;
    }
  }, [loop]);

  const scrollByCards = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    const step = card ? card.offsetWidth + 20 : 260;
    el.scrollBy({ left: step * 2 * dir, behavior: 'smooth' });
  };

  if (products.length === 0) return null;

  return (
    <div className="relative group/carousel">
      {loop && (
        <button
          type="button"
          onClick={() => scrollByCards(-1)}
          aria-label="Ver anteriores"
          className="hidden sm:flex absolute -left-4 top-[38%] -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-ink-100 items-center justify-center text-ink-600 hover:text-ink-950 hover:scale-105 transition-all opacity-0 group-hover/carousel:opacity-100"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex gap-4 sm:gap-5 overflow-x-auto custom-scrollbar scroll-smooth snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {items.map((p, i) =>
          cardStyle === 'commerce' ? (
            <CommerceCard key={`${p.id}-${i}`} product={p} showSale={showSale} />
          ) : cardStyle === 'rating' ? (
            <RatingCard key={`${p.id}-${i}`} product={p} showSale={showSale} />
          ) : cardStyle === 'compact' ? (
            <CompactCard key={`${p.id}-${i}`} product={p} showSale={showSale} />
          ) : (
            <ClassicCard key={`${p.id}-${i}`} product={p} showSale={showSale} />
          )
        )}
      </div>

      {loop && (
        <button
          type="button"
          onClick={() => scrollByCards(1)}
          aria-label="Ver más"
          className="hidden sm:flex absolute -right-4 top-[38%] -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-ink-100 items-center justify-center text-ink-600 hover:text-ink-950 hover:scale-105 transition-all opacity-0 group-hover/carousel:opacity-100"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}

function ClassicCard({ product: p, showSale }: { product: Product; showSale: boolean }) {
  return (
    <Link
      data-card
      href={`/product/${p.id}`}
      className="group shrink-0 w-[44vw] xs:w-[38vw] sm:w-52 lg:w-56 snap-start bg-cream-50 rounded-2xl border border-ink-100 overflow-hidden hover:shadow-lg hover:shadow-ink-900/5 transition-all"
    >
      <div className="relative aspect-square bg-cream-200">
        {p.image_url ? (
          <Image
            src={p.image_url}
            alt={p.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 45vw, 220px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-300 font-serif text-3xl">
            {p.name?.charAt(0)}
          </div>
        )}
        {showSale && p.sale_price && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
            OFERTA
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold text-ink-900 truncate">{p.name}</h3>
        {showSale && p.sale_price ? (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-bold text-gold-700">{money(p.sale_price, p.currency)}</span>
            <span className="text-xs text-ink-400 line-through">{money(p.price, p.currency)}</span>
          </div>
        ) : (
          <span className="text-sm font-bold text-ink-700 mt-1 block">{money(p.price, p.currency)}</span>
        )}
      </div>
    </Link>
  );
}

/**
 * Tarjeta "comercio": insignias de oferta/promo/envío rápido/agotado
 * leídas de columnas que products ya tenía (is_promo, promo_price,
 * promo_badge, is_fast_delivery, is_express, stock) pero que ninguna
 * tarjeta del home mostraba todavía, más un botón para agregar al
 * carrito sin entrar al producto.
 */
function CommerceCard({ product: p, showSale }: { product: Product; showSale: boolean }) {
  const addToCart = useCartStore((s) => s.addToCart);
  const [added, setAdded] = useState(false);
  const outOfStock = typeof p.stock === 'number' && p.stock <= 0;
  const hasPromo = Boolean(p.is_promo && p.promo_price);
  const hasSale = showSale && Boolean(p.sale_price) && !hasPromo;
  const effectivePrice = hasPromo ? Number(p.promo_price) : hasSale ? Number(p.sale_price) : Number(p.price);
  const fastDelivery = Boolean(p.is_fast_delivery || p.is_express);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addToCart({ id: p.id, name: p.name, price: effectivePrice, image_url: p.image_url, currency: p.currency });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Link
      data-card
      href={`/product/${p.id}`}
      className="group shrink-0 w-[44vw] xs:w-[38vw] sm:w-52 lg:w-56 snap-start bg-cream-50 rounded-2xl border border-ink-100 overflow-hidden hover:shadow-lg hover:shadow-ink-900/5 transition-all flex flex-col"
    >
      <div className="relative aspect-square bg-cream-200">
        {p.image_url ? (
          <Image
            src={p.image_url}
            alt={p.name}
            fill
            className={`object-cover group-hover:scale-105 transition-transform duration-500 ${outOfStock ? 'grayscale opacity-60' : ''}`}
            sizes="(max-width: 640px) 45vw, 220px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-300 font-serif text-3xl">
            {p.name?.charAt(0)}
          </div>
        )}

        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {hasPromo && (
            <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">
              {p.promo_badge || 'PROMO'}
            </span>
          )}
          {hasSale && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">OFERTA</span>
          )}
          {fastDelivery && !outOfStock && (
            <span className="bg-emerald-600 text-white text-[10px] font-bold pl-1.5 pr-2 py-1 rounded-full flex items-center gap-0.5">
              <Zap size={10} className="fill-current" /> Envío rápido
            </span>
          )}
        </div>

        {outOfStock && (
          <div className="absolute inset-0 bg-ink-950/40 flex items-center justify-center">
            <span className="bg-white/90 text-ink-900 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              Agotado
            </span>
          </div>
        )}

        {!outOfStock && (
          <button
            onClick={handleAdd}
            aria-label="Agregar al carrito"
            className={`absolute bottom-2 right-2 w-9 h-9 rounded-full shadow-md flex items-center justify-center transition-all active:scale-90 ${
              added ? 'bg-emerald-600 text-white' : 'bg-white text-ink-900 hover:bg-ink-900 hover:text-white'
            }`}
          >
            {added ? <Check size={16} /> : <ShoppingBag size={15} />}
          </button>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-sm font-semibold text-ink-900 truncate">{p.name}</h3>
        {hasPromo || hasSale ? (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-bold text-gold-700">{money(effectivePrice, p.currency)}</span>
            <span className="text-xs text-ink-400 line-through">{money(p.price, p.currency)}</span>
          </div>
        ) : (
          <span className="text-sm font-bold text-ink-700 mt-1 block">{money(p.price, p.currency)}</span>
        )}
      </div>
    </Link>
  );
}

/**
 * Tarjeta "reseñas": marca + estrellas + cantidad de reseñas y un
 * porcentaje de descuento grande en la esquina, estilo
 * marketplace (Temu/Nautica) — usa product.brand/rating/review_count,
 * columnas que ya existían en la base pero ninguna tarjeta mostraba.
 */
function RatingCard({ product: p, showSale }: { product: Product; showSale: boolean }) {
  const hasPromo = Boolean(p.is_promo && p.promo_price);
  const hasSale = showSale && Boolean(p.sale_price) && !hasPromo;
  const effectivePrice = hasPromo ? Number(p.promo_price) : hasSale ? Number(p.sale_price) : Number(p.price);
  const discountPct =
    (hasPromo || hasSale) && p.price > 0 ? Math.round((1 - effectivePrice / p.price) * 100) : 0;
  const rating = typeof p.rating === 'number' ? Math.max(0, Math.min(5, p.rating)) : null;

  return (
    <Link
      data-card
      href={`/product/${p.id}`}
      className="group shrink-0 w-[44vw] xs:w-[38vw] sm:w-52 lg:w-56 snap-start bg-cream-50 rounded-2xl border border-ink-100 overflow-hidden hover:shadow-lg hover:shadow-ink-900/5 transition-all"
    >
      <div className="relative aspect-square bg-cream-200">
        {p.image_url ? (
          <Image
            src={p.image_url}
            alt={p.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 45vw, 220px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-300 font-serif text-3xl">
            {p.name?.charAt(0)}
          </div>
        )}
        {discountPct > 1 && (
          <span className="absolute top-2 right-2 bg-rose-600 text-white text-xs font-black px-2 py-1 rounded-lg leading-none">
            -{discountPct}%
          </span>
        )}
      </div>
      <div className="p-4">
        {p.brand && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{p.brand}</span>
        )}
        <h3 className="text-sm font-semibold text-ink-900 truncate mt-0.5">{p.name}</h3>
        {rating !== null && (
          <div className="flex items-center gap-1 mt-1">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={11}
                  className={n <= Math.round(rating) ? 'fill-gold-500 text-gold-500' : 'fill-ink-100 text-ink-100'}
                />
              ))}
            </div>
            {typeof p.review_count === 'number' && p.review_count > 0 && (
              <span className="text-[11px] text-ink-400">({p.review_count})</span>
            )}
          </div>
        )}
        {hasPromo || hasSale ? (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-bold text-gold-700">{money(effectivePrice, p.currency)}</span>
            <span className="text-xs text-ink-400 line-through">{money(p.price, p.currency)}</span>
          </div>
        ) : (
          <span className="text-sm font-bold text-ink-700 mt-1 block">{money(p.price, p.currency)}</span>
        )}
      </div>
    </Link>
  );
}

/**
 * Tarjeta "compacta": versión chica pensada para filas con muchos
 * productos a la vez — solo imagen, nombre y precio, sin insignias, con
 * menos padding para que quepan más tarjetas visibles a la vez.
 */
function CompactCard({ product: p, showSale }: { product: Product; showSale: boolean }) {
  return (
    <Link
      data-card
      href={`/product/${p.id}`}
      className="group shrink-0 w-[32vw] xs:w-[28vw] sm:w-36 lg:w-40 snap-start bg-cream-50 rounded-xl border border-ink-100 overflow-hidden hover:shadow-md hover:shadow-ink-900/5 transition-all"
    >
      <div className="relative aspect-square bg-cream-200">
        {p.image_url ? (
          <Image
            src={p.image_url}
            alt={p.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 32vw, 160px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-300 font-serif text-2xl">
            {p.name?.charAt(0)}
          </div>
        )}
        {showSale && p.sale_price && (
          <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            OFERTA
          </span>
        )}
      </div>
      <div className="p-2.5">
        <h3 className="text-xs font-semibold text-ink-900 truncate">{p.name}</h3>
        {showSale && p.sale_price ? (
          <span className="text-xs font-bold text-gold-700 mt-0.5 block">{money(p.sale_price, p.currency)}</span>
        ) : (
          <span className="text-xs font-bold text-ink-700 mt-0.5 block">{money(p.price, p.currency)}</span>
        )}
      </div>
    </Link>
  );
}
