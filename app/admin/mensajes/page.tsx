import { 
  MessageSquare, 
  Search, 
  Filter, 
  MoreVertical,
  CheckCheck,
  Clock
} from 'lucide-react';

const messages = [
  { id: 1, sender: 'Ana Vargas', preview: 'Hola, quería consultar sobre el estado de mi pedido...', time: '10:30 AM', unread: true },
  { id: 2, sender: 'Carlos Mena', preview: '¿Tienen disponibilidad de la mesa en color roble?', time: '09:15 AM', unread: false },
  { id: 3, sender: 'Elena Rojas', preview: '¡Recibí mi paquete! Todo excelente, gracias.', time: 'Ayer', unread: false },
];

export default function MensajesPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-zinc-950 tracking-tighter">Mensajes</h1>
        <p className="text-zinc-500">Atención al cliente y consultas directas.</p>
      </div>

      {/* BANDEJA DE ENTRADA */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-125">
        
        {/* LISTADO LATERAL DE MENSAJES */}
        <div className="w-full md:w-80 border-r border-zinc-100 flex flex-col">
          <div className="p-4 border-b border-zinc-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input 
                placeholder="Buscar mensajes..." 
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 rounded-xl text-sm border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`p-4 border-b border-zinc-50 cursor-pointer hover:bg-zinc-50 transition ${msg.unread ? 'bg-sky-50/50' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-bold text-sm ${msg.unread ? 'text-zinc-950' : 'text-zinc-600'}`}>
                    {msg.sender}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-bold">{msg.time}</span>
                </div>
                <p className="text-xs text-zinc-500 truncate">{msg.preview}</p>
                {msg.unread && (
                  <div className="mt-2 w-2 h-2 bg-sky-500 rounded-full" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ÁREA DE LECTURA (Vacía por ahora) */}
        <div className="hidden md:flex flex-1 items-center justify-center text-zinc-400 bg-zinc-50/50">
          <div className="text-center">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm font-bold">Selecciona un mensaje para leer</p>
          </div>
        </div>
      </div>
    </div>
  );
}