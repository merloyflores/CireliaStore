'use client';

import { useCartStore } from '../store/useCartStore';
import SectionContainer from "@/components/SectionContainer";
import ProductCard from "@/components/ProductCard";
import Link from 'next/link';
import { Heart, ChevronLeft, ShoppingBag } from 'lucide-react';

export default function FavoritesPage() {
  const { favorites, toggleFavorite } = useCartStore();

  if (favorites.length === 0) {
    return (
      <div className="py-40 text-center bg-white min-h-screen">
        <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <Heart size={40} className="text-zinc-200" />
        </div>
        <h1 className="text-4xl font-black text-zinc-950 mb-4 tracking-tighter">Tu lista está vacía</h1>
        <p className="text-zinc-500 mb-10">Guarda las piezas que más te gusten para verlas más tarde.</p>
        <Link href="/shop" className="bg-zinc-950 text-white px-10 py-4 rounded-full font-bold shadow-lg hover:bg-sky-600 transition-all inline-block">
          Explorar Colección
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 min-h-screen py-12">
      <SectionContainer>
        <Link href="/shop" className="flex items-center gap-2 text-zinc-400 hover:text-zinc-950 transition mb-10 text-xs font-black uppercase tracking-widest">
          <ChevronLeft size={14} /> Volver a la tienda
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <h1 className="text-5xl font-black text-zinc-950 tracking-tighter">Favoritos</h1>
            <p className="text-zinc-500 font-medium">Piezas seleccionadas para tu hogar</p>
          </div>
          <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest">
            {favorites.length} {favorites.length === 1 ? 'Artículo' : 'Artículos'}
          </p>
        </div>

        {/* GRID DE FAVORITOS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {favorites.map((product) => (
            <div key={product.id} className="relative group">
              <ProductCard product={product} />
              {/* Botón para quitar de favoritos sobre la tarjeta */}
              <button 
                onClick={() => toggleFavorite(product)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                title="Eliminar de favoritos"
              >
                <Heart size={18} fill="currentColor" />
              </button>
            </div>
          ))}
        </div>
      </SectionContainer>
    </div>
  );
}