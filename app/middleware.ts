import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Correos autorizados para el entorno de administración
const ADMIN_EMAILS = [
  'merloy123@gmail.com', 
  'emaros09@gmail.com', 
  'merloyveitch@gmail.com'
];

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Si intenta entrar al panel de administración, verificar si su correo es admin
    if (pathname.startsWith("/admin")) {
      if (!token?.email || !ADMIN_EMAILS.includes(token.email)) {
        // Si está logueado pero no es admin, lo mandamos al inicio
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  },
  {
    callbacks: {
      // Este callback define si el usuario tiene permitido el acceso general a las rutas protegidas
      authorized: ({ token }) => !!token, // Si hay token (sesión), está autorizado
    },
    pages: {
      signIn: "/auth", // Si no está logueado, NextAuth lo redirige automáticamente a tu página de login
    },
  }
);

// LA MAGIA ESTÁ AQUÍ: Solo estas rutas requerirán inicio de sesión obligatorio
// Todo lo demás (Inicio, Hogar, Decoración, Ofertas, Carrito, etc.) queda 100% abierto.
export const config = {
  matcher: [
    "/admin/:path*", 
    "/profile/:path*", 
    "/checkout/:path*" // Cuando crees la pasarela de pago, agrégala aquí
  ],
};