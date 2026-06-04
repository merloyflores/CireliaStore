export default function SectionContainer({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    // 'py-16 md:py-24' genera el espacio (aire) entre secciones
    // 'max-w-7xl' mantiene el contenido centrado y elegante
    <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 ${className}`}>
      {children}
    </section>
  );
}