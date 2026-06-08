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
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

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
    // El contenedor es 'sticky' y solo sirve como ancla de posición al llegar al footer
    <div className="sticky bottom-6 z-999 flex justify-end mr-10 pointer-events-none">
      
      {/* 1. VENTANA DE CHAT: 'absolute' para flotar libremente sin afectar el diseño */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-85 pointer-events-auto bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-zinc-100 overflow-hidden animate-in fade-in slide-in-from-bottom-5">
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

          {/* CUERPO DEL CHAT: Diseño Pro */}
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
                  {/* Mensaje de sistema estilizado */}
                  <div className="flex gap-2 items-start animate-in fade-in slide-in-from-left-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <Sparkles size={12} className="text-emerald-600" />
                    </div>
                    <div className="bg-zinc-100 p-3 rounded-2xl rounded-tl-none text-[11px] text-zinc-700 max-w-[85%] shadow-sm">
                      Hola {name}! 👋 Estoy listo para ayudarte. Escribe tu consulta abajo.
                    </div>
                  </div>
                  {/* Indicador de "Escribiendo" */}
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

      {/* 2. BOTÓN FLOTANTE: 'pointer-events-auto' para el clic, 'absolute' para no expandir el contenedor */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto relative w-16 h-16 rounded-full flex items-center justify-center text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95 bg-emerald-500 z-10"
      >
        {/* LA ONDA: Ahora es un elemento absolutamente posicionado que NO afecta el tamaño del botón */}
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