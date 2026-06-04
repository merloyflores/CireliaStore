'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff } from 'lucide-react'; // Importamos Eye y EyeOff

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Estado para el "ojito"
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'Magoos@12') {
      document.cookie = "admin_token=autenticado; path=/; max-age=86400";
      router.push('/admin/dashboard');
    } else {
      setError('Credenciales incorrectas. Acceso denegado.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] border border-zinc-100 p-8 sm:p-10">
        
        {/* Header con un diseño más premium */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-zinc-950 text-white rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <Lock size={28} />
          </div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Cirelia Admin</h1>
          <p className="text-zinc-400 text-sm font-medium mt-1">Acceso seguro al sistema</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Usuario */}
          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Usuario</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 font-semibold text-sm focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
              placeholder="admin"
              required
            />
          </div>

          {/* Contraseña con el ojito */}
          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Contraseña</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 pr-12 font-semibold text-sm focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
                placeholder="••••••••"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error message elegante */}
          {error && (
            <div className="animate-in fade-in slide-in-from-top-1">
              <p className="text-red-600 text-xs font-bold bg-red-50 py-3 px-4 rounded-xl border border-red-100 text-center">
                {error}
              </p>
            </div>
          )}

          {/* Botón con efecto de presionado */}
          <button 
            type="submit"
            className="w-full h-12 bg-zinc-950 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-lg shadow-zinc-950/20"
          >
            Ingresar al panel
          </button>
        </form>
      </div>
    </div>
  );
}