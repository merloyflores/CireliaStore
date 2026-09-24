'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { ChatBubbleLeftRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Send, Loader2 } from 'lucide-react';
import { useTenantSettings } from '@/lib/useTenantSettings';

type Chat = {
  id: string;
  client_name: string;
  initial_message: string;
  status: string;
  created_at: string;
};

type ThreadMessage = {
  id: string;
  chat_id: string;
  sender_role: 'customer' | 'staff';
  body: string;
  created_at: string;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('es-CR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function SoportePage() {
  const supabase = createClient();
  const { settings } = useTenantSettings();
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [loadingChats, setLoadingChats] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [openChatId, setOpenChatId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [reply, setReply] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingChats(false);
        return;
      }
      setUserId(user.id);
      const { data: profile } = await supabase.from('users').select('name').eq('id', user.id).maybeSingle();
      if (profile?.name) setName(profile.name);

      const { data: chatsData } = await supabase
        .from('support_chats')
        .select('id, client_name, initial_message, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setChats(chatsData ?? []);
      if (chatsData && chatsData.length > 0) setOpenChatId(chatsData[0].id);
      setLoadingChats(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!openChatId) {
      setThread([]);
      return;
    }
    setLoadingThread(true);
    supabase
      .from('support_chat_messages')
      .select('*')
      .eq('chat_id', openChatId)
      .order('created_at')
      .then(({ data }) => {
        setThread((data as any) ?? []);
        setLoadingThread(false);
      });
  }, [openChatId]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.length]);

  const openChat = chats.find((c) => c.id === openChatId) ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setErrorMsg(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const tenantSlug = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || 'cirelia';
      const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).maybeSingle();
      const { data, error } = await supabase
        .from('support_chats')
        .insert({
          tenant_id: tenant?.id,
          user_id: user?.id ?? null,
          client_name: name || 'Cliente',
          initial_message: message,
          status: 'Nuevo',
        })
        .select('id, client_name, initial_message, status, created_at')
        .single();
      if (error) throw error;
      setChats((c) => [data, ...c]);
      setOpenChatId(data.id);
      setMessage('');
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo enviar tu mensaje. Intentá de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const sendReply = async () => {
    if (!openChatId || !reply.trim() || !userId) return;
    setSendingReply(true);
    const { data, error } = await supabase
      .from('support_chat_messages')
      .insert({ chat_id: openChatId, sender_role: 'customer', sender_id: userId, body: reply.trim() })
      .select('*')
      .single();
    setSendingReply(false);
    if (error) {
      alert('No se pudo enviar: ' + error.message);
      return;
    }
    setThread((t) => [...t, data]);
    setReply('');
  };

  const whatsappHref = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent('¡Hola! Necesito ayuda con un pedido.')}`;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-black tracking-tighter text-ink-950">Centro de ayuda</h2>
        <p className="text-xs text-ink-500 font-medium mt-1">¿Tenés algún problema? Escribinos y te contactamos pronto.</p>
      </div>

      {/* CONVERSACIÓN ACTIVA — si ya escribió antes, ve el hilo y puede seguir respondiendo acá mismo */}
      {!loadingChats && openChat && (
        <div className="border border-ink-100 rounded-2xl overflow-hidden bg-white">
          <div className="px-5 py-3.5 border-b border-ink-100 flex items-center justify-between">
            <p className="text-sm font-bold text-ink-900">Tu conversación</p>
            <span className={`text-[9px] font-black px-2 py-1 rounded-full ${openChat.status === 'Atendido' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {openChat.status === 'Atendido' ? 'ATENDIDO' : 'EN PROCESO'}
            </span>
          </div>
          <div className="p-5 space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
            <div className="max-w-sm bg-cream-50 border border-ink-100 rounded-2xl rounded-tl-sm p-3.5">
              <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">{openChat.initial_message}</p>
            </div>
            {loadingThread ? (
              <div className="flex justify-center py-3"><Loader2 size={15} className="animate-spin text-ink-300" /></div>
            ) : (
              thread.map((m) => (
                <div key={m.id} className={`max-w-sm ${m.sender_role === 'customer' ? 'ml-auto' : ''}`}>
                  <div
                    className={`rounded-2xl p-3.5 ${
                      m.sender_role === 'customer'
                        ? 'bg-ink-900 text-cream-50 rounded-tr-sm'
                        : 'bg-cream-50 border border-ink-100 text-ink-700 rounded-tl-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.body}</p>
                  </div>
                  <p className={`text-[10px] text-ink-400 mt-1 ${m.sender_role === 'customer' ? 'text-right' : ''}`}>
                    {m.sender_role === 'staff' ? 'Equipo Cirelia · ' : ''}{formatDate(m.created_at)}
                  </p>
                </div>
              ))
            )}
            <div ref={threadEndRef} />
          </div>
          <div className="p-4 border-t border-ink-100 flex items-center gap-2">
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendReply()}
              placeholder="Escribí tu respuesta..."
              className="flex-1 h-10 px-3.5 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
            />
            <button
              onClick={sendReply}
              disabled={sendingReply || !reply.trim()}
              className="shrink-0 flex items-center gap-1.5 text-xs font-bold bg-gold-600 text-white px-4 h-10 rounded-xl hover:bg-gold-700 transition-colors disabled:opacity-40"
            >
              {sendingReply ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </button>
          </div>
        </div>
      )}

      {chats.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {chats.map((c) => (
            <button
              key={c.id}
              onClick={() => setOpenChatId(c.id)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
                openChatId === c.id ? 'bg-ink-900 text-cream-50 border-ink-900' : 'border-ink-200 text-ink-500 hover:border-gold-400'
              }`}
            >
              {new Date(c.created_at).toLocaleDateString('es-CR', { day: '2-digit', month: 'short' })}
            </button>
          ))}
        </div>
      )}

      {/* NUEVO MENSAJE */}
      <div className="space-y-3">
        {(chats.length > 0) && <p className="text-xs font-bold text-ink-500">¿Otra consulta? Escribinos de nuevo:</p>}
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Tu nombre</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-4 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">¿En qué te ayudamos?</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Contanos tu consulta o problema..."
              className="w-full px-4 py-3 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500 resize-none"
            />
          </div>
          {errorMsg && <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-3 rounded-xl">{errorMsg}</div>}
          <button
            type="submit"
            disabled={sending}
            className="bg-gold-600 text-white px-6 h-11 rounded-xl text-xs font-bold hover:bg-gold-700 transition-colors disabled:opacity-60"
          >
            {sending ? 'Enviando...' : 'Enviar mensaje'}
          </button>
        </form>
      </div>

      <div className="bg-ink-900 p-6 rounded-2xl flex items-center gap-4 text-white">
        <ChatBubbleLeftRightIcon className="w-10 h-10 text-gold-400 shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-bold">¿Necesitás atención inmediata?</h4>
          <p className="text-xs text-ink-400">Escribinos directo por WhatsApp y te respondemos al toque.</p>
        </div>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white text-ink-950 px-4 py-2 rounded-xl text-xs font-bold hover:bg-ink-100 transition-colors shrink-0"
        >
          Abrir WhatsApp
        </a>
      </div>
    </div>
  );
}
