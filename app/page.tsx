'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import SectionContainer from "../components/SectionContainer";
import ProductCard from "../components/ProductCard";
import { Truck, ShieldCheck, Sparkles, MessageSquare } from 'lucide-react';

// 1. DICCIONARIO DE ESLÓGANES PREMIUM
const categorySlogans: Record<string, string> = {
  'Muebles': 'Diseño atemporal que define tu espacio.',
  'Iluminación': 'La atmósfera perfecta para cada momento.',
  'Decoración': 'Detalles precisos que cuentan tu historia.',
  'Dormitorio': 'Tu refugio personal de descanso puro.',
  'Exteriores': 'Naturaleza y confort en perfecta sintonía.',
};

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Tus 5 videos de fondo
  const videoSources = [
    "/video/5395620_Coll_wavebreak_People_3840x2160.mp4",
    "/video/1107111_1080p_4k_3840x2160.mp4",
    "/video/1108401_1080p_4k_3840x2160.mp4",
    "/video/1116451_Man_Woman_3840x2160.mp4",
    "/video/6000490_Person_People_3840x2160.mp4"
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      // NOTA: Eliminamos el .limit(4) para traer todos los productos 
      // y que la agrupación por categorías funcione correctamente.
      const { data } = await supabase.from('products').select('*');
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

  // 2. AGRUPACIÓN DINÁMICA (VALORES ANTES DEL RETURN)
  const groupedProducts = products?.reduce((acc: Record<string, any[]>, product) => {
    const cat = product.category || 'Colección Especial';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(product);
    return acc;
  }, {});

  return (
    <div className="flex flex-col w-full">
      {/* 1. SECCIÓN HERO */}
      <section className="relative min-h-[85vh] sm:h-[85vh] w-full bg-zinc-100 flex items-center justify-center overflow-hidden pt-16 pb-24 sm:py-0">        
        {/* FONDO DE VIDEO Y OVERLAYS */}
        <div className="absolute inset-0 z-0 bg-zinc-950">
          <video 
            key={videoSources[currentIndex]}
            autoPlay muted playsInline
            onEnded={handleVideoEnd}
            /* Agregamos un efecto sutil de escalado (zoom) junto con la transición de opacidad */
            className={`w-full h-full object-cover transition-all duration-1500 ease-in-out ${
              isTransitioning ? 'opacity-0 scale-105' : 'opacity-50 scale-100'
            }`}
          >
            <source src={videoSources[currentIndex]} type="video/mp4" />
          </video>

          {/* Gradiente 1: Viñeta para oscurecer los bordes y enfocar el centro */}
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-white/10 to-zinc-100 pointer-events-none"></div>
          
          {/* Gradiente 2: Resplandor radial detrás del texto para que no se pierda legibilidad */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.6)_0%,transparent_60%)] pointer-events-none"></div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl mx-auto mt-10">

          {/* Subtítulo */}
          <h2 className="text-sky-200 uppercase tracking-[0.4em] text-xs sm:text-sm font-black mb-4 drop-shadow-md">
            Colección Exclusiva 2026
          </h2>
          
          {/* Título Principal (Con gradiente en la palabra clave) */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-zinc-950 mb-6 leading-[1.1]">
            Hogares que <br /> cuentan <span className="text-transparent bg-clip-text bg-linear-to-r from-sky-600 to-indigo-600">historias.</span>
          </h1>
          
          {/* Párrafo de apoyo (Ayuda al SEO y convence al cliente) */}
          <p className="text-zinc-700 text-base md:text-lg max-w-2xl mx-auto mb-10 font-medium">
            Descubre piezas de diseño únicas que transforman tu espacio en un refugio de elegancia y confort. Calidad premium para quienes exigen lo mejor.
          </p>

          {/* Botones de Llamada a la Acción (Primario y Secundario) */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            {/* Botón Primario */}
            <Link href="/shop" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto group relative flex items-center justify-center gap-3 bg-zinc-950 text-white px-8 py-4 rounded-full font-bold hover:bg-sky-600 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(2,132,199,0.3)] hover:-translate-y-1">
                Explorar Catálogo
                {/* Flecha que se mueve al hacer hover */}
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </Link>
            
            {/* Botón Secundario */}
            <Link href="/ofertas" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto flex items-center justify-center bg-white/60 backdrop-blur-md border-2 border-zinc-300 text-zinc-900 px-8 py-4 rounded-full font-bold hover:bg-white hover:border-zinc-400 transition-all duration-300">
                Ver Colección en Oferta
              </button>
            </Link>
          </div>
        </div>

        {/* INDICADOR DE SCROLL */}
        {/* CAMBIO AQUÍ: Cambiamos bottom-8 por bottom-4 en móvil para pegarlo un toque más al borde inferior y ganar aire libre */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce opacity-70">
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-2">Deslizar</span>
          <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* 2. SECCIÓN CON FONDO #F3F3F4 */}
      <section className="py-24 bg-[#F3F3F4] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Iteramos sobre cada categoría que tenga productos */}
          {Object.entries(groupedProducts || {}).map(([category, items]) => {
            // Tomamos solo los primeros 4 productos para el escaparate
            const showcaseItems = items.slice(0, 4);
            const hasMore = items.length > 4;

            return (
              <div key={category} className="mb-24 last:mb-0">
                
                {/* ENCABEZADO DE LA CATEGORÍA */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                  <div>
                    <h2 className="text-3xl md:text-5xl font-black text-zinc-950 tracking-tighter mb-3 capitalize">
                      {category}
                    </h2>
                    <p className="text-zinc-500 font-medium text-lg">
                      {categorySlogans[category] || 'Explora nuestra selección curada de alta gama.'}
                    </p>
                  </div>
                  
                  {/* Botón superior para ver la categoría completa */}
                  <Link 
                    href={`/shop?category=${encodeURIComponent(category)}`} 
                    className="group flex items-center gap-2 text-sm font-bold text-zinc-950 hover:text-sky-600 transition-colors"
                  >
                    Ver todo {category}
                    <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-zinc-200 group-hover:border-sky-200 group-hover:bg-sky-50 transition-all">
                      →
                    </span>
                  </Link>
                </div>

                {/* GRID DE PRODUCTOS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {showcaseItems.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* BOTÓN "VER MÁS" INFERIOR (Opcional, aparece si hay más de 4 productos) */}
                {hasMore && (
                  <div className="mt-12 text-center md:hidden">
                    <Link 
                      href={`/shop?category=${encodeURIComponent(category)}`} 
                      className="inline-block bg-white text-zinc-950 px-8 py-4 rounded-full font-bold shadow-sm border border-zinc-200 hover:bg-zinc-50 transition-colors"
                    >
                      Explorar más {category}
                    </Link>
                  </div>
                )}
                
                {/* Separador sutil entre categorías (no se muestra en la última) */}
                <div className="hidden last:block w-full h-px bg-zinc-200 mt-24"></div>
              </div>
            );
          })}

        </div>
      </section>

      {/* 3. SECCIÓN DE VALORES Y CONFIANZA */}
      <section className="py-24 bg-white border-t border-zinc-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-sm font-black text-sky-600 uppercase tracking-[0.2em] mb-3">Nuestra Promesa</h3>
            <h2 className="text-4xl md:text-5xl font-black text-zinc-950 tracking-tighter">Más que muebles, experiencias.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Truck, title: "Envío Prioritario", desc: "Logística propia para que tu pieza llegue impecable y en tiempo récord." },
              { icon: ShieldCheck, title: "Garantía Extendida", desc: "Seleccionamos materiales de alta gama con respaldo total de fábrica." },
              { icon: MessageSquare, title: "Asesoría Experta", desc: "Nuestro equipo de diseño te acompaña en cada elección, sin compromiso." }
            ].map((item, i) => (
              <div key={i} className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100 hover:border-sky-200 transition-all hover:shadow-xl hover:shadow-sky-500/5 group">
                <item.icon className="w-10 h-10 text-sky-600 mb-6 group-hover:scale-110 transition-transform" />
                <h4 className="text-lg font-black text-zinc-950 mb-3">{item.title}</h4>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SECCIÓN DE TESTIMONIOS (GRID PREMIUM) */}
      <section className="py-24 bg-zinc-950 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-sm font-black text-sky-500 uppercase tracking-[0.2em] mb-4">Lo que dicen de nosotros</h2>
            <p className="text-3xl md:text-5xl font-black tracking-tighter">Historias reales de hogares felices</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                text: "Cirelia no solo cambió el look de mi sala, cambió cómo nos sentimos al llegar a casa. La calidad es inigualable.",
                name: "María Fernández",
                role: "Diseñadora de Interiores",
                bg: "bg-[url('https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200')]"
              },
              {
                text: "La atención al detalle y la rapidez de entrega superaron todas mis expectativas. Son un estándar de calidad.",
                name: "Carlos Méndez",
                role: "Arquitecto",
                bg: "bg-[url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200')]"
              },
              {
                text: "Transformaron mi oficina en un espacio inspirador. El proceso de compra fue increíblemente sencillo y seguro.",
                name: "Elena Gómez",
                role: "Emprendedora",
                bg: "bg-[url('https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200')]"
              }
            ].map((testimonio, i) => (
              <div key={i} className="group p-8 rounded-[2rem] bg-zinc-900 border border-zinc-800 hover:border-sky-500/50 transition-all duration-500">
                <div className="mb-6 text-amber-400">★★★★★</div>
                <p className="text-zinc-300 mb-8 italic leading-relaxed">"{testimonio.text}"</p>
                
                <div className="flex items-center gap-4">
                  {/* Foto con efecto difuminado y circular */}
                  <div className={`w-14 h-14 rounded-full ${testimonio.bg} bg-cover bg-center border-2 border-zinc-700 group-hover:border-sky-500 transition-colors relative`}>
                    {/* Overlay para difuminar sutilmente */}
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-bold text-white">{testimonio.name}</p>
                    <p className="text-zinc-500 text-xs uppercase tracking-wider">{testimonio.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. NEWSLETTER - DISEÑO MINIMALISTA PREMIUM */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative bg-zinc-950 rounded-4xl p-12 md:p-20 text-center overflow-hidden">
            
            {/* Elemento de iluminación sutil */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-125 h-125 bg-sky-500/10 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="relative z-10">
              <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-6">
                Sé parte de Cirelia<span className="text-sky-500">.</span>
              </h3>
              
              <p className="text-zinc-400 text-lg mb-12 max-w-md mx-auto leading-relaxed font-light">
                Suscríbete para recibir acceso anticipado a nuestras colecciones y curaduría exclusiva de diseño para tu hogar.
              </p>

              <form className="relative flex flex-col sm:flex-row gap-3 max-w-sm mx-auto" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="Ingresa tu correo" 
                  className="w-full bg-zinc-900 border border-zinc-800 text-white px-6 py-4 rounded-full focus:outline-none focus:border-sky-500 transition-colors placeholder:text-zinc-600"
                />
                <button className="bg-white text-zinc-950 px-8 py-4 rounded-full font-bold hover:bg-sky-500 hover:text-white transition-all duration-300">
                  Unirme
                </button>
              </form>

              <p className="mt-8 text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
                Sin spam, solo inspiración de alto nivel.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}