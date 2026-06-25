import { createClient } from '@supabase/supabase-js';

// 1. Capturamos las variables de entorno de forma segura
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 2. Mock / Placeholder para el proceso de compilación (Build) en Vercel
// Esto evita el error estricto de "supabaseUrl is required" si Vercel compila antes de leer las variables
const isBuildTime = !supabaseUrl || !supabaseAnonKey;

const finalUrl = supabaseUrl || 'https://placeholder-url-for-vercel-build.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder-anon-key-for-vercel-build';

// 3. Inicialización del cliente blindado
export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    persistSession: true, // Mantiene la sesión del usuario guardada de forma segura
    autoRefreshToken: true, // Refresca los tokens automáticamente en segundo plano
  },
  global: {
    headers: {
      'X-Client-Info': 'cirelia-store-admin', // Etiqueta metadata útil para tus logs de Supabase
    },
  },
});

// Un log sutil en consola para desarrollo local que te avisa si todo está en orden
if (process.env.NODE_ENV === 'development') {
  if (isBuildTime) {
    console.warn('⚠️ Alerta Cirelia: Las variables de Supabase no están cargadas aún.');
  } else {
    console.log('✅ Conexión de Supabase inicializada correctamente para Cirelia Store.');
  }
}