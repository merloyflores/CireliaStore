'use client';
import { useState } from 'react';
import { ChatBubbleLeftRightIcon, PlusIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function SoportePage() {
  const [tickets] = useState([
    { id: 'TKT-8842', tema: 'Consulta sobre envío', estado: 'Abierto', fecha: '22/06/2026' },
    { id: 'TKT-8710', tema: 'Factura incorrecta', estado: 'Resuelto', fecha: '15/06/2026' },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black tracking-tighter">Centro de Ayuda</h2>
          <p className="text-xs text-zinc-500 font-medium">¿Tenés algún problema? Abrí un ticket y te contactaremos pronto.</p>
        </div>
        <button className="flex items-center gap-2 text-xs font-bold bg-sky-600 text-white px-4 py-2 rounded-xl hover:bg-sky-700 transition-colors">
          <PlusIcon className="w-4 h-4" /> Nuevo Ticket
        </button>
      </div>

      {/* Lista de Tickets */}
      <div className="border border-zinc-200 rounded-2xl overflow-hidden">
        <div className="divide-y divide-zinc-100">
          {tickets.map((t) => (
            <div key={t.id} className="p-5 flex items-center justify-between hover:bg-zinc-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${t.estado === 'Resuelto' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {t.estado === 'Resuelto' ? <CheckCircleIcon className="w-5 h-5" /> : <ClockIcon className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-xs font-black text-zinc-900">{t.tema}</p>
                  <p className="text-[10px] text-zinc-400">{t.id} • {t.fecha}</p>
                </div>
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-full ${t.estado === 'Resuelto' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {t.estado}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Caja de Contacto Rápido */}
      <div className="bg-zinc-900 p-6 rounded-2xl flex items-center gap-4 text-white">
        <ChatBubbleLeftRightIcon className="w-10 h-10 text-sky-400" />
        <div>
          <h4 className="text-sm font-bold">¿Necesitás atención inmediata?</h4>
          <p className="text-xs text-zinc-400">Nuestro equipo de soporte está disponible vía WhatsApp de lunes a viernes.</p>
        </div>
      </div>
    </div>
  );
}