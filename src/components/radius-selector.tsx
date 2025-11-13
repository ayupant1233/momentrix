"use client";

import { useMemo, useState } from "react";

const marks = [
  { value: 5, label: "5 km" },
  { value: 15, label: "15 km" },
  { value: 30, label: "30 km" },
  { value: 60, label: "60 km" },
  { value: 100, label: "100 km+" },
];

export function RadiusSelector() {
  const [radius, setRadius] = useState(15);

  const descriptor = useMemo(() => {
    if (radius <= 10) return "Perfect for quick shoots in your neighbourhood.";
    if (radius <= 25) return "Covers city centres and nearby suburbs.";
    if (radius <= 50) return "Ideal for destination events and travel gigs.";
    return "Expands your reach across the region for premium bookings.";
  }, [radius]);

  return (
    <div className="w-full rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-slate-100 shadow-soft-glow">
      <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-300">
        <span>Search radius</span>
        <span>{radius} km</span>
      </div>
      <input
        type="range"
        min={5}
        max={100}
        step={5}
        value={radius}
        onChange={(event) => setRadius(Number(event.target.value))}
        className="w-full accent-brand-400"
        aria-label="Adjust discovery radius"
      />
      <div className="mt-4 flex justify-between text-[11px] text-slate-400">
        {marks.map((mark) => (
          <span key={mark.value}>{mark.label}</span>
        ))}
      </div>
      <p className="mt-4 text-slate-300">{descriptor}</p>
    </div>
  );
}

