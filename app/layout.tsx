import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import Providers from "./providers";
import { createClient } from "@/lib/supabase/server";
import { buildPaletteOverrideStyle, isValidHex } from "@/lib/themeColors";

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

// Trae los 4 colores configurados en /admin/configuracion (Primario,
// Secundario, Fondo, Texto) y convierte cada uno en su propia rampa de
// tonos, pisando --color-gold-*, --color-secondary-*, --color-cream-*
// y --color-ink-* (ver lib/themeColors.ts). Corre en el servidor, en
// cada request, así que un cambio guardado en Configuración se ve de
// inmediato en el sitio entero — no solo en un componente aislado.
async function getPaletteOverrideStyle(): Promise<Record<string, string> | undefined> {
  try {
    const headerList = await headers();
    const tenantSlug = headerList.get("x-tenant-slug") || process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || "cirelia";
    const supabase = await createClient();
    const { data: tenant } = await supabase.from("tenants").select("id").eq("slug", tenantSlug).maybeSingle();
    if (!tenant) return undefined;
    const { data: theme } = await supabase
      .from("tenant_theme")
      .select("color_primary, color_secondary, color_bg, color_text")
      .eq("tenant_id", tenant.id)
      .maybeSingle();
    if (!theme) return undefined;

    let style: Record<string, string> = {};
    if (isValidHex(theme.color_primary)) {
      style = { ...style, ...buildPaletteOverrideStyle("gold", theme.color_primary) };
    }
    if (isValidHex(theme.color_secondary)) {
      style = { ...style, ...buildPaletteOverrideStyle("secondary", theme.color_secondary) };
    }
    if (isValidHex(theme.color_bg)) {
      style = { ...style, ...buildPaletteOverrideStyle("cream", theme.color_bg) };
    }
    if (isValidHex(theme.color_text)) {
      style = { ...style, ...buildPaletteOverrideStyle("ink", theme.color_text) };
    }
    return Object.keys(style).length > 0 ? style : undefined;
  } catch {
    // Si algo falla acá (tenant no resuelto, etc.) seguimos con la
    // paleta original de globals.css — nunca debe tumbar el sitio.
    return undefined;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const paletteOverrideStyle = await getPaletteOverrideStyle();

  return (
    <html lang="es" className="scroll-smooth" style={paletteOverrideStyle as React.CSSProperties}>
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
