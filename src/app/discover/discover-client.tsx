"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

type AvailablePhotographer = {
  id: string;
  name: string;
  headline: string | null;
  city: string | null;
  travelRadiusKm: number;
  hourlyRate: number | null;
  fullDayRate: number | null;
  services: string[] | null;
  tags: string[] | null;
  verificationStatus: string;
  email: string;
  phone: string;
  hero: {
    id: string;
    title: string;
    mediaUrl: string;
  } | null;
};

type DiscoverClientProps = {
  defaultLatitude: number | null;
  defaultLongitude: number | null;
  defaultRadiusKm: number;
  available: AvailablePhotographer[];
};

type PhotographerResult = {
  id: string;
  name: string;
  headline: string | null;
  city: string | null;
  distance: number;
  travelRadiusKm: number;
  hourlyRate: number | null;
  fullDayRate: number | null;
  verificationStatus: string;
  services: string[] | null;
  tags: string[] | null;
  reviews: number;
  averageRating: number | null;
  portfolioItems: {
    id: string;
    title: string;
    mediaUrl: string;
  }[];
  email: string;
  phone: string;
};

export function DiscoverClient({ defaultLatitude, defaultLongitude, defaultRadiusKm, available }: DiscoverClientProps) {
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState(defaultRadiusKm);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    defaultLatitude != null && defaultLongitude != null
      ? { latitude: defaultLatitude, longitude: defaultLongitude }
      : null,
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ["discover", coords?.latitude, coords?.longitude, radius, query],
    queryFn: async () => {
      const params = new URLSearchParams({
        latitude: String(coords?.latitude ?? 0),
        longitude: String(coords?.longitude ?? 0),
        radius: String(radius),
      });
      if (query) params.set("q", query);
      const res = await fetch(`/api/photographers/search?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load photographers");
      return res.json() as Promise<{ results: PhotographerResult[] }>;
    },
    enabled: Boolean(coords),
    staleTime: 1000 * 60,
  });

  const radiusDescriptor = useMemo(() => {
    if (radius <= 15) return "Hyperlocal creators within a short commute.";
    if (radius <= 40) return "Covers the entire city and neighboring suburbs.";
    if (radius <= 80) return "Optimized for destination shoots and offsites.";
    return "Pulling from the best across the region.";
  }, [radius]);

  return (
    <div className="space-y-10 rounded-4xl border border-white/10 bg-white/5 p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-white">Discover nearby photographers</h1>
          <p className="text-sm text-slate-300">
            Set your radius and brief so we can match you with creators ready to shoot.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            placeholder="Search by style, keyword, or service"
            className="input min-w-[240px]"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type="button"
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    setCoords({
                      latitude: position.coords.latitude,
                      longitude: position.coords.longitude,
                    });
                  },
                  () => {
                    alert("Enable location access to personalise search.");
                  },
                );
              } else {
                alert("Geolocation is not supported in this browser.");
              }
            }}
          >
            Use my current location
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <aside className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">Filters</h2>
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            <span className="font-medium text-white">Latitude</span>
            <input
              type="number"
              value={coords?.latitude ?? ""}
              onChange={(event) =>
                setCoords((current) => ({
                  latitude: Number(event.target.value),
                  longitude: current?.longitude ?? 0,
                }))
              }
              className="input"
              placeholder="12.9716"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            <span className="font-medium text-white">Longitude</span>
            <input
              type="number"
              value={coords?.longitude ?? ""}
              onChange={(event) =>
                setCoords((current) => ({
                  longitude: Number(event.target.value),
                  latitude: current?.latitude ?? 0,
                }))
              }
              className="input"
              placeholder="77.5946"
            />
          </label>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-200">
              Discovery radius
            </h3>
            <input
              className="mt-3 w-full accent-brand-400"
              type="range"
              min={5}
              max={120}
              step={5}
              value={radius}
              onChange={(event) => setRadius(Number(event.target.value))}
            />
            <p className="mt-2 text-xs text-slate-400">
              {radius} km • {radiusDescriptor}
            </p>
          </div>
        </aside>

        <section className="space-y-4">
          {!coords ? (
            <EmptyDiscoverState available={available} />
          ) : isLoading ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-slate-300">
              Loading matches based on your preferences...
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-8 text-sm text-rose-100">
              {(error as Error).message}
            </div>
          ) : data?.results.length ? (
            <>
              <p className="text-sm text-slate-300">
                Showing {data?.results.length ?? 0} creators within your radius.
              </p>
              <div className="grid gap-5 md:grid-cols-2">
                {data?.results.map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-brand-300/60"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                        <p className="text-xs uppercase tracking-wide text-brand-200">
                          {item.headline ?? "Awaiting headline"}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                        {item.distance.toFixed(1)} km away
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-300">
                      {item.hourlyRate ? (
                        <span className="rounded-full border border-white/10 px-3 py-1">
                          ₹{item.hourlyRate}/hr
                        </span>
                      ) : null}
                      {item.fullDayRate ? (
                        <span className="rounded-full border border-white/10 px-3 py-1">
                          Full day ₹{item.fullDayRate}
                        </span>
                      ) : null}
                      <span className="rounded-full border border-white/10 px-3 py-1">
                        {item.averageRating ? `${item.averageRating.toFixed(1)}★` : "New on Momentrix"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {item.services && item.services.length
                        ? item.services.join(", ")
                        : "Update your services to stand out."}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-brand-200">
                      {item.tags?.slice(0, 6).map((tag) => (
                        <span key={tag} className="rounded-full border border-brand-400/40 px-3 py-1">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-col gap-1 text-xs text-slate-300">
                      {item.phone ? <span>📞 {item.phone}</span> : null}
                      <span>✉️ {item.email}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.phone ? (
                        <a
                          href={`tel:${item.phone.replace(/[^+0-9]/g, "")}`}
                          className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                        >
                          Call
                        </a>
                      ) : null}
                      <a
                        href={`mailto:${item.email}`}
                        className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                      >
                        Email
                      </a>
                    </div>
                    <button className="mt-auto rounded-full bg-brand-500/20 px-4 py-2 text-sm font-semibold text-brand-100 transition hover:bg-brand-400/30">
                      View profile &amp; chat
                    </button>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <NoMatchesState available={available} radius={radius} />
          )}
        </section>
      </div>
    </div>
  );
}

function EmptyDiscoverState({ available }: { available: AvailablePhotographer[] }) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-8 text-sm text-slate-300">
        Share a city or enable geolocation to see ranked photographers. In the meantime, here are some creators
        accepting new projects.
      </div>
      <AvailableFallback available={available} />
    </div>
  );
}

function NoMatchesState({ available, radius }: { available: AvailablePhotographer[]; radius: number }) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 p-8 text-sm text-rose-100">
        We couldn’t find photographers within {radius} km for your filters. Try widening your radius or explore creators
        who are currently available below.
      </div>
      <AvailableFallback available={available} />
    </div>
  );
}

function AvailableFallback({ available }: { available: AvailablePhotographer[] }) {
  if (available.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        We’re onboarding more photographers. Check back soon or submit a brief for a curated shortlist.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Available photographers</h3>
        <p className="text-xs uppercase tracking-wide text-slate-500">Pre-screened and ready to respond</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {available.map((photographer) => (
          <article key={photographer.id} className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{photographer.name}</p>
                <p className="text-xs text-slate-400">
                  {photographer.city ?? "Location TBD"} • travels {photographer.travelRadiusKm} km
                </p>
              </div>
              <span className="rounded-full border border-brand-400/40 px-3 py-1 text-[11px] uppercase tracking-wide text-brand-200">
                {photographer.verificationStatus.toLowerCase()}
              </span>
            </div>
            {photographer.hero ? (
              <div className="overflow-hidden rounded-3xl border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photographer.hero.mediaUrl} alt={photographer.hero.title} className="h-40 w-full object-cover" />
              </div>
            ) : null}
            {photographer.services?.length ? (
              <p className="text-xs text-slate-300">{photographer.services.slice(0, 4).join(" • ")}</p>
            ) : (
              <p className="text-xs text-slate-300">Ask about their packages and add-ons.</p>
            )}
            {photographer.tags?.length ? (
              <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-brand-200">
                {photographer.tags.slice(0, 6).map((tag) => (
                  <span key={tag} className="rounded-full border border-brand-400/40 px-3 py-1">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {photographer.phone ? (
                <a
                  href={`tel:${photographer.phone.replace(/[^+0-9]/g, "")}`}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                >
                  Call
                </a>
              ) : null}
              <a
                href={`mailto:${photographer.email}`}
                className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
              >
                Email
              </a>
              <a
                href={`/photographers/${photographer.id}`}
                className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
              >
                View profile
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

