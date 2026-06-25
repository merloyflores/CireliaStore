'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const footerSections = [
  {
    title: 'Comprar',
    links: ['Sala', 'Cocina', 'Dormitorio', 'Nuevos Ingresos', 'Ofertas'],
  },
  {
    title: 'Nosotros',
    links: ['Nuestra Historia', 'Contacto', 'Términos de Servicio', 'Privacidad'],
  },
  {
    title: 'Soporte',
    links: ['Preguntas Frecuentes', 'Envíos', 'Devoluciones', 'Rastrear Pedido'],
  },
];

export default function Footer() {
  const pathname = usePathname();
  
  // Si estamos en cualquier ruta de /admin, el Navbar público desaparece
  if (pathname.startsWith('/admin')) return null;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-zinc-950 text-zinc-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12">
          
          {/* Columna Logo y Eslogan */}
          <div className="col-span-2 md:col-span-2 pr-8">
            <Link href="/" className="text-3xl font-bold text-white tracking-tighter">
              Cirelia<span className="text-sky-500">.</span>
            </Link>
            <p className="mt-4 text-sm text-zinc-400 max-w-md">
              Elevando el estándar de tu hogar con productos exclusivos y calidad excepcional. Tu espacio, tu estilo, Cirelia.
            </p>
          </div>

          {/* Columnas de Enlaces Dinámicas */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase">
                {section.title}
              </h3>
              <ul className="mt-5 space-y-3.5">
                {section.links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors duration-200">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Línea divisoria y Copyright */}
        <div className="mt-12 pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-zinc-500">
            &copy; {currentYear} Cirelia Store. Todos los derechos reservados.
          </p>
          <div className="flex flex-col md:flex-row items-center gap-4 mt-4 md:mt-0 text-xs text-zinc-600">
            <span>Costa Rica</span>
            <span>Cirelia Store</span>
            <Link 
              href="https://nexflow-portfolio.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-sky-500 transition-colors"
            >
              Powered by NexflowDigital
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}