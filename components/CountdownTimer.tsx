'use client';

/**
 * Contador regresivo tipo Temu/Gollo ("termina en 2d 04h 12m 08s").
 * No dibuja nada si no hay fecha límite o si ya pasó — así se puede
 * poner en cualquier pieza/sección sin chequear la condición afuera.
 */

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

function timeLeft(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { days, hours, minutes, seconds };
}

const pad = (n: number) => String(n).padStart(2, '0');

export default function CountdownTimer({
  endsAt,
  label = 'Termina en',
  compact = false,
}: {
  endsAt?: string | null;
  label?: string;
  compact?: boolean;
}) {
  const [left, setLeft] = useState<ReturnType<typeof timeLeft>>(() => (endsAt ? timeLeft(endsAt) : null));

  useEffect(() => {
    if (!endsAt) return;
    setLeft(timeLeft(endsAt));
    const id = setInterval(() => setLeft(timeLeft(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!endsAt || !left) return null;

  const units = [
    left.days > 0 ? { v: left.days, l: 'd' } : null,
    { v: left.hours, l: 'h' },
    { v: left.minutes, l: 'm' },
    { v: left.seconds, l: 's' },
  ].filter(Boolean) as { v: number; l: string }[];

  return (
    <div
      className={`inline-flex items-center gap-2 bg-ink-950/90 text-cream-50 rounded-full backdrop-blur-sm ${
        compact ? 'px-2.5 py-1' : 'px-4 py-2'
      }`}
    >
      <Clock size={compact ? 11 : 14} className="text-gold-400 shrink-0" />
      {!compact && <span className="text-[10px] font-bold uppercase tracking-wider text-ink-300">{label}</span>}
      <div className="flex items-center gap-1 font-mono font-black tabular-nums" style={{ fontSize: compact ? 11 : 13 }}>
        {units.map((u, i) => (
          <span key={u.l} className="flex items-center gap-1">
            {i > 0 && <span className="text-ink-500">:</span>}
            {pad(u.v)}
            <span className="text-[9px] font-sans font-bold text-ink-400 normal-case">{u.l}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
