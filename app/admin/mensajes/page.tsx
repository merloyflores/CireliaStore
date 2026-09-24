'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/app/providers';
import {
  MessageSquare, Loader2, CheckCircle2, ExternalLink, Search, ChevronLeft, Circle,
  Send, Smile, BadgeCheck,
} from 'lucide-react';
import { useTenantSettings } from '@/lib/useTenantSettings';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  'Enviado a WhatsApp': { label: 'Nuevo', className: 'bg-amber-100 text-amber-700' },
  Nuevo: { label: 'Nuevo', className: 'bg-amber-100 text-amber-700' },
  Atendido: { label: 'Atendido', className: 'bg-emerald-100 text-emerald-700' },
};

// Set corto de emojis comunes para atención al cliente — sin depender
// de una librería externa, alcanza para lo que un admin usa a diario.
const EMOJIS = ['😊', '🙏', '👍', '❤️', '🎉', '📦', '🚚', '✅', '😅', '🤝', '⏳', '💬', '🙌', '✨', '👋', '😉'];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('es-CR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  return `${days} d`;
}

type Lead = {
  id: string;
  client_name: string;
  initial_message: string;
  status: string;
  created_at: string;
  user_id: string | null;
};

type CustomerInfo = { id: string; name: string | null; image: string | null };

type ThreadMessage = {
  id: string;
  chat_id: string;
  sender_role: 'customer' | 'staff';
  body: string;
  created_at: string;
};

