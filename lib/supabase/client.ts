'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente único de Supabase para Client Components ('use client').
 *
 * Reemplaza al viejo singleton de lib/supabase.ts (createClient de
 * @supabase/supabase-js sin manejo de cookies SSR). Este usa
 * createBrowserClient de @supabase/ssr para que la sesión se comparta
 * correctamente vía cookies con el servidor (middleware, Server
 * Components, Route Handlers) en vez de vivir solo en localStorage.
 *
 * Uso: llamar createClient() dentro del componente/función que lo
 * necesita (no exportar una instancia ya creada) para evitar compartir
 * estado entre renders/usuarios en el servidor y para que siempre tome
 * las variables de entorno actuales.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
