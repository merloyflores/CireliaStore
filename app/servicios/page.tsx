import Link from 'next/link';
import { HammerIcon, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Próximamente | Cirelia',
  description: 'Estamos diseñando una nueva experiencia para vos. Próximamente disponible.',
};

export default function EnConstruccionPage() {
  return (
    <div className="bg-white min-h-[75vh] flex items-center justify-center px-4 antialiased">
      <div className="max-w-md w-full text-center space-y-8">
        
        {/* Icono con sutil animación/diseño */}
        <div className="relative mx-auto w-20 h-20 bg-zinc-50 border border-zinc-200/80 rounded-3xl flex items-center justify-center shadow-xs">
          <div className="absolute inset-0 bg-sky-500/5 rounded-3xl blur-md" />
          <HammerIcon className="w-9 h-9 text-sky-600 relative z-10 animate-pulse" />
        </div>

        {/* Textos */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-600 font-bold text-[10px] uppercase tracking-widest">
            Espacio en curaduría
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-zinc-950">
            Sección en construcción
          </h1>
          <p className="text-zinc-500 font-medium text-sm leading-relaxed max-w-sm mx-auto">
            Estamos diseñando una experiencia digital a la altura de nuestro catálogo. Volvé pronto para descubrir los detalles.
          </p>
        </div>

        {/* Separador minimalista */}
        <div className="h-px bg-zinc-100 w-24 mx-auto" />

        {/* Botón de retorno */}
        <div>
          <Link 
            href="/" 
            className="inline-flex items-center justify-center gap-2 bg-zinc-950 text-white font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl hover:bg-zinc-900 active:scale-98 transition-all shadow-md"
          >
            <ArrowLeft size={14} />
            Volver al Inicio
          </Link>
        </div>

      </div>
    </div>
  );
}