import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase con la llave de "service role" — se salta RLS
 * por completo. SOLO se usa en Route Handlers que corren en el
 * servidor y que necesitan leer/escribir algo que un cliente anónimo
 * (un comprador en checkout, o el webhook de una pasarela de pago que
 * ni siquiera es un usuario de Supabase) no tiene permiso de tocar —
 * hoy, específicamente: leer la llave secreta de ONVOPay guardada por
 * el tenant (payment_provider_config, sin política pública a
 * propósito) y marcar un pedido como pagado cuando el webhook lo
 * confirma.
 *
 * NUNCA se importa desde un componente cliente ('use client') ni se
 * expone su resultado al navegador — eso anularía por completo el
 * propósito de tener RLS.
 *
 * Requiere la variable de entorno SUPABASE_SERVICE_ROLE_KEY (la
 * "service_role" secret key del proyecto, en Supabase → Project
 * Settings → API). No es la misma que NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Si falta, se lanza un error claro en vez de fallar en silencio.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Falta SUPABASE_SERVICE_ROLE_KEY en las variables de entorno. Sin esto, el checkout con pasarela de pago no puede funcionar — conseguila en Supabase → Project Settings → API → service_role.'
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
