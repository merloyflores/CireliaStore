'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, MessageSquare, Sparkles, Loader2, Award, Zap, User } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

interface Review {
  id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null); // Estado para detectar sesión
  
  // Estado para el formulario de nueva reseña
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Detectar si el usuario ya tiene sesión iniciada con Google
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        // Autocompletamos el nombre si existe metadata
        setUserName(session.user.user_metadata?.full_name || session.user.user_metadata?.name || '');
      }
    });
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
      // No reseteamos userName para que se mantenga el nombre del usuario logueado
      setRating(5);
      fetchReviews();
    }
    setSubmitting(false);
  }

  // Función auxiliar para generar iniciales estéticas del Avatar
  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'CC';
  };

  const averageRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : 0;

  return (
    <div className="pt-20">
      {/* HEADER EDITORIAL */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div>
          <h3 className="text-4xl font-black text-zinc-950 tracking-tighter mb-2">Opiniones de la Comunidad</h3>
          <p className="text-zinc-500 font-medium max-w-md">Qué dicen quienes ya disfrutan de este producto. Transparencia total en cada reseña.</p>
        </div>
        
        {/* RESUMEN DE CALIFICACIÓN */}
        {reviews.length > 0 && (
          <div className="flex items-center gap-4 bg-zinc-950 px-6 py-3 rounded-2xl text-white shadow-xl shadow-zinc-950/20">
            <span className="text-3xl font-black tracking-tighter">{averageRating}</span>
            <div className="flex flex-col">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => <Star key={i} size={14} fill={Number(averageRating) >= i ? "#fbbf24" : "transparent"} className={Number(averageRating) >= i ? "text-amber-400" : "text-zinc-600"} />)}
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Promedio de {reviews.length} reseñas</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* COLUMNA FORMULARIO (Sticky) */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 bg-white border border-zinc-200 p-8 rounded-3xl shadow-sm shadow-zinc-200/50">
            <h4 className="text-lg font-black text-zinc-950 mb-6 flex items-center gap-2">
              <Zap size={18} className="text-sky-500 fill-sky-500" /> 
              {session ? `Hola, ${userName.split(' ')[0]}` : 'Comparte tu experiencia'}
            </h4>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* SELECTOR INTERACTIVO DE ESTRELLAS */}
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 block">Calificación</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      type="button" 
                      onClick={() => setRating(star)} 
                      onMouseEnter={() => setHoverRating(star)} 
                      onMouseLeave={() => setHoverRating(0)} 
                      className="p-1 transition hover:scale-110"
                    >
                      <Star size={28} fill={(hoverRating || rating) >= star ? '#fbbf24' : '#e4e4e7'} className="text-transparent" />
                    </button>
                  ))}
                </div>
              </div>

              {/* INPUT NOMBRE */}
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-zinc-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Tu nombre" 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)} 
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all" 
                />
              </div>

              {/* TEXTAREA COMENTARIO */}
              <div>
                <textarea 
                  rows={4} 
                  placeholder="¿Qué te pareció el diseño, los materiales o el envío? ✨" 
                  value={comment} 
                  onChange={(e) => setComment(e.target.value)} 
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all resize-none leading-relaxed" 
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting || !comment.trim()} 
                className="w-full bg-zinc-950 text-white rounded-xl py-4 font-bold text-sm hover:bg-sky-600 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-zinc-950/20 active:scale-[0.98]"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Publicar Reseña'}
              </button>
            </form>
          </div>
        </div>

        {/* FEED DE RESEÑAS */}
        <div className="lg:col-span-8">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-zinc-400" size={32} /></div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-24 border-2 border-dashed border-zinc-200 rounded-3xl bg-zinc-50/50">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="text-zinc-400" />
              </div>
              <p className="font-black text-zinc-950">Sé el primero en opinar</p>
              <p className="text-xs text-zinc-500">Comparte tu experiencia con el mundo.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {reviews.map((rev) => (
                <div key={rev.id} className="group bg-white border border-zinc-200 p-8 rounded-3xl shadow-sm hover:shadow-xl hover:border-sky-100 transition-all duration-300">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      {/* PREVISTA DEL AVATAR */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center font-black text-zinc-600 border border-zinc-100 shadow-inner">
                        {getInitials(rev.user_name)}
                      </div>
                      <div>
                        <h5 className="font-black text-zinc-950">{rev.user_name}</h5>
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                          {new Date(rev.created_at).toLocaleDateString('es-CR', { month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {/* ESTRELLAS */}
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => <Star key={i} size={14} fill={rev.rating >= i ? "#fbbf24" : "transparent"} className={rev.rating >= i ? "text-amber-400" : "text-zinc-200"} />)}
                    </div>
                  </div>
                  {/* COMENTARIO */}
                  <p className="text-zinc-600 leading-relaxed italic text-[15px]">"{rev.comment}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}