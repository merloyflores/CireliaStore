'use client';
import { MapPinIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function DireccionesPage() {
  // Simulamos datos de la BD
  const direcciones = [
    { id: 1, alias: 'Casa', direccion: 'Alajuela, Sabana Norte, 200m norte de la escuela', principal: true },
    { id: 2, alias: 'Oficina', direccion: 'San José, Edificio Corporativo Unicomer, Piso 3', principal: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black tracking-tighter">Mis Direcciones</h2>
        <button className="flex items-center gap-2 text-xs font-bold bg-zinc-950 text-white px-4 py-2 rounded-xl">
          <PlusIcon className="w-4 h-4" /> Agregar Nueva
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {direcciones.map((dir) => (
          <div key={dir.id} className={`p-6 rounded-2xl border ${dir.principal ? 'border-sky-500 bg-sky-50/50' : 'border-zinc-200'}`}>
            <div className="flex justify-between items-start mb-4">
              <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${dir.principal ? 'bg-sky-500 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                {dir.alias}
              </span>
              <button className="text-zinc-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-zinc-600 font-medium">{dir.direccion}</p>
          </div>
        ))}
      </div>
    </div>
  );
}