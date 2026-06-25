'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Send, Sparkles } from 'lucide-react';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { usePathname } from 'next/navigation';

export default function WhatsAppWidget({ phoneNumber = '50672961548' }: { phoneNumber?: string }) {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;
  
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false); // Nuevo estado para ocultar el widget por completo
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  // Si el usuario decide ocultarlo, el widget no renderiza nada
  if (isDismissed) return null;

  const handleInitChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStep(2);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    await supabase.from('support_chats').insert([{ client_name: name || 'Cliente Web', initial_message: message }]);
    const textFormatted = `Hola, mi nombre es *${name}*.\n\nTengo la siguiente consulta:\n"${message}"`;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(textFormatted)}`, '_blank');
    setMessage('');
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:sticky sm:bottom-6 sm:left-auto sm:right-auto z-999 flex justify-center sm:justify-end sm:mr-10 pointer-events-none">
      
      {/* 1. VENTANA DE CHAT: Ajustada para centrarse perfectamente en móviles y alinearse a la derecha en PC */}
      {isOpen && (
        <div className="absolute bottom-20 left-0 right-0 mx-auto sm:mx-0 sm:left-auto sm:right-0 w-[calc(100vw-2rem)] sm:w-85 pointer-events-auto bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-zinc-100 overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          <div className="bg-zinc-950 p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center relative">
                <WhatsAppIcon style={{ fontSize: 24 }} />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-zinc-950 rounded-full"></span>
              </div>
              <div>
                <h4 className="text-xs font-black flex items-center gap-1">Soporte Cirelia <Sparkles size={10} className="text-amber-400" /></h4>
                <p className="text-[10px] text-zinc-400">Respuesta inmediata</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-zinc-800 rounded-lg transition"><X size={16} /></button>
          </div>

          {/* CUERPO DEL CHAT */}
          <div className="p-5 bg-white h-72 overflow-y-auto flex flex-col gap-4">
            {step === 1 ? (
              <form onSubmit={handleInitChat} className="space-y-4 my-auto">
                <div className="text-center">
                  <p className="text-xs font-bold text-zinc-900 mb-1">¡Bienvenido a Cirelia! 👋</p>
                  <p className="text-[10px] text-zinc-500">¿Cómo podemos ayudarte hoy?</p>
                </div>
                <input 
                  type="text" required placeholder="Tu nombre..." value={name} onChange={(e) => setName(e.target.value)} 
                  className="w-full h-11 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 text-xs outline-none focus:border-emerald-500 transition-colors" 
                />
                <button type="submit" className="w-full h-11 bg-zinc-950 text-white rounded-2xl text-xs font-bold hover:bg-zinc-800 transition-all active:scale-[0.98]">
                  Iniciar Chat
                </button>
              </form>
            ) : (
              <div className="flex flex-col h-full justify-between">
                <div className="space-y-4">
                  <div className="flex gap-2 items-start animate-in fade-in slide-in-from-left-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <Sparkles size={12} className="text-emerald-600" />
                    </div>
                    <div className="bg-zinc-100 p-3 rounded-2xl rounded-tl-none text-[11px] text-zinc-700 max-w-[85%] shadow-sm">
                      Hola {name}! 👋 Estoy listo para ayudarte. Escribe tu consulta abajo.
                    </div>
                  </div>
                  <div className="flex gap-1 pl-8">
                    <span className="w-1 h-1 bg-zinc-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1 h-1 bg-zinc-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1 h-1 bg-zinc-300 rounded-full animate-bounce"></span>
                  </div>
                </div>

                <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 bg-zinc-50 p-1.5 rounded-2xl border border-zinc-200 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                  <input 
                    type="text" required placeholder="Escribe tu duda..." value={message} onChange={(e) => setMessage(e.target.value)} 
                    className="flex-1 bg-transparent px-3 text-xs outline-none" 
                  />
                  <button type="submit" className="w-9 h-9 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center transition-transform hover:scale-105">
                    <Send size={14} />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =======================================================
          3. BOTONES CONMUTADORES SEGÚN DISPOSITIVO (PC vs MÓVIL)
          ======================================================= */}

      {/* MÓVIL: Estilo Barra de Footer Flotante Alargada (Silueta image_e2a134.png con Efecto 3D Premium) */}
      <div className="sm:hidden pointer-events-auto flex items-center justify-between bg-linear-to-b from-emerald-400 via-emerald-500 to-emerald-600 text-white w-full max-w-md h-12 rounded-full pl-4 pr-2 border border-emerald-600/70 transition-all shadow-[0_12px_32px_rgba(16,185,129,0.45),inset_0_2px_3px_rgba(255,255,255,0.35),inset_0_-2px_3px_rgba(0,0,0,0.15)] backdrop-blur-xs">
        
        {/* Gatillo de apertura y frase de marketing */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center gap-2.5 text-left h-full active:scale-[0.99] transition-transform"
        >
          {/* Icono con un sutil drop-shadow para que flote sobre el gradiente */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className="text-zinc-950"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          <span className="text-xs font-black uppercase tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
            {isOpen ? 'Cerrar consulta' : '¿Dudas? Conversemos en vivo'}
          </span>
        </button>

        {/* Botón de descarte para ocultar por completo el Widget */}
        <button 
          onClick={() => { setIsOpen(false); setIsDismissed(true); }}
          className="w-8 h-8 rounded-full bg-zinc-950/20 hover:bg-zinc-950/30 active:scale-95 flex items-center justify-center transition-all border border-white/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]"
          title="Ocultar chat"
        >
          <X size={14} className="text-emerald-50" />
        </button>
      </div>

      {/* COMPUTADORA: El botón circular clásico original e intacto */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden sm:flex pointer-events-auto relative w-16 h-16 rounded-full items-center justify-center text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95 bg-emerald-500 z-10"
      >
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50 -z-10"></span>
        )}
        
        <div className="relative z-10 transition-transform duration-300">
          {isOpen ? <X size={28} /> : <WhatsAppIcon style={{ fontSize: 32 }} />}
        </div>
      </button>

    </div>
  );
}