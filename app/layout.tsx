import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// 1. Importamos los componentes
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cirelia Store | Hogar Premium+",
  description: "Tienda digital de productos exclusivos para el hogar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-zinc-950`}>
        {/* 2. Colocamos el Navbar arriba */}
        <Navbar />
        
        {/* 3. Aseguramos que el contenido ocupe el alto mínimo para que el footer no flote */}
        <main className="min-h-screen">
          {children}
        </main>
        
        {/* 4. Colocamos el Footer abajo */}
        <Footer />
      </body>
    </html>
  );
}
