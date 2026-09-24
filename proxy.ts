import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy único (antes middleware.ts — Next.js 16 renombró el archivo):
 * es la ÚNICA fuente de verdad de sesión + tenant + rol para toda la
 * app (reemplaza la mezcla anterior de NextAuth + Supabase Auth +
 * admin login falso por cookie).
 *
 * Corre en TODAS las rutas (ver `config.matcher` abajo) porque el
 * tenant hay que resolverlo también en el storefront público (home,
 * /shop, /product/...), no solo en las rutas protegidas. El slug
 * resuelto se inyecta como header `x-tenant-slug` en la REQUEST (no
 * en la response) para que Server Components lean con
 * headers().get('x-tenant-slug') más abajo en el árbol.
 *
 * Tenant resolution: hoy Cirelia es el único tenant activo, pero el
 * esquema (tenants.slug, users.tenant_id) ya soporta multi-tienda. Se
 * resuelve por subdominio (tienda.tuapp.com -> slug "tienda") con
 * fallback a NEXT_PUBLIC_DEFAULT_TENANT_SLUG ("cirelia") en local/preview
 * donde no hay subdominios reales.
 */

const PLATFORM_HOSTS = new Set(['localhost:3002', '127.0.0.1:3002']);

function resolveTenantSlug(host: string): string {
  const hostname = host.split(':')[0];
  const parts = hostname.split('.');

  // vercel.app preview / localhost / IP: sin subdominio real de tienda.
  const looksLikeApex =
    PLATFORM_HOSTS.has(host) ||
    hostname === 'localhost' ||
    parts.length <= 2 ||
    hostname.endsWith('.vercel.app');

  if (looksLikeApex) {
    return process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || 'cirelia';
  }

  return parts[0];
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const tenantSlug = resolveTenantSlug(request.headers.get('host') || '');

  // Headers de REQUEST (no de response): así llegan a Server Components
  // vía headers() de next/headers. Se recalculan cada vez que Supabase
  // rota cookies para no perder este header en el camino.
  const buildRequestHeaders = () => {
    const h = new Headers(request.headers);
    h.set('x-tenant-slug', tenantSlug);
    return h;
  };

  let response = NextResponse.next({ request: { headers: buildRequestHeaders() } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: buildRequestHeaders() } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: no quitar este getUser(). Revalida el token contra
  // Supabase Auth (a diferencia de leer la cookie sin más) y es lo que
  // mantiene la sesión viva/refrescada en cada request.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // También la exponemos como response header por si algún cliente la
  // necesita leer del lado del navegador (fetch a esta misma ruta, etc).
  response.headers.set('x-tenant-slug', tenantSlug);

  // /checkout NO va acá: el guest checkout es un requisito explícito del
  // negocio, así que /checkout debe ser accesible sin sesión. Solo
  // /profile exige cuenta + onboarding completo.
  const isProtectedCustomerRoute = pathname.startsWith('/profile');
  const isAdminRoute = pathname.startsWith('/admin');
  const isDeliveryRoute = pathname.startsWith('/delivery');

  if (isProtectedCustomerRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from('users')
      .select('dni')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !profile.dni) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('onboarding', 'true');
      return NextResponse.redirect(url);
    }
  }

  if (isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }

    // Rol real desde la base de datos (users.role), nunca desde una
    // cookie de cliente ni una lista de correos hardcodeada.
    const { data: staffProfile } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .maybeSingle();

    const role = staffProfile?.role;
    const isStaff = role === 'admin' || role === 'moderator';
    const isPlatformAdmin = role === 'super_admin';

    if (!isStaff && !isPlatformAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // Un admin/moderador de la tienda A no puede entrar al /admin de la
    // tienda B por subdominio. super_admin (plataforma) sí cruza tenants.
    if (isStaff && !isPlatformAdmin) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', tenantSlug)
        .maybeSingle();

      if (!tenant || staffProfile?.tenant_id !== tenant.id) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }
  }

  if (isDeliveryRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role !== 'delivery' && profile?.role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  // Corre en todo excepto assets estáticos y archivos de Next internos.
  // El tenant se necesita en TODA la app (storefront público incluido),
  // no solo en las rutas protegidas.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)'],
};
