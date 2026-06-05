import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppWidget from "@/components/WhatsAppWidget"; 

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
      <body className="min-h-dvh flex flex-col">
        <Navbar />
        
        {/* Usamos un contenedor principal con 'relative' */}
        <main className="relative grow">
          {children}
          
          {/* Mueve el widget DENTRO del main, al final, 
              para que el 'sticky' sepa cuándo detenerse al llegar al footer */}
          <WhatsAppWidget />
        </main>
        
        <Footer />
      </body>
    </html>
  );
}