import { Package, Truck, CheckCircle2, ShoppingCart } from 'lucide-react';

const statusSteps = [
  { id: 'paid', label: 'Pagado', icon: ShoppingCart },
  { id: 'packed', label: 'Preparando', icon: Package },
  { id: 'shipped', label: 'En Ruta', icon: Truck },
  { id: 'delivered', label: 'Entregado', icon: CheckCircle2 },
];

export default function OrderTimeline({ currentStatus }: { currentStatus: string }) {
  // Ajustamos el índice según el status actual
  const currentIndex = statusSteps.findIndex(s => s.id === currentStatus);

  return (
    <div className="py-4">
      {statusSteps.map((step, index) => {
        const Icon = step.icon;
        const isActive = index <= currentIndex;
        return (
          <div key={step.id} className="flex gap-4 relative pb-6 last:pb-0">
            {index < statusSteps.length - 1 && (
              <div className={`absolute left-5 top-10 bottom-0 w-0.5 ${index < currentIndex ? 'bg-sky-600' : 'bg-zinc-200'}`} />
            )}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 ${isActive ? 'bg-sky-600 border-sky-600 text-white' : 'bg-white border-zinc-200 text-zinc-400'}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="pt-2">
              <p className={`text-xs font-black ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`}>{step.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}