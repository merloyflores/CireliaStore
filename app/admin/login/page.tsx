'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react'; 

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); 
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); 
    setIsLoading(true); 

    await new Promise(resolve => setTimeout(resolve, 500));

    if (username.trim() === 'admin' && password === 'Magoos@12') {
      document.cookie = "admin_token=autenticado; path=/; max-age=86400";
      router.push('/admin');
    } else {
      setError('Credenciales incorrectas. Acceso denegado.');
      setIsLoading(false); 
    }
  };

  return (
    // Forzamos text-zinc-900 y bg-zinc-50 a nivel global para mitigar herencias de modo oscuro
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] border border-zinc-100 p-8 sm:p-10">
        
        {/* Header */}
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
              disabled={isLoading}
              // Corrección de color fija (text-zinc-900) y text-base (16px) para evitar auto-zoom en iPhone
              className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 font-semibold text-base text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder="Usuario"
              required
              autoCapitalize="none" // Evita la mayúscula automática en iOS
              autoCorrect="off"     // Quita el corrector ortográfico en el usuario
              autoComplete="username"
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
                disabled={isLoading}
                // Ajustado color de texto fijo y tamaño base para el input de password
                className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 pr-12 font-semibold text-base text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="••••••••"
                required
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="current-password"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-50"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="animate-in fade-in slide-in-from-top-1">
              <p className="text-red-600 text-xs font-bold bg-red-50 py-3 px-4 rounded-xl border border-red-100 text-center">
                {error}
              </p>
            </div>
          )}

          {/* Botón dinámico */}
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-zinc-950 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-lg shadow-zinc-950/20 flex items-center justify-center gap-2 disabled:opacity-80 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Verificando...
              </>
            ) : (
              'Ingresar al panel'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}