export default function MensajesPage() {
  const supabase = createClient();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const { settings } = useTenantSettings();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data } = await supabase
      .from('support_chats')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    setLeads(data ?? []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  const markAttended = async (id: string) => {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status: 'Atendido' } : l)));
    const { error } = await supabase.from('support_chats').update({ status: 'Atendido' }).eq('id', id);
    if (error) alert('No se pudo actualizar: ' + error.message);
  };

  const filtered = leads.filter(
    (l) =>
      l.client_name.toLowerCase().includes(search.toLowerCase()) ||
      l.initial_message.toLowerCase().includes(search.toLowerCase())
  );

  const selected = leads.find((l) => l.id === selectedId) ?? null;
  const pendingCount = leads.filter((l) => l.status !== 'Atendido').length;

  // Carga la foto (si es cliente registrado) y el hilo de respuestas
  // cada vez que se abre un chat distinto.
  useEffect(() => {
    if (!selected) {
      setCustomerInfo(null);
      setThread([]);
      return;
    }
    setLoadingThread(true);
    setShowEmojis(false);
    (async () => {
      const [{ data: msgs }, customerRes] = await Promise.all([
        supabase.from('support_chat_messages').select('*').eq('chat_id', selected.id).order('created_at'),
        selected.user_id
          ? supabase.from('users').select('id, name, image').eq('id', selected.user_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      setThread((msgs as any) ?? []);
      setCustomerInfo((customerRes as any)?.data ?? null);
      setLoadingThread(false);
    })();
  }, [selected?.id]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.length]);

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    const { data, error } = await supabase
      .from('support_chat_messages')
      .insert({ chat_id: selected.id, sender_role: 'staff', sender_id: profile?.id ?? null, body: reply.trim() })
      .select('*')
      .single();
    setSending(false);
    if (error) {
      alert('No se pudo enviar la respuesta: ' + error.message);
      return;
    }
    setThread((t) => [...t, data]);
    setReply('');
    setShowEmojis(false);
    // Responder implica que ya se está atendiendo.
    if (selected.status !== 'Atendido') markAttended(selected.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-ink-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-ink-950 tracking-tight">Mensajes</h1>
        <p className="text-ink-500">
          Atención al cliente y consultas directas{pendingCount > 0 ? ` · ${pendingCount} sin atender` : ''}.
        </p>
      </div>

      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-ink-200 rounded-2xl bg-white">
          <MessageSquare size={40} className="text-ink-300 mb-4" />
          <p className="text-ink-500 font-medium">Todavía no llegó ningún mensaje.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden grid md:grid-cols-[320px_1fr] h-[70vh] min-h-[480px]">
          {/* LISTA */}
          <div className={`border-r border-ink-100 flex flex-col min-h-0 ${selected ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-ink-100 shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar mensajes..."
                  className="w-full h-10 pl-9 pr-3 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filtered.length === 0 ? (
                <p className="text-center text-xs text-ink-400 py-10">Sin resultados.</p>
              ) : (
                filtered.map((lead) => {
                  const status = STATUS_LABELS[lead.status] ?? { label: lead.status, className: 'bg-ink-100 text-ink-500' };
                  const isUnread = lead.status !== 'Atendido';
                  return (
                    <button
                      key={lead.id}
                      onClick={() => setSelectedId(lead.id)}
                      className={`w-full text-left px-4 py-3.5 border-b border-ink-50 hover:bg-cream-50 transition-colors ${
                        selectedId === lead.id ? 'bg-gold-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-semibold text-ink-900 text-sm truncate flex items-center gap-1.5">
                          {lead.client_name}
                          {lead.user_id && <BadgeCheck size={13} className="text-sky-500 shrink-0" />}
                        </p>
                        <span className="text-[10px] text-ink-400 shrink-0">{timeAgo(lead.created_at)}</span>
                      </div>
                      <p className="text-xs text-ink-500 truncate">{lead.initial_message}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {isUnread && <Circle size={6} className="fill-gold-500 text-gold-500" />}
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${status.className}`}>
                          {status.label.toUpperCase()}
                        </span>
                        <span className="text-[9px] font-bold text-ink-300 uppercase tracking-wide">
                          {lead.user_id ? '· Cliente' : '· Invitado'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* DETALLE */}
          <div className={`flex-col min-h-0 ${selected ? 'flex' : 'hidden md:flex'}`}>
            {!selected ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <MessageSquare size={32} className="text-ink-200 mb-3" />
                <p className="text-ink-400 text-sm font-medium">Selecciona un mensaje para leer</p>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-ink-100 flex items-center gap-3 shrink-0">
                  <button onClick={() => setSelectedId(null)} className="md:hidden p-1.5 text-ink-500 hover:bg-ink-100 rounded-lg">
                    <ChevronLeft size={18} />
                  </button>
                  {customerInfo?.image ? (
                    <img src={customerInfo.image} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gold-100 text-gold-700 font-black flex items-center justify-center text-sm shrink-0">
                      {selected.client_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink-900 text-sm truncate flex items-center gap-1.5">
                      {selected.client_name}
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                        selected.user_id ? 'bg-sky-100 text-sky-700' : 'bg-ink-100 text-ink-500'
                      }`}>
                        {selected.user_id ? 'CLIENTE REGISTRADO' : 'INVITADO (TEMPORAL)'}
                      </span>
                    </p>
                    <p className="text-[11px] text-ink-400">{formatDate(selected.created_at)}</p>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-1 rounded-full shrink-0 ${(STATUS_LABELS[selected.status] ?? { className: 'bg-ink-100 text-ink-500' }).className}`}>
                    {(STATUS_LABELS[selected.status] ?? { label: selected.status }).label.toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3">
                  {/* Mensaje inicial (siempre del cliente) */}
                  <div className="max-w-md bg-cream-50 border border-ink-100 rounded-2xl rounded-tl-sm p-4">
                    <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">{selected.initial_message}</p>
                  </div>

                  {loadingThread ? (
                    <div className="flex justify-center py-4">
                      <Loader2 size={16} className="animate-spin text-ink-300" />
                    </div>
                  ) : (
                    thread.map((m) => (
                      <div key={m.id} className={`max-w-md ${m.sender_role === 'staff' ? 'ml-auto' : ''}`}>
                        <div
                          className={`rounded-2xl p-4 ${
                            m.sender_role === 'staff'
                              ? 'bg-ink-900 text-cream-50 rounded-tr-sm'
                              : 'bg-cream-50 border border-ink-100 text-ink-700 rounded-tl-sm'
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.body}</p>
                        </div>
                        <p className={`text-[10px] text-ink-400 mt-1 ${m.sender_role === 'staff' ? 'text-right' : ''}`}>
                          {formatDate(m.created_at)}
                        </p>
                      </div>
                    ))
                  )}
                  <div ref={threadEndRef} />
                </div>

                {/* COMPOSER — responder desde acá, con emojis */}
                <div className="p-4 border-t border-ink-100 shrink-0 space-y-2">
                  {showEmojis && (
                    <div className="flex flex-wrap gap-1 bg-cream-50 border border-ink-100 rounded-xl p-2">
                      {EMOJIS.map((e) => (
                        <button
                          key={e}
                          onClick={() => setReply((r) => r + e)}
                          className="text-lg hover:scale-125 transition-transform p-1"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <button
                      onClick={() => setShowEmojis((s) => !s)}
                      className={`shrink-0 p-2.5 rounded-xl border transition-colors ${showEmojis ? 'bg-gold-50 border-gold-300 text-gold-700' : 'border-ink-200 text-ink-400 hover:text-ink-700'}`}
                      title="Emojis"
                    >
                      <Smile size={16} />
                    </button>
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendReply();
                        }
                      }}
                      placeholder="Escribí una respuesta..."
                      rows={1}
                      className="flex-1 resize-none max-h-24 px-3.5 py-2.5 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
                    />
                    <button
                      onClick={sendReply}
                      disabled={sending || !reply.trim()}
                      className="shrink-0 flex items-center gap-1.5 text-xs font-bold bg-ink-900 text-cream-50 px-4 py-2.5 rounded-xl hover:bg-gold-600 transition-colors disabled:opacity-40"
                    >
                      {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(`Hola ${selected.client_name}, te escribo de Cirelia por tu consulta.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      <ExternalLink size={12} /> También por WhatsApp
                    </a>
                    {selected.status !== 'Atendido' && (
                      <button
                        onClick={() => markAttended(selected.id)}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-ink-500 hover:text-ink-900 ml-auto"
                      >
                        <CheckCircle2 size={12} /> Marcar atendido
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
