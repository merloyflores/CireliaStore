'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación temporal hardcodeada (Súper Pro tip: luego lo pasaremos a BD)
    if (username === 'admin' && password === 'Magoos@12') {
      // Guardamos un token de sesión en las cookies (válido por 1 día)
      document.cookie = "admin_token=autenticado; path=/; max-age=86400";
      router.push('/admin/dashboard');
    } else {
      setError('Credenciales incorrectas. Acceso denegado.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-zinc-100 p-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-zinc-950 text-white rounded-2xl flex items-center justify-center shadow-lg">
            <Lock size={32} />
          </div>
        </div>
        
        <h1 className="text-2xl font-black text-center text-zinc-950 mb-2 tracking-tight">
          Cirelia Admin
        </h1>
        <p className="text-zinc-500 text-center text-sm mb-8 font-medium">
          Panel de control de inventario y plataforma.
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-2">
              Usuario
            </label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 font-medium focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              placeholder="Ej. admin"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-2">
              Contraseña
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 font-medium focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100 text-center">
              {error}
            </p>
          )}

          <button 
            type="submit"
            className="w-full h-12 bg-zinc-950 text-white rounded-xl font-bold hover:bg-sky-600 transition-all active:scale-95 mt-4 shadow-md"
          >
            Acceder al Sistema
          </button>
        </form>
      </div>
    </div>
  );
}