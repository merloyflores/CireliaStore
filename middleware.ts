import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Verificamos si la ruta actual empieza con /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Excluimos la página de login para evitar un bucle infinito
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Buscamos nuestra cookie de seguridad
    const token = request.cookies.get('admin_token');

    // Si no hay token, lo pateamos de vuelta al login
    if (!token || token.value !== 'autenticado') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

// Configuración para que el middleware solo se ejecute en rutas de admin
export const config = {
  matcher: '/admin/:path*',
};