'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Instagram, Facebook, Mail, MapPin, Clock } from 'lucide-react';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useTenantSettings } from '@/lib/useTenantSettings';

const footerSections = [
  {
    title: 'Comprar',
    links: [
      { name: 'Catálogo', href: '/shop' },
      { name: 'Novedades', href: '/shop' },
      { name: 'Ofertas', href: '/shop?sale=true' },
    ],
  },
  {
    title: 'Nosotros',
    links: [
      { name: 'Nuestra Historia', href: '/historia' },
      { name: 'Servicios', href: '/servicios' },
    ],
  },
  {
    title: 'Soporte',
    links: [
      { name: 'Mis Pedidos', href: '/profile/pedidos' },
      { name: 'Rastrear Pedido', href: '/profile/pedidos' },
      { name: 'Soporte', href: '/profile/soporte' },
    ],
  },
];

export default function Footer() {
  const pathname = usePathname();
  const { settings } = useTenantSettings();

  // Si estamos en cualquier ruta de /admin, el footer público desaparece
  // (el layout de admin tiene su propio chrome).
  if (pathname.startsWith('/admin')) return null;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-ink-950 text-ink-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12">
          <div className="col-span-2 md:col-span-2 pr-8">
            <Link href="/" className="font-serif text-3xl font-medium text-cream-50 tracking-tight">
              Cirelia<span className="text-gold-400">.</span>
            </Link>
            <p className="mt-4 text-sm text-ink-400 max-w-md">
              Elevando el estándar de tu hogar con productos exclusivos y calidad excepcional. Tu espacio, tu
              estilo, Cirelia.
            </p>

            <div className="mt-6 space-y-2.5 text-sm text-ink-400">
              <a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-gold-300 transition-colors w-fit">
                <WhatsAppIcon style={{ fontSize: 15 }} /> WhatsApp
              </a>
              <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-2 hover:text-gold-300 transition-colors w-fit">
                <Mail size={15} /> {settings.contact_email}
              </a>
              {settings.address && (
                <p className="flex items-center gap-2">
                  <MapPin size={15} /> {settings.address}
                </p>
              )}
              {settings.business_hours && (
                <p className="flex items-center gap-2">
                  <Clock size={15} /> {settings.business_hours}
                </p>
              )}
            </div>

            {(settings.instagram_url || settings.facebook_url || settings.tiktok_url) && (
              <div className="mt-5 flex items-center gap-3">
                {settings.instagram_url && (
                  <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-ink-900 flex items-center justify-center hover:bg-gold-600 hover:text-ink-950 transition-colors">
                    <Instagram size={15} />
                  </a>
                )}
                {settings.facebook_url && (
                  <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-ink-900 flex items-center justify-center hover:bg-gold-600 hover:text-ink-950 transition-colors">
                    <Facebook size={15} />
                  </a>
                )}
                {settings.tiktok_url && (
                  <a href={settings.tiktok_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-ink-900 flex items-center justify-center hover:bg-gold-600 hover:text-ink-950 transition-colors text-[11px] font-black">
                    TT
                  </a>
                )}
              </div>
            )}
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-cream-100 tracking-wider uppercase">{section.title}</h3>
              <ul className="mt-5 space-y-3.5">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-400 hover:text-gold-300 transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-ink-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-ink-500">&copy; {currentYear} Cirelia Store. Todos los derechos reservados.</p>
          <div className="flex flex-col md:flex-row items-center gap-4 mt-4 md:mt-0 text-xs text-ink-600">
            <span>Costa Rica</span>
            <span>Cirelia Store</span>
            <Link
              href="https://nexflow-portfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gold-400 transition-colors"
            >
              Powered by Nexflow Digital
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
