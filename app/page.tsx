'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import SectionContainer from "../components/SectionContainer";
import ProductCard from "../components/ProductCard";
import { Truck, ShieldCheck, Sparkles } from 'lucide-react';
export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 1. Tus 5 videos
  const videoSources = [
    "/video/5395620_Coll_wavebreak_People_3840x2160.mp4",
    "/video/1107111_1080p_4k_3840x2160.mp4",
    "/video/1108401_1080p_4k_3840x2160.mp4",
    "/video/1116451_Man_Woman_3840x2160.mp4",
    "/video/6000490_Person_People_3840x2160.mp4"
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*').limit(4);
      if (data) setProducts(data);
    };
    fetchProducts();
  }, []);

  const handleVideoEnd = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % videoSources.length);
      setIsTransitioning(false);
    }, 800);
  };

  return (
    <div className="flex flex-col w-full">
      {/* 1. SECCIÓN HERO */}
      <section className="relative h-[75vh] bg-zinc-100 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video 
            key={videoSources[currentIndex]}
            autoPlay muted playsInline
            onEnded={handleVideoEnd}
            className={`w-full h-full object-cover transition-opacity duration-1000 ${isTransitioning ? 'opacity-0' : 'opacity-40'}`}
            style={{ filter: 'grayscale(20%)' }}
          >
            <source src={videoSources[currentIndex]} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]"></div>
        </div>

        <div className="text-center z-10 px-4">
          <h2 className="text-zinc-500 uppercase tracking-[0.3em] text-sm font-bold mb-4">Colección 2026</h2>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-zinc-950 mb-6">
            Hogares que <br /> cuentan <span className="text-sky-600">historias.</span>
          </h1>
          <Link href="/shop">
            <button className="bg-zinc-950 text-white px-8 py-4 rounded-full font-medium hover:bg-zinc-800 transition shadow-xl inline-block">
              Explorar Catálogo
            </button>
          </Link>
        </div>
      </section>

      {/* 2. SECCIÓN PRODUCTOS */}
      <SectionContainer>
        <h3 className="text-3xl font-bold mb-10 text-zinc-900">Nuestros Productos</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {products?.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/shop" className="text-zinc-500 hover:text-sky-600 font-medium transition">
            Ver toda la colección →
          </Link>
        </div>
      </SectionContainer>

      {/* 3. SECCIÓN DE CIERRE (REMATE COLORIDO) - ¡AÑADIDO AQUÍ! */}
      <section className="py-20 bg-zinc-50 border-t border-zinc-100">
        <SectionContainer>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            
            {/* Beneficio 1: Celeste Predominante (Confianza) */}
            <div className="flex flex-col items-center group">
              <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-sky-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <Truck size={32} />
              </div>
              <h4 className="text-xl font-bold text-zinc-900 mb-2">Entrega Inmediata</h4>
              <p className="text-zinc-500 text-sm leading-relaxed">Llevamos tus sueños a casa con el respaldo y rapidez de nuestra red logística.</p>
              <div className="w-8 h-1 bg-sky-500 mt-4 rounded-full"></div>
            </div>

            {/* Beneficio 2: Toque Amarillo (Energía/Oferta) */}
            <div className="flex flex-col items-center group">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-sm">
                <Sparkles size={32} />
              </div>
              <h4 className="text-xl font-bold text-zinc-900 mb-2">Calidad Garantizada</h4>
              <p className="text-zinc-500 text-sm leading-relaxed">Seleccionamos cada pieza pensando en la durabilidad y el estilo de tu familia.</p>
              <div className="w-8 h-1 bg-amber-400 mt-4 rounded-full"></div>
            </div>

            {/* Beneficio 3: Toque Rojo (Pasión/Atención) */}
            <div className="flex flex-col items-center group">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-red-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <ShieldCheck size={32} />
              </div>
              <h4 className="text-xl font-bold text-zinc-900 mb-2">Compra Segura</h4>
              <p className="text-zinc-500 text-sm leading-relaxed">Soporte personalizado en cada paso. Tu tranquilidad es nuestra prioridad.</p>
              <div className="w-8 h-1 bg-red-500 mt-4 rounded-full"></div>
            </div>

          </div>

          {/* Banner Final de Acción */}
          <div className="mt-20 bg-sky-600 rounded-[3rem] p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-500/20 rounded-full -ml-16 -mb-16 blur-2xl"></div>
            
            <h3 className="text-3xl md:text-5xl font-black mb-6">¿Listo para transformar tu espacio?</h3>
            <p className="text-sky-100 mb-10 max-w-2xl mx-auto text-lg">Únete a las miles de familias que ya cuentan su historia con nosotros.</p>
            <Link href="/shop">
              <button className="bg-white text-sky-600 px-10 py-4 rounded-full font-bold hover:bg-zinc-100 transition-transform hover:scale-105">
                Ver Catálogo Completo
              </button>
            </Link>
          </div>
        </SectionContainer>
      </section>
    </div>
  );
}