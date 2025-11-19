"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";

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
  followed: boolean;
  nextAvailability: string | null;
};

const SORT_OPTIONS = [
  { value: "distance", label: "Distance" },
  { value: "price-asc", label: "Price (Low to High)" },
  { value: "price-desc", label: "Price (High to Low)" },
  { value: "rating", label: "Rating" },
] as const;

const SERVICE_TAGS = [
  "Wedding",
  "Fashion",
  "Product",
  "Events",
  "Travel",
  "Portraits",
  "Food",
  "Real estate",
] as const;

export function DiscoverClient({ defaultLatitude, defaultLongitude, defaultRadiusKm, available }: DiscoverClientProps) {
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState(defaultRadiusKm);
  const [minRate, setMinRate] = useState<number | undefined>();
  const [maxRate, setMaxRate] = useState<number | undefined>();
  const [verification, setVerification] = useState<"any" | "verified">("any");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("distance");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    defaultLatitude != null && defaultLongitude != null
      ? { latitude: defaultLatitude, longitude: defaultLongitude }
      : null,
  );
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());

  const queryClient = useQueryClient();

  const queryKey = useMemo(
    () => [
      "discover",
      coords?.latitude,
      coords?.longitude,
      radius,
      query,
      minRate ?? "",
      maxRate ?? "",
      verification,
      selectedServices.join("|"),
      sortBy,
    ],
    [coords, radius, query, minRate, maxRate, verification, selectedServices, sortBy],
  );

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        latitude: String(coords?.latitude ?? 0),
        longitude: String(coords?.longitude ?? 0),
        radius: String(radius),
        sort: sortBy,
      });
      if (query) params.set("q", query);
      if (minRate != null) params.set("minRate", String(minRate));
      if (maxRate != null) params.set("maxRate", String(maxRate));
      if (verification === "verified") params.set("verification", "verified");
      if (selectedServices.length) params.set("services", selectedServices.join(","));

      const res = await fetch(`/api/photographers/search?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load photographers");
      return res.json() as Promise<{ results: PhotographerResult[] }>;
    },
    enabled: Boolean(coords),
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    if (data?.results) {
      queueMicrotask(() => {
        setShortlistedIds(new Set(data.results.filter((item) => item.followed).map((item) => item.id)));
      });
    }
  }, [data?.results]);

  const shortlistMutation = useMutation({
    mutationFn: async ({ photographerId, action }: { photographerId: string; action: "follow" | "unfollow" }) => {
      const res = await fetch("/api/photographers/follow", {
        method: action === "follow" ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photographerId }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message ?? "Unable to update shortlist");
      }
      return photographerId;
    },
    onSuccess: (photographerId, vars) => {
      setShortlistedIds((prev) => {
        const next = new Set(prev);
        if (vars.action === "follow") {
          next.add(photographerId);
        } else {
          next.delete(photographerId);
        }
        return next;
      });
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const radiusDescriptor = useMemo(() => {
    if (radius <= 15) return "Hyperlocal creators within a short commute.";
    if (radius <= 40) return "Covers the entire city and neighboring suburbs.";
    if (radius <= 80) return "Optimized for destination shoots and offsites.";
    return "Pulling from the best across the region.";
  }, [radius]);

  const results = data?.results ?? [];
  const shortlistCount = shortlistedIds.size;

  function toggleService(tag: string) {
    setSelectedServices((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));
  }

  function clearFilters() {
    setMinRate(undefined);
    setMaxRate(undefined);
    setVerification("any");
    setSelectedServices([]);
    setSortBy("distance");
  }

  return (
    <div className="space-y-8 rounded-4xl border border-white/10 bg-white/5 p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-white">Discover nearby photographers</h1>
          <p className="text-sm text-slate-300">
            Fine-tune your filters to surface creators who match your brief, budget, and timeline.
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
                  () => alert("Enable location access to personalise search."),
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

      <div className="grid gap-6 lg:grid-cols-[0.95fr_2fr]">
        <aside className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">Filters</h2>
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-brand-200 hover:text-brand-100"
            >
              Clear
            </button>
          </div>

          <div className="grid gap-3 text-sm text-slate-200">
            <label className="flex flex-col gap-2">
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
            <label className="flex flex-col gap-2">
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
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-200">Discovery radius</h3>
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

          <div className="grid gap-3 text-sm text-slate-200">
            <label className="flex flex-col gap-2">
              <span className="font-medium text-white">Minimum rate (₹)</span>
              <input
                type="number"
                min={0}
                value={minRate ?? ""}
                onChange={(event) => setMinRate(event.target.value ? Number(event.target.value) : undefined)}
                className="input"
                placeholder="Optional"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-medium text-white">Maximum rate (₹)</span>
              <input
                type="number"
                min={0}
                value={maxRate ?? ""}
                onChange={(event) => setMaxRate(event.target.value ? Number(event.target.value) : undefined)}
                className="input"
                placeholder="Optional"
              />
            </label>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-200">Services</h3>
            <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-brand-200">
              {SERVICE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleService(tag)}
                  className={clsx(
                    "rounded-full border px-3 py-1 transition",
                    selectedServices.includes(tag)
                      ? "border-brand-400/70 bg-brand-500/20 text-white"
                      : "border-brand-400/30 text-brand-200 hover:border-brand-300/60 hover:text-brand-100",
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={verification === "verified"}
              onChange={(event) => setVerification(event.target.checked ? "verified" : "any")}
              className="h-4 w-4 accent-brand-400"
            />
            Verified creators only
          </label>
        </aside>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-300">
                {coords
                  ? `Showing ${results.length} creator${results.length === 1 ? "" : "s"} within ${radius} km`
                  : "Enable location or enter coordinates to start discovering."}
              </p>
              {shortlistCount ? (
                <p className="text-xs text-brand-200">{shortlistCount} shortlisted creator(s)</p>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="sort" className="text-xs uppercase tracking-wide text-slate-400">
                Sort by
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="rounded-full border border-white/15 bg-midnight-900 px-3 py-2 text-sm text-white"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
          ) : results.length ? (
            <div className="grid gap-5 md:grid-cols-2">
              {results.map((item) => {
                const hero = item.portfolioItems.at(0);
                return (
                  <article
                    key={item.id}
                    className="flex flex-col gap-4 overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition hover:border-brand-300/60"
                  >
                    {hero ? (
                      <div className="relative h-40 w-full overflow-hidden border-b border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={hero.mediaUrl} alt={hero.title} className="h-full w-full object-cover" />
                      </div>
                    ) : null}
                    <div className="flex flex-col gap-3 p-5 text-sm text-slate-300">
                      <div className="flex items-start justify-between gap-3">
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
                            {formatCurrency(item.hourlyRate)}/hr
                          </span>
                        ) : null}
                        {item.fullDayRate ? (
                          <span className="rounded-full border border-white/10 px-3 py-1">
                            Full day {formatCurrency(item.fullDayRate)}
                          </span>
                        ) : null}
                        <span className="rounded-full border border-white/10 px-3 py-1">
                          {item.averageRating
                            ? `${item.averageRating.toFixed(1)}★ (${item.reviews})`
                            : "New on Momentrix"}
                        </span>
                        <span
                          className={clsx(
                            "rounded-full border px-3 py-1 text-xs uppercase tracking-wide",
                            item.verificationStatus === "APPROVED"
                              ? "border-emerald-400/60 text-emerald-200"
                              : "border-amber-400/60 text-amber-200",
                          )}
                        >
                          {item.verificationStatus.toLowerCase()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {item.services && item.services.length
                          ? item.services.slice(0, 4).join(" • ")
                          : "Ask about specific services and deliverables."}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-brand-200">
                        {item.tags?.slice(0, 6).map((tag) => (
                          <span key={tag} className="rounded-full border border-brand-400/40 px-3 py-1">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      {item.nextAvailability ? (
                        <p className="text-xs text-slate-400">
                          Next availability: {formatAvailability(item.nextAvailability)}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                        {item.phone ? <span>📞 {item.phone}</span> : null}
                        <span>✉️ {item.email}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            shortlistMutation.mutate({
                              photographerId: item.id,
                              action: shortlistedIds.has(item.id) ? "unfollow" : "follow",
                            })
                          }
                          className={clsx(
                            "rounded-full px-4 py-2 text-xs font-semibold transition",
                            shortlistedIds.has(item.id)
                              ? "border border-emerald-400/70 bg-emerald-500/10 text-emerald-100 hover:border-emerald-300"
                              : "border border-white/15 text-white hover:border-brand-300/60 hover:text-brand-100",
                          )}
                          disabled={shortlistMutation.isPending}
                        >
                          {shortlistedIds.has(item.id) ? "Shortlisted" : "Shortlist"}
                        </button>
                        <a
                          href={`/photographers/${item.id}`}
                          className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                        >
                          View profile
                        </a>
                        <a
                          href={`mailto:${item.email}`}
                          className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                        >
                          Email
                        </a>
                        {item.phone ? (
                          <a
                            href={`tel:${item.phone.replace(/[^+0-9]/g, "")}`}
                            className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                          >
                            Call
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatAvailability(dateIso: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(new Date(dateIso));
  } catch {
    return "Soon";
  }
}

