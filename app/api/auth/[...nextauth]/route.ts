import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { SupabaseAdapter } from "@auth/supabase-adapter";

const handler = NextAuth({
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // ESTO ES CLAVE: Fuerza a Google a mostrar siempre la pantalla de selección de cuenta
      // y evita que reutilice sesiones viejas o cacheadas de forma automática.
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  // Cambiamos la estrategia a JWT para que la sesión se valide con el token real firmado
  // de la cuenta activa, evitando que el adaptador "amarre" sesiones cruzadas en la BD.
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  callbacks: {
    // Sincroniza el token generado por Google directamente con la sesión de NextAuth
    async jwt({ token, user, account }) {
      if (user && account) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    // Este callback es el que lee tu Navbar. Aquí nos aseguramos de pasarle 
    // el correo REAL y activo del token, sin intermediarios que lo alteren.
    async session({ session, token }) {
      if (session.user && token) {
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth",
  },
});

export { handler as GET, handler as POST };