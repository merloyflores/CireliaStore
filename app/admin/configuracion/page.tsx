import { 
  Settings, 
  Store, 
  CreditCard, 
  ShieldCheck, 
  Bell, 
  ChevronRight,
  Globe
} from 'lucide-react';

export default function ConfiguracionPage() {
  const sections = [
    { title: 'Perfil de la Tienda', icon: Store, desc: 'Nombre, logo y contacto.' },
    { title: 'Pagos y Moneda', icon: CreditCard, desc: 'Configura tus métodos de cobro.' },
    { title: 'Seguridad', icon: ShieldCheck, desc: 'Cambio de contraseña y acceso.' },
    { title: 'Notificaciones', icon: Bell, desc: 'Alertas por correo y WhatsApp.' },
    { title: 'Dominio y SEO', icon: Globe, desc: 'Gestiona tu presencia en la web.' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-zinc-950 tracking-tighter">Configuración</h1>
        <p className="text-zinc-500">Administra los ajustes técnicos de tu plataforma.</p>
      </div>

      {/* GRILLA DE OPCIONES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section, i) => (
          <button 
            key={i} 
            className="flex items-center justify-between p-6 bg-white rounded-2xl border border-zinc-100 shadow-sm hover:border-sky-200 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-zinc-50 rounded-xl text-zinc-500 group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors">
                <section.icon size={24} />
              </div>
              <div>
                <h3 className="font-bold text-zinc-950">{section.title}</h3>
                <p className="text-sm text-zinc-400">{section.desc}</p>
              </div>
            </div>
            <ChevronRight className="text-zinc-300 group-hover:text-sky-500 transition-colors" />
          </button>
        ))}
      </div>

      {/* FOOTER DE SISTEMA */}
      <div className="mt-8 pt-8 border-t border-zinc-100 flex justify-between items-center text-xs text-zinc-400">
        <p>Cirelia Admin v1.0.0</p>
        <p>Última sincronización: Hace 5 min</p>
      </div>
    </div>
  );
}