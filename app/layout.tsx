import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppWidget from "@/components/WhatsAppWidget"; 
// 1. Importamos nuestro propio componente de cliente
import { Providers } from "./providers"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh flex flex-col relative`}>
        
        {/* 2. Usamos el contenedor de proveedores seguro */}
        <Providers>
          
          {/* El Navbar debe tener un z-index alto para estar encima de todo */}
          <div className="sticky top-0 z-50">
            <Navbar />
          </div>
          
          <main className="relative grow">
            {children}
            <WhatsAppWidget />
          </main>
          
          {/* El Footer también debe tener un z-index alto */}
          <div className="relative z-50">
            <Footer />
          </div>

        </Providers>
        
      </body>
    </html>
  );
}