import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Cliente único de Supabase para Server Components, Server Actions y
 * Route Handlers. Lee/escribe la sesión desde las cookies de la
 * petición (Next 16: cookies() es async, por eso esta función también
 * lo es).
 *
 * Server Components no pueden escribir cookies (Next lo bloquea), así
 * que el catch en setAll() es intencional: si esta función se llama
 * desde un Server Component en vez de una Server Action o Route
 * Handler, falla en silencio y confía en que el middleware ya refrescó
 * la sesión antes de llegar aquí.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Llamado desde un Server Component: no se pueden setear
            // cookies aquí. El middleware se encarga de refrescar el
            // token de sesión en cada request.
          }
        },
      },
    }
  );
}
