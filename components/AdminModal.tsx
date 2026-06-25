// components/AdminModal.tsx
import { X } from 'lucide-react';

export default function AdminModal({ isOpen, onClose, title, children }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      {/* Fondo oscuro difuminado */}
      <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      {/* Ventana */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-zinc-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-black text-zinc-950 uppercase tracking-widest">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-zinc-900">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}