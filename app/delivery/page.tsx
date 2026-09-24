'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Package, MapPin, Navigation, Loader2, CheckCircle2, Phone } from 'lucide-react';

const STATUS_FLOW = [
  { value: 'accepted', label: 'Aceptado' },
  { value: 'en_route', label: 'En camino' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'failed', label: 'No se pudo entregar' },
];

const STATUS_LABELS: Record<string, string> = {
  assigned: 'Asignado',
  accepted: 'Aceptado',
  en_route: 'En camino',
  delivered: 'Entregado',
  failed: 'No entregado',
};

function money(amount: number) {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(amount);
}

type Assignment = {
  id: string;
  status: string;
  order_id: string;
  orders: {
    invoice_number: number;
    total_amount: number;
    shipping_address: any;
    payment_method: string | null;
  } | null;
};

export default function DeliveryPortalPage() {
  const supabase = createClient();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('delivery_assignments')
      .select('id, status, order_id, orders(invoice_number, total_amount, shipping_address, payment_method)')
      .eq('courier_user_id', user.id)
      .neq('status', 'delivered')
      .order('assigned_at', { ascending: false });
    setAssignments((data as any) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (assignmentId: string, status: string) => {
    setUpdatingId(assignmentId);
    const { error } = await supabase.from('delivery_assignments').update({ status }).eq('id', assignmentId);
    setUpdatingId(null);
    if (error) {
      alert('No se pudo actualizar: ' + error.message);
      return;
    }
    // También registramos un evento de tracking con este cambio de
    // estado, aunque no tengamos coordenadas, para que quede en el
    // historial que ve el cliente/admin.
    await supabase.from('delivery_tracking_events').insert({ delivery_assignment_id: assignmentId, status });
    load();
  };

  const reportLocation = (assignmentId: string) => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }
    setReportingId(assignmentId);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { error } = await supabase.from('delivery_tracking_events').insert({
          delivery_assignment_id: assignmentId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setReportingId(null);
        if (error) alert('No se pudo reportar ubicación: ' + error.message);
      },
      (err) => {
        setReportingId(null);
        alert('No se pudo obtener tu ubicación: ' + err.message);
      },
      { enableHighAccuracy: true }
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-ink-400" />
      </div>
    );
  }

  return (
    <div className="bg-cream-50 min-h-screen py-10">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <h1 className="font-serif text-3xl text-ink-900 mb-1">Mis entregas</h1>
        <p className="text-ink-500 text-sm mb-8">Pedidos asignados a vos, pendientes de entregar.</p>

        {assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-ink-200 rounded-2xl bg-white">
            <Package size={36} className="text-ink-300 mb-3" />
            <p className="text-ink-500 font-medium">No tenés entregas pendientes.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((a) => {
              const address = a.orders?.shipping_address ?? {};
              return (
                <div key={a.id} className="bg-white rounded-2xl border border-ink-100 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink-900">Pedido #{a.orders?.invoice_number}</span>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
                      {STATUS_LABELS[a.status] ?? a.status}
                    </span>
                  </div>

                  <div className="bg-cream-50 rounded-xl p-4 space-y-1 text-sm">
                    <p className="font-semibold text-ink-900">{address.nombre}</p>
                    <p className="text-ink-600 flex items-start gap-1.5"><MapPin size={14} className="shrink-0 mt-0.5" /> {address.direccion}</p>
                    {address.telefono && (
                      <a href={`tel:${address.telefono}`} className="text-gold-700 font-semibold flex items-center gap-1.5">
                        <Phone size={14} /> {address.telefono}
                      </a>
                    )}
                    <p className="text-ink-500 text-xs pt-1">Total: {money(a.orders?.total_amount ?? 0)} · {a.orders?.payment_method === 'sinpe_whatsapp' ? 'Coordinado por SINPE/WhatsApp' : a.orders?.payment_method}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {STATUS_FLOW.map((s) => (
                      <button
                        key={s.value}
                        disabled={updatingId === a.id || a.status === s.value}
                        onClick={() => updateStatus(a.id, s.value)}
                        className={`text-xs font-bold px-3 py-2 rounded-xl border transition-colors ${
                          a.status === s.value ? 'bg-ink-900 text-cream-50 border-ink-900' : 'border-ink-200 text-ink-600 hover:border-gold-400'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                    <button
                      disabled={reportingId === a.id}
                      onClick={() => reportLocation(a.id)}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-gold-300 text-gold-700 hover:bg-gold-50 transition-colors disabled:opacity-60"
                    >
                      {reportingId === a.id ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                      Reportar mi ubicación
                    </button>
                  </div>

                  {a.status === 'delivered' && (
                    <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
                      <CheckCircle2 size={14} /> Entregado
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
