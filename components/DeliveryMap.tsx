'use client';

import dynamic from 'next/dynamic';

// Leaflet necesita `window`, así que el mapa se carga solo en el
// navegador (sin SSR) para no romper el render del servidor.
const DeliveryMapInner = dynamic(() => import('./DeliveryMapInner'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-cream-200 animate-pulse rounded-2xl" />,
});

export default function DeliveryMap({ lat, lng, label }: { lat: number; lng: number; label?: string }) {
  return (
    <div className="w-full h-64 rounded-2xl overflow-hidden border border-ink-200">
      <DeliveryMapInner lat={lat} lng={lng} label={label} />
    </div>
  );
}
