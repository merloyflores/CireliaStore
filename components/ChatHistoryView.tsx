import { User } from 'lucide-react';

export default function ChatHistoryView({ chats }: { chats: any[] }) {
  return (
    <div className="flex flex-col gap-4">
      {chats.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          <p className="text-sm font-medium">No hay chats registrados en la base de datos.</p>
        </div>
      ) : (
        // CONTENEDOR CON LÍMITE DE ALTURA:
        // max-h-[60vh] en móvil, expandible en pantallas grandes (md:max-h-none)
        // scrollbar-thin y custom-scrollbar para que se vea limpio
        <div className="flex flex-col gap-4 max-h-[60vh] md:max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          {chats.map((chat) => (
            <div key={chat.id || chat.created_at} className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm hover:border-zinc-300 transition-colors flex flex-col gap-3">
              
              {/* Cabecera */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 shadow-sm">
                    <User size={14} className="text-zinc-400" />
                  </div>
                  <span className="text-sm font-bold text-zinc-900">
                    {chat.client_name || 'Usuario Anónimo'}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-md">
                  {chat.created_at ? new Date(chat.created_at).toLocaleDateString() : 'Reciente'}
                </span>
              </div>

              {/* Cuerpo */}
              <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-xl">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-wider mb-1">
                  Mensaje inicial:
                </p>
                <p className="text-sm text-zinc-600 leading-relaxed font-medium">
                  "{chat.initial_message || 'Sin mensaje inicial.'}"
                </p>
              </div>

              {/* Footer */}
              {chat.status && (
                <div className="flex justify-end pt-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                    {chat.status}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}