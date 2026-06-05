import { User } from 'lucide-react';

export default function ProductFeedbackView({ feedbacks }: { feedbacks: any[] }) {
  // Nota: Las llaves asumen columnas típicas de una tabla 'product_reviews'
  // (ej. avatar_url, user_name, review_text, created_at)
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {feedbacks.length === 0 ? (
         <div className="col-span-full text-center py-12 text-zinc-400">
            <p className="text-sm font-medium">No hay reseñas registradas aún.</p>
         </div>
      ) : (
        feedbacks.map((item, i) => (
          <div key={i} className="flex flex-col justify-between p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm hover:border-zinc-300 transition-colors">
            
            {/* Parte Superior: Etiqueta y Comentario */}
            <div>
              <div className="inline-block mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
                  {item.product_name || 'Producto General'}
                </span>
              </div>
              <p className="text-sm text-zinc-700 italic mb-4 leading-relaxed">
                "{item.review_text || item.comment || 'Sin comentarios adicionales.'}"
              </p>
            </div>

            {/* Parte Inferior: Info del Usuario (Avatar + Nombre + Fecha) */}
            <div className="flex items-center gap-3 pt-4 border-t border-zinc-100">
              
              {/* Contenedor del Avatar */}
              <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 shadow-sm">
                {item.avatar_url ? (
                  <img 
                    src={item.avatar_url} 
                    alt={item.user_name || 'Avatar'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={16} className="text-zinc-400" />
                )}
              </div>
              
              {/* Textos del Usuario */}
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-900">
                  {item.user_name || item.client_name || 'Usuario Anónimo'}
                </span>
                <span className="text-[10px] font-medium text-zinc-400">
                  {item.created_at 
                    ? new Date(item.created_at).toLocaleDateString() 
                    : 'Cliente Verificado'}
                </span>
              </div>
              
            </div>
          </div>
        ))
      )}
    </div>
  );
}