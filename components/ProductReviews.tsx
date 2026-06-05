'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, MessageSquare, Sparkles, Loader2, User } from 'lucide-react';

interface Review {
  id: string;
  user_name: string;
  user_avatar?: string; // Columna ya prevista para la foto de Google
  rating: number;
  comment: string;
  created_at: string;
}

export default function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el formulario de nueva reseña
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  async function fetchReviews() {
    setLoading(true);
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (!error && data) setReviews(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from('product_reviews').insert([{
      product_id: productId,
      user_name: userName.trim() || 'Comprador Cirelia',
      rating,
      comment: comment.trim()
      // user_avatar: session?.user?.image (Dejado listo para cuando conectes Google)
    }]);

    if (!error) {
      setComment('');
      setUserName('');
      setRating(5);
      fetchReviews();
    }
    setSubmitting(false);
  }

  // Función auxiliar para generar iniciales estéticas del Avatar
  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'CC';
  };

  return (
    <div className="mt-24 border-t border-zinc-100 pt-16 max-w-5xl mx-auto">
      {/* HEADER DE LA SECCIÓN */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 bg-zinc-950 text-white rounded-2xl flex items-center justify-center shadow-md shadow-zinc-950/10">
          <MessageSquare size={20} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-zinc-950 tracking-tight">Experiencias de la Comunidad</h3>
          <p className="text-zinc-500 text-sm font-medium">Opiniones y reseñas reales de nuestros compradores</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* FORMULARIO DE RESTRICCIÓN MODERNA */}
        <div className="lg:col-span-1 bg-zinc-50/50 border border-zinc-200/60 p-6 rounded-3xl backdrop-blur-sm sticky top-6">
          <h4 className="text-base font-black text-zinc-900 mb-5 tracking-tight flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500 fill-amber-500" /> Compartir mi opinión
          </h4>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* SELECTOR INTERACTIVO DE ESTRELLAS */}
            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Calificación</label>
              <div className="flex items-center gap-1.5 bg-white border border-zinc-200/80 p-2.5 rounded-xl justify-center shadow-inner">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-zinc-300 transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      size={24}
                      fill={(hoverRating || rating) >= star ? '#fbbf24' : 'transparent'}
                      className={(hoverRating || rating) >= star ? 'text-amber-400' : 'text-zinc-300'}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1.5">Tu Nombre</label>
              <input
                type="text"
                placeholder="Ej. Merloy Flores"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-xl px-4 h-11 text-xs font-semibold text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1.5">Tu Comentario</label>
              <textarea
                rows={4}
                placeholder="¿Qué te pareció el diseño, los materiales o el envío? Deja tus emojis favoritos... ✨"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-xl p-4 text-xs font-medium text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              className="w-full bg-zinc-950 text-white rounded-xl h-11 text-xs font-bold transition-all hover:bg-sky-600 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-zinc-950/10 active:scale-[0.98]"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Publicar Reseña'}
            </button>
          </form>
        </div>

        {/* FEED DE COMENTARIOS MEJORADO */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-zinc-400" size={28} /></div>
          ) : reviews.length === 0 ? (
            <div className="border border-dashed border-zinc-200 rounded-3xl p-12 text-center text-zinc-400 bg-zinc-50/30">
              <p className="text-base font-bold text-zinc-800 mb-1">Aún no hay testimonios en este artículo</p>
              <p className="text-xs text-zinc-500">Sé el primero en compartir tu experiencia de diseño con el mundo.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-150 overflow-y-auto pr-2 custom-scrollbar">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-zinc-200/70 transition-all flex items-start gap-4">
                  
                  {/* PREVISTA DEL AVATAR (DISEÑO PENSADO PARA GOOGLE AUTH) */}
                  <div className="shrink-0">
                    {rev.user_avatar ? (
                      <img 
                        src={rev.user_avatar} 
                        alt={rev.user_name} 
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-zinc-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-zinc-100 to-zinc-200/60 text-zinc-700 flex items-center justify-center text-xs font-black ring-2 ring-zinc-100">
                        {getInitials(rev.user_name)}
                      </div>
                    )}
                  </div>

                  {/* CONTENIDO INTERNO DE LA TARJETA */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <div>
                        <h5 className="text-sm font-bold text-zinc-950 tracking-tight truncate">{rev.user_name}</h5>
                        <span className="text-[10px] text-zinc-400 font-semibold block sm:inline">
                          {new Date(rev.created_at).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      
                      {/* ESTRELLAS DEL CLIENTE */}
                      <div className="flex gap-0.5 bg-zinc-50 px-2 py-1 rounded-lg border border-zinc-100 w-fit">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={12}
                            fill={rev.rating >= star ? '#fbbf24' : 'transparent'}
                            className={rev.rating >= star ? 'text-amber-400' : 'text-zinc-200'}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* CUERPO DEL COMENTARIO */}
                    <p className="text-xs text-zinc-600 leading-relaxed font-medium whitespace-pre-line bg-zinc-50/40 p-3 rounded-xl border border-zinc-100/50">
                      {rev.comment}
                    </p>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}