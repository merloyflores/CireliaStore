'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '../../lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import { ShoppingBag, Mail, Lock, Eye, EyeOff, User, Phone, MapPin, CreditCard, ChevronDown } from 'lucide-react';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Estados de navegación del flujo
  const [mode, setMode] = useState<'login' | 'register' | 'onboarding'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Credenciales básicas
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Datos de Onboarding (Completar Perfil)
  const [firstName, setFirstName] = useState('');
  const [lastName1, setLastName1] = useState('');
  const [lastName2, setLastName2] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+506');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dniType, setDniType] = useState('Nacional');
  const [dniNumber, setDniNumber] = useState('');
  const [address, setAddress] = useState('');

  // Redirige a donde el usuario quería ir (?next=...) o a /profile por
  // defecto. El middleware/proxy sigue siendo la única fuente de verdad
  // sobre si el onboarding está completo: si no lo está, nos rebota de
  // vuelta acá con ?onboarding=true.
  const redirectAfterAuth = async () => {
    const next = searchParams.get('next');
    window.location.href = next && next.startsWith('/') ? next : '/profile';
  };

  useEffect(() => {
    let mounted = true;

    if (searchParams.get('onboarding') === 'true') {
      setMode('onboarding');
      setCheckingAuth(false);
      return;
    }

    if (searchParams.get('error') === 'auth_callback_failed') {
      setError('No se pudo completar el inicio de sesión. Intenta de nuevo.');
      setCheckingAuth(false);
      return;
    }

    const checkCurrentSession = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && mounted) {
          await redirectAfterAuth();
        } else if (mounted) {
          setCheckingAuth(false);
        }
      } catch (err) {
        console.error('Error al verificar sesión:', err);
        if (mounted) {
          setCheckingAuth(false);
        }
      }
    };

    checkCurrentSession();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 1. FLUJO: GOOGLE ---
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError('Error al conectar con Google. Por favor, intenta de nuevo.');
      setLoading(false);
    }
  };

  // --- 2. FLUJO: CORREO Y CONTRASEÑA ---
  const handleCredentialsAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;

        if (data.user && data.session === null) {
          setError('¡Registro exitoso! Revisa la bandeja de tu correo para verificar tu cuenta.');
          setLoading(false);
          return;
        }

        if (data.user) {
          await redirectAfterAuth();
        }
      } else if (mode === 'login') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;

        if (data.user) {
          await redirectAfterAuth();
        }
      }
    } catch (err: any) {
      if (err.message.includes('Invalid login credentials')) {
        setError('Credenciales incorrectas. Verifica tu correo y contraseña, o regístrate si no tienes cuenta.');
      } else if (err.message.includes('already registered')) {
        setError('Este correo ya está registrado. Por favor, inicia sesión.');
      } else {
        setError(err.message || 'Ocurrió un error inesperado.');
      }
      setLoading(false);
    }
  };

  // --- 3. FLUJO: GUARDAR PERFIL (ONBOARDING) EN public.users ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('No se detectó una sesión activa de seguridad.');

      const fullName = `${firstName} ${lastName1} ${lastName2}`.trim();
      const fullPhone = `${phonePrefix} ${phoneNumber}`;
      const defaultAddressJson = { principal: address };

      const profileData: any = {
        id: user.id,
        name: fullName,
        phone: fullPhone,
        dni: `${dniType}: ${dniNumber}`,
        default_address: defaultAddressJson,
        status: 'active',
      };
      if (user.email) {
        profileData.email = user.email;
      }

      const { error: upsertError } = await supabase.from('users').upsert(profileData, {
        onConflict: 'id',
      });

      if (upsertError) throw upsertError;

      await redirectAfterAuth();
    } catch (err: any) {
      console.error('Error al guardar el perfil:', err);
      setError(err.message || 'Error al guardar los datos del perfil.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col justify-center items-center px-4 py-12">
      <div
        className={`bg-cream-50 p-6 sm:p-8 md:p-10 rounded-[2.2rem] border border-ink-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full text-center space-y-6 transition-all duration-500 ease-in-out ${
          mode === 'onboarding' ? 'max-w-2xl' : 'max-w-md'
        }`}
      >
        <div className="mx-auto w-12 h-12 bg-ink-900 rounded-2xl flex items-center justify-center shadow-sm">
          <ShoppingBag className="text-cream-50 w-5 h-5" />
        </div>

        <div>
          <h1 className="font-serif text-2xl font-medium tracking-tight text-ink-900">
            {mode === 'onboarding' ? 'Completemos tu perfil' : mode === 'register' ? 'Crear una cuenta' : 'Bienvenido a Cirelia'}
          </h1>
          <p className="text-ink-400 text-xs font-semibold mt-1.5">
            {mode === 'onboarding'
              ? 'Necesitamos unos datos adicionales para tus envíos.'
              : 'Ingresa para gestionar tus pedidos y direcciones.'}
          </p>
        </div>

        {error && (
          <div
            className={`p-4 rounded-xl text-xs font-bold text-left border ${
              error.includes('exitoso') ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-600'
            }`}
          >
            {error}
          </div>
        )}

        {(mode === 'login' || mode === 'register') && (
          <>
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              type="button"
              className="w-full flex items-center justify-center gap-3 px-6 h-13 bg-cream-50 border border-ink-200 rounded-2xl text-xs font-black uppercase tracking-wider text-ink-700 hover:bg-cream-100 hover:text-ink-950 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3A11.917 11.917 0 0 0 12 .909a11.93 11.93 0 0 0-8.945 4.005L5.266 9.765z" />
                <path fill="#4285F4" d="M23.455 12.273c0-.818-.068-1.609-.205-2.364H12v4.509h6.432a5.591 5.591 0 0 1-2.423 3.664l3.782 2.927c2.209-2.036 3.664-5.045 3.664-8.736z" />
                <path fill="#FBBC05" d="M5.266 14.235L1.321 17.29A11.933 11.933 0 0 0 12 23.091c3.255 0 5.973-1.064 7.973-2.918l-3.782-2.927c-1.1.736-2.518 1.182-4.191 1.182a7.073 7.073 0 0 1-6.734-4.855t-.001-.338z" />
                <path fill="#34A853" d="M1.321 6.71a11.83 11.83 0 0 0 0 10.58l3.945-3.055a7.049 7.049 0 0 1 0-4.47L1.321 6.71z" />
              </svg>
              <span>Continuar con Google</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="grow border-t border-ink-200/80"></div>
              <span className="shrink mx-4 text-ink-400 text-[10px] font-extrabold uppercase tracking-widest">O con correo</span>
              <div className="grow border-t border-ink-200/80"></div>
            </div>

            <form onSubmit={handleCredentialsAuth} className="space-y-3.5 text-left">
              <div className="space-y-1">
                <label htmlFor="email" className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 bg-cream-100/60 border border-ink-200 rounded-xl text-xs font-medium focus:outline-none focus:bg-cream-50 focus:border-gold-500 focus:ring-4 focus:ring-gold-500/10 transition-all"
                  />
                  <Mail className="w-4 h-4 text-ink-400 absolute left-3.5 top-4" />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 pl-10 pr-10 bg-cream-100/60 border border-ink-200 rounded-xl text-xs font-medium focus:outline-none focus:bg-cream-50 focus:border-gold-500 focus:ring-4 focus:ring-gold-500/10 transition-all"
                  />
                  <Lock className="w-4 h-4 text-ink-400 absolute left-3.5 top-4" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-4 text-ink-400 hover:text-ink-600"
                    title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-ink-900 text-cream-50 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gold-600 active:scale-[0.98] transition-all disabled:opacity-50 mt-2 shadow-lg shadow-ink-900/10"
              >
                {loading ? 'Procesando...' : mode === 'register' ? 'Registrarme' : 'Iniciar Sesión'}
              </button>
            </form>

            <div className="text-xs font-medium text-ink-400 pt-1">
              {mode === 'register' ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'register' ? 'login' : 'register');
                  setError(null);
                }}
                className="font-bold text-ink-900 underline underline-offset-4 decoration-ink-200 hover:decoration-gold-500 hover:text-gold-700 transition-colors"
              >
                {mode === 'register' ? 'Inicia Sesión' : 'Regístrate aquí'}
              </button>
            </div>
          </>
        )}

        {mode === 'onboarding' && (
          <form onSubmit={handleSaveProfile} className="space-y-4 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="firstName" className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">
                  Primer Nombre
                </label>
                <div className="relative">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="Ej. Merloy Andrew"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 bg-cream-100/60 border border-ink-200 rounded-xl text-xs font-medium focus:outline-none focus:bg-cream-50 focus:border-gold-500 focus:ring-4 focus:ring-gold-500/10 transition-all"
                  />
                  <User className="w-4 h-4 text-ink-400 absolute left-3.5 top-4" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="lastName1" className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">
                    1° Apellido
                  </label>
                  <input
                    id="lastName1"
                    name="lastName1"
                    type="text"
                    required
                    placeholder="Flores"
                    value={lastName1}
                    onChange={(e) => setLastName1(e.target.value)}
                    className="w-full h-12 px-4 bg-cream-100/60 border border-ink-200 rounded-xl text-xs font-medium focus:outline-none focus:bg-cream-50 focus:border-gold-500 focus:ring-4 focus:ring-gold-500/10 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="lastName2" className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">
                    2° Apellido
                  </label>
                  <input
                    id="lastName2"
                    name="lastName2"
                    type="text"
                    placeholder="Veitch"
                    value={lastName2}
                    onChange={(e) => setLastName2(e.target.value)}
                    className="w-full h-12 px-4 bg-cream-100/60 border border-ink-200 rounded-xl text-xs font-medium focus:outline-none focus:bg-cream-50 focus:border-gold-500 focus:ring-4 focus:ring-gold-500/10 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="dniType" className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">
                    ID
                  </label>
                  <div className="relative">
                    <select
                      id="dniType"
                      name="dniType"
                      value={dniType}
                      onChange={(e) => setDniType(e.target.value)}
                      className="w-full h-12 pl-3.5 pr-8 bg-cream-100/60 border border-ink-200 rounded-xl text-xs font-bold text-ink-700 appearance-none focus:outline-none focus:bg-cream-50 focus:border-gold-500 focus:ring-4 focus:ring-gold-500/10 transition-all cursor-pointer"
                    >
                      <option value="Nacional">Nacional</option>
                      <option value="Residencia">Dimex</option>
                      <option value="Jurídica">Jurídica</option>
                      <option value="Pasaporte">Pasaporte</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-ink-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="dniNumber" className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">
                    Documento
                  </label>
                  <div className="relative">
                    <input
                      placeholder="1 1234 5678"
                      id="dniNumber"
                      name="dniNumber"
                      type="text"
                      required
                      value={dniNumber}
                      onChange={(e) => setDniNumber(e.target.value)}
                      className="w-full h-12 pl-9 pr-2 bg-cream-100/60 border border-ink-200 rounded-xl text-xs font-medium focus:outline-none focus:bg-cream-50 focus:border-gold-500 focus:ring-4 focus:ring-gold-500/10 transition-all"
                    />
                    <CreditCard className="w-4 h-4 text-ink-400 absolute left-3 top-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="phoneNumber" className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">
                  Teléfono Móvil
                </label>
                <div className="relative flex items-center bg-cream-100/60 border border-ink-200 rounded-xl focus-within:bg-cream-50 focus-within:border-gold-500 focus-within:ring-4 focus-within:ring-gold-500/10 transition-all overflow-hidden h-12">
                  <input
                    id="phonePrefix"
                    name="phonePrefix"
                    type="text"
                    value={phonePrefix}
                    onChange={(e) => setPhonePrefix(e.target.value)}
                    className="w-14 h-full text-center bg-ink-100/40 border-r border-ink-200/80 text-xs font-bold text-ink-600 focus:outline-none"
                    placeholder="+506"
                  />
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    required
                    placeholder="8888 8888"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full h-full pl-3.5 pr-10 bg-transparent text-xs font-medium focus:outline-none"
                  />
                  <Phone className="w-4 h-4 text-ink-400 absolute right-3.5" />
                </div>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label htmlFor="address" className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">
                  Dirección Exacta de Envío
                </label>
                <div className="relative">
                  <textarea
                    id="address"
                    name="address"
                    placeholder="Ej. Alajuela, Urb. Los Adobes, 4ta entrada..."
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full py-3.5 pl-10 pr-4 bg-cream-100/60 border border-ink-200 rounded-xl text-xs font-medium focus:outline-none focus:bg-cream-50 focus:border-gold-500 focus:ring-4 focus:ring-gold-500/10 transition-all resize-none min-h-20"
                  />
                  <MapPin className="w-4 h-4 text-ink-400 absolute left-3.5 top-4" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-ink-900 text-cream-50 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gold-600 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 mt-2 shadow-lg shadow-ink-900/10"
            >
              {loading ? 'Guardando Perfil...' : 'Completar y Entrar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream-50 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
