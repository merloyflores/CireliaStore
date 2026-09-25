'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Loader2, Star, MessageSquareOff, Trash2, Search } from 'lucide-react';

type Review = {
  id: string;
  user_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  products: { name: string } | null;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function FeedbackPanel({ tenantId, onClose }: { tenantId: string; onClose: () => void }) {
  const supabase = createClient();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('product_reviews')
        .select('id, user_name, rating, comment, created_at, products!inner(name, tenant_id)')
        .eq('products.tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50);
      setReviews((data as any) ?? []);
      setLoading(false);
    }
    load();
  }, [tenantId]);

  // Borrar una reseña: antes este panel era de solo lectura — ahora se
  // puede moderar (quitar comentarios inapropiados o de spam) sin salir
  // del panel. El RLS ya permitía esto ("product_reviews: staff
  // modera"), solo faltaba la interfaz.
  const deleteReview = async (id: string) => {
    if (!confirm('¿Eliminar esta reseña? No se puede deshacer.')) return;
    setDeletingId(id);
    const { error } = await supabase.from('product_reviews').delete().eq('id', id);
    if (!error) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } else {
      alert('No se pudo eliminar la reseña.');
    }
    setDeletingId(null);
  };

  const avg = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';

  const q = search.trim().toLowerCase();
  const filtered = q
    ? reviews.filter(
        (r) =>
          (r.products?.name ?? '').toLowerCase().includes(q) ||
          (r.user_name ?? '').toLowerCase().includes(q) ||
          (r.comment ?? '').toLowerCase().includes(q)
      )
    : reviews;

  return (
    <div className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[85vh] overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 bg-white border-b border-ink-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="font-serif text-xl text-ink-900">Feedback de clientes</h2>
            <p className="text-xs text-ink-500">{reviews.length} reseñas · promedio {avg} ★</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-ink-50 rounded-full text-ink-500">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {!loading && reviews.length > 0 && (
            <div className="relative mb-4">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por producto, cliente o comentario..."
                className="w-full h-10 pl-9 pr-3 bg-cream-50 border border-ink-200 rounded-xl text-sm outline-none focus:border-gold-400"
              />
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="animate-spin text-ink-400" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquareOff size={36} className="text-ink-300 mb-3" />
              <p className="text-ink-500 font-medium text-sm">Todavía no hay reseñas de productos.</p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-ink-400 text-center py-10">Sin resultados para "{search}".</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((r) => (
                <div key={r.id} className="bg-cream-50 border border-ink-100 rounded-2xl p-4 relative">
                  <button
                    onClick={() => deleteReview(r.id)}
                    disabled={deletingId === r.id}
                    aria-label="Eliminar reseña"
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-ink-300 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deletingId === r.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                  <div className="flex items-center justify-between gap-3 mb-1 pr-7">
                    <p className="font-semibold text-ink-900 text-sm">{r.user_name || 'Cliente'}</p>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} className={i < r.rating ? 'text-gold-500 fill-gold-500' : 'text-ink-200'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gold-700 font-bold mb-1">{r.products?.name ?? 'Producto eliminado'}</p>
                  {r.comment && <p className="text-sm text-ink-600 leading-relaxed pr-7">{r.comment}</p>}
                  <p className="text-[10px] text-ink-400 mt-2">{formatDate(r.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
