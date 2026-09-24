import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import Providers from "./providers";
import { createClient } from "@/lib/supabase/server";
import { buildGoldOverrideStyle, isValidHex } from "@/lib/themeColors";

// Inter: texto de cuerpo, UI. Fraunces: serif elegante para titulares —
// es lo que le da el aire "boutique" de la marca (dorado/crema), en vez
// de un sans-serif genérico para todo como tenía el proyecto antes.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

export const metadata: Metadata = {
  title: "Cirelia Store",
  description: "Cirelia Store — productos exclusivos, calidad excepcional.",
};

// Trae el color "Primario" configurado en /admin/configuracion y lo
// convierte en una rampa de tonos que pisa --color-gold-* (ver
// lib/themeColors.ts). Corre en el servidor, en cada request, así que
// un cambio guardado en Configuración se ve de inmediato en el sitio
// entero — no solo en un componente aislado.
async function getGoldOverrideStyle(): Promise<Record<string, string> | undefined> {
  try {
    const headerList = await headers();
    const tenantSlug = headerList.get("x-tenant-slug") || process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || "cirelia";
    const supabase = await createClient();
    const { data: tenant } = await supabase.from("tenants").select("id").eq("slug", tenantSlug).maybeSingle();
    if (!tenant) return undefined;
    const { data: theme } = await supabase
      .from("tenant_theme")
      .select("color_primary")
      .eq("tenant_id", tenant.id)
      .maybeSingle();
    if (!theme || !isValidHex(theme.color_primary)) return undefined;
    return buildGoldOverrideStyle(theme.color_primary);
  } catch {
    // Si algo falla acá (tenant no resuelto, etc.) seguimos con la
    // paleta dorada original de globals.css — nunca debe tumbar el sitio.
    return undefined;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const goldOverrideStyle = await getGoldOverrideStyle();

  return (
    <html lang="es" className="scroll-smooth" style={goldOverrideStyle as React.CSSProperties}>
      <body
        className={`${inter.variable} ${fraunces.variable} font-sans antialiased min-h-dvh flex flex-col relative bg-cream-50 text-ink-900`}
      >
        <Providers>
          <div className="sticky top-0 z-50">
            <Navbar />
          </div>

          <main className="relative grow">
            {children}
            <WhatsAppWidget />
          </main>

          <div className="relative z-40">
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
