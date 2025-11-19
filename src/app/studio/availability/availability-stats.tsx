"use client";

import { useMemo } from "react";

type AvailabilityStatsProps = {
  totalSlots: number;
  bookedSlots: number;
  upcomingSlots: number;
  nextAvailableDate: string | null;
};

export function AvailabilityStats({
  totalSlots,
  bookedSlots,
  upcomingSlots,
  nextAvailableDate,
}: AvailabilityStatsProps) {
  const utilizationRate = useMemo(() => {
    if (totalSlots === 0) return 0;
    return Math.round((bookedSlots / totalSlots) * 100);
  }, [totalSlots, bookedSlots]);

  const formattedNextAvailable = useMemo(() => {
    if (!nextAvailableDate) return "Not set";
    try {
      const date = new Date(nextAvailableDate);
      return date.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "Not set";
    }
  }, [nextAvailableDate]);

  const stats = [
    {
      label: "Total Slots",
      value: totalSlots,
      subtitle: `${upcomingSlots} upcoming`,
    },
    {
      label: "Booked",
      value: bookedSlots,
      subtitle: `${utilizationRate}% utilization`,
    },
    {
      label: "Next Available",
      value: formattedNextAvailable,
      subtitle: nextAvailableDate ? "Earliest open slot" : "Add availability slots",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{stat.label}</p>
          <p className="mt-2 text-xl font-bold text-white">{stat.value}</p>
          <p className="mt-1 text-xs text-slate-400">{stat.subtitle}</p>
        </div>
      ))}
    </div>
  );
}

