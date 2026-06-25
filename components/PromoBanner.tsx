// components/PromoBanner.tsx
import Image from 'next/image';
import Link from 'next/link';

interface PromoBannerProps {
  image: string;
  title: string;
  subtitle: string;
  link: string;
}

export default function PromoBanner({ image, title, subtitle, link }: PromoBannerProps) {
  return (
    <div className="my-20 w-full h-64 md:h-85 rounded-[2rem] overflow-hidden relative shadow-[0_8px_30px_rgb(0,0,0,0.08)] group">
      {/* Optimizamos la imagen con Next.js Image */}
      <Image 
        src={image} 
        alt={title} 
        fill
        priority
        className="object-cover group-hover:scale-102 transition-transform duration-700"
      />
      
      {/* Overlay Premium con un sutil desenfoque de fondo opcional si lo deseas, o solo el gradiente oscuro */}
      <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center text-white p-8 text-center">
        <h3 className="text-4xl md:text-5xl font-black mb-3 tracking-tighter drop-shadow-md">
          {title}
        </h3>
        <p className="text-base md:text-lg mb-8 font-medium max-w-xl text-zinc-100 drop-shadow-sm">
          {subtitle}
        </p>
        <Link 
          href={link} 
          className="bg-white text-zinc-950 px-10 py-4 rounded-full font-bold hover:bg-sky-600 hover:text-white hover:scale-105 active:scale-98 transition-all duration-300 shadow-md"
        >
          Ver Oferta
        </Link>
      </div>
    </div>
  );
}