"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { useMutation } from "@tanstack/react-query";

type ShortlistedPhotographer = {
  id: string;
  userId: string;
  name: string;
  headline: string | null;
  city: string | null;
  verificationStatus: string;
  hourlyRate: number | null;
  halfDayRate: number | null;
  fullDayRate: number | null;
  currency: string;
  responseTimeHrs: number | null;
  travelRadiusKm: number;
  services: string[];
  tags: string[];
  email: string | null;
  phone: string | null;
  averageRating: number | null;
  reviewCount: number;
  followedAt: string | null;
  nextAvailabilityStart: string | null;
  nextAvailabilityEnd: string | null;
  socialAccounts: {
    provider: string;
    handle: string;
    followerCount: number;
    profileUrl: string | null;
    verifiedAt: string | null;
  }[];
  portfolio: {
    id: string;
    title: string | null;
    mediaUrl: string;
  }[];
};

type ShortlistClientProps = {
  initialPhotographers: ShortlistedPhotographer[];
};

type SortOption = "recent" | "rating" | "rateLow" | "rateHigh" | "availability";

type BannerMessage = {
  type: "success" | "error";
  text: string;
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Recently added" },
  { value: "rating", label: "Highest rating" },
  { value: "rateLow", label: "Lowest price" },
  { value: "rateHigh", label: "Highest price" },
  { value: "availability", label: "Soonest availability" },
];

function formatCurrency(amount: number | null, currency: string) {
  if (amount == null) return null;
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-IN")}`;
  }
}

function formatAvailability(startIso: string | null, endIso: string | null) {
  if (!startIso) return null;
  try {
    const startDate = new Date(startIso);
    const endDate = endIso ? new Date(endIso) : null;
    const dateFormatter = new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const timeFormatter = new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });

    const dayLabel = dateFormatter.format(startDate);
    const startTime = timeFormatter.format(startDate);
    const endTime = endDate ? timeFormatter.format(endDate) : null;

    return endTime ? `${dayLabel} • ${startTime} – ${endTime}` : `${dayLabel} • ${startTime}`;
  } catch {
    return null;
  }
}

function verificationBadge(status: string) {
  if (status === "VERIFIED") {
    return {
      label: "Fully verified",
      tone: "text-emerald-300 bg-emerald-500/10 border-emerald-400/30",
    };
  }
  if (status === "PARTIAL") {
    return {
      label: "Partially verified",
      tone: "text-amber-200 bg-amber-500/10 border-amber-400/30",
    };
  }
  return {
    label: "Not fully verified",
    tone: "text-slate-200 bg-white/5 border-white/15",
  };
}

function followerSummary(socialAccounts: ShortlistedPhotographer["socialAccounts"]) {
  if (!socialAccounts.length) return "No social accounts connected";
  const total = socialAccounts.reduce((sum, account) => sum + account.followerCount, 0);
  const providers = socialAccounts.map((account) => account.provider).join(" • ");
  return `${total.toLocaleString("en-IN")} reach · ${providers}`;
}

export function ShortlistClient({ initialPhotographers }: ShortlistClientProps) {
  const [photographers, setPhotographers] = useState<ShortlistedPhotographer[]>(initialPhotographers);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [comparison, setComparison] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<BannerMessage | null>(null);

  useEffect(() => {
    setPhotographers(initialPhotographers);
  }, [initialPhotographers]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem("momentrix-shortlist-notes");
      if (stored) {
        setNotes(JSON.parse(stored));
      }
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("momentrix-shortlist-notes", JSON.stringify(notes));
    } catch {
      // ignore write failures
    }
  }, [notes]);

  const removeMutation = useMutation({
    mutationFn: async (photographerId: string) => {
      const res = await fetch("/api/photographers/follow", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photographerId }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message ?? "Unable to remove photographer");
      }
      return photographerId;
    },
    onSuccess: (photographerId) => {
      setPhotographers((prev) => prev.filter((item) => item.id !== photographerId));
      setComparison((prev) => prev.filter((id) => id !== photographerId));
      setNotes((prev) => {
        if (!prev[photographerId]) return prev;
        const next = { ...prev };
        delete next[photographerId];
        return next;
      });
      setBanner({
        type: "success",
        text: "Photographer removed from shortlist.",
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Something went wrong";
      setBanner({ type: "error", text: message });
    },
  });

  useEffect(() => {
    if (!banner) return;
    const timer = window.setTimeout(() => setBanner(null), 4000);
    return () => window.clearTimeout(timer);
  }, [banner]);

  const filteredPhotographers = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matches = (photographer: ShortlistedPhotographer) => {
      if (!term) return true;
      const haystack = [
        photographer.name,
        photographer.headline,
        photographer.city,
        ...photographer.tags,
        ...photographer.services,
      ]
        .filter(Boolean)
        .map((value) => value!.toString().toLowerCase());
      return haystack.some((value) => value.includes(term));
    };

    const sorted = [...photographers].filter(matches);

    const toMillis = (iso: string | null) => (iso ? new Date(iso).getTime() : 0);
    const toRate = (amount: number | null) => (amount == null ? Number.POSITIVE_INFINITY : amount);
    const toRating = (rating: number | null) => (rating == null ? -1 : rating);

    sorted.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return toRating(b.averageRating) - toRating(a.averageRating);
        case "rateLow":
          return toRate(a.hourlyRate) - toRate(b.hourlyRate);
        case "rateHigh":
          return toRate(b.hourlyRate) - toRate(a.hourlyRate);
        case "availability":
          return toMillis(a.nextAvailabilityStart) - toMillis(b.nextAvailabilityStart);
        case "recent":
        default:
          return toMillis(b.followedAt) - toMillis(a.followedAt);
      }
    });

    return sorted;
  }, [photographers, search, sortBy]);

  const shortlistCount = photographers.length;
  const fullyVerifiedCount = photographers.filter((item) => item.verificationStatus === "VERIFIED").length;
  const upcomingAvailabilityCount = photographers.filter((item) => item.nextAvailabilityStart != null).length;
  const totalSocialReach = photographers.reduce((sum, item) => {
    return sum + item.socialAccounts.reduce((inner, account) => inner + account.followerCount, 0);
  }, 0);

  const comparisonEntries = comparison
    .map((id) => filteredPhotographers.find((photographer) => photographer.id === id))
    .filter((entry): entry is ShortlistedPhotographer => Boolean(entry));

  function toggleComparison(photographerId: string) {
    setComparison((prev) => {
      if (prev.includes(photographerId)) {
        return prev.filter((id) => id !== photographerId);
      }
      if (prev.length >= 4) {
        setBanner({
          type: "error",
          text: "You can compare up to four photographers at once.",
        });
        return prev;
      }
      return [...prev, photographerId];
    });
  }

  function updateNote(photographerId: string, value: string) {
    setNotes((prev) => ({ ...prev, [photographerId]: value }));
  }

  return (
    <div className="space-y-10">
      {banner ? (
        <div
          className={clsx(
            "rounded-3xl border px-4 py-3 text-sm font-medium shadow-soft-glow sm:px-6",
            banner.type === "success"
              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
              : "border-rose-400/40 bg-rose-500/10 text-rose-100",
          )}
        >
          {banner.text}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Shortlisted creators" value={shortlistCount.toString()} helper="Keep under 10 for focus" />
        <MetricCard label="Fully verified" value={fullyVerifiedCount.toString()} helper="Email + social proof complete" />
        <MetricCard
          label="Upcoming availability"
          value={upcomingAvailabilityCount.toString()}
          helper="Has open slot in calendar"
        />
        <MetricCard
          label="Combined social reach"
          value={totalSocialReach.toLocaleString("en-IN")}
          helper="Across connected profiles"
        />
      </section>

      <section className="rounded-4xl border border-white/10 bg-white/5 p-6 shadow-soft-glow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Manage your shortlist</h2>
            <p className="text-sm text-slate-300">
              Add personal notes, review verification status, and progress your preferred creators.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, style, or city"
              className="w-full rounded-full border border-white/15 bg-midnight-900/60 px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-400/40 sm:w-64"
            />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="w-full rounded-full border border-white/15 bg-midnight-900/60 px-4 py-2 text-sm text-white focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-400/40 sm:w-auto"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2 rounded-full border border-white/10 bg-midnight-950/60 p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={clsx(
                  "rounded-full px-3 py-1 text-xs font-medium transition",
                  viewMode === "grid" ? "bg-white text-midnight-900 shadow-soft-glow" : "text-slate-300",
                )}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={clsx(
                  "rounded-full px-3 py-1 text-xs font-medium transition",
                  viewMode === "list" ? "bg-white text-midnight-900 shadow-soft-glow" : "text-slate-300",
                )}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {filteredPhotographers.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center">
            <p className="text-lg font-semibold text-white">No matches found</p>
            <p className="mt-2 text-sm text-slate-300">
              Try updating your filters or head back to discovery to add more photographers.
            </p>
            <Link
              href="/discover"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-soft-glow transition hover:from-brand-300 hover:to-brand-500"
            >
              Discover more creators
            </Link>
          </div>
        ) : (
          <div
            className={clsx(
              "mt-8",
              viewMode === "grid"
                ? "grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
                : "flex flex-col divide-y divide-white/10 border border-white/10 rounded-3xl overflow-hidden",
            )}
          >
            {filteredPhotographers.map((photographer) => (
              <ShortlistCard
                key={photographer.id}
                photographer={photographer}
                comparisonSelected={comparison.includes(photographer.id)}
                onToggleCompare={() => toggleComparison(photographer.id)}
                onRemove={() => removeMutation.mutate(photographer.id)}
                onNoteChange={(value) => updateNote(photographer.id, value)}
                noteValue={notes[photographer.id] ?? ""}
                viewMode={viewMode}
                removing={removeMutation.isPending}
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-4xl border border-white/10 bg-white/5 p-6 shadow-soft-glow">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Comparison workspace</h2>
            <p className="text-sm text-slate-300">
              Select up to four photographers to compare pricing, availability, and social proof.
            </p>
          </div>
          {comparison.length ? (
            <button
              type="button"
              onClick={() => setComparison([])}
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-brand-300/60 hover:text-brand-100"
            >
              Clear selection
            </button>
          ) : null}
        </div>

        {comparisonEntries.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-white/15 bg-midnight-900/60 p-6 text-sm text-slate-300">
            Add creators from your shortlist to compare them side-by-side.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">Creator</th>
                  <th className="px-4 py-3">Verification</th>
                  <th className="px-4 py-3">Rates</th>
                  <th className="px-4 py-3">Response & Availability</th>
                  <th className="px-4 py-3">Social proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {comparisonEntries.map((photographer) => {
                  const badge = verificationBadge(photographer.verificationStatus);
                  const hourly = formatCurrency(photographer.hourlyRate, photographer.currency);
                  const fullDay = formatCurrency(photographer.fullDayRate, photographer.currency);
                  const availability = formatAvailability(
                    photographer.nextAvailabilityStart,
                    photographer.nextAvailabilityEnd,
                  );
                  return (
                    <tr key={photographer.id} className="align-top">
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-white">{photographer.name}</p>
                          <p className="text-xs text-slate-400">
                            {photographer.city ?? "Location TBD"} • travels {photographer.travelRadiusKm} km
                          </p>
                          <div className="flex flex-wrap gap-2 pt-2">
                            {photographer.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="rounded-full bg-white/10 px-2 py-1 text-2xs uppercase text-brand-200">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={clsx("inline-flex items-center gap-1 rounded-full border px-3 py-1 text-2xs", badge.tone)}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-200">
                        <div className="space-y-1">
                          <p>Hourly: {hourly ?? "—"}</p>
                          <p>Half-day: {formatCurrency(photographer.halfDayRate, photographer.currency) ?? "—"}</p>
                          <p>Full-day: {fullDay ?? "—"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-200">
                        <div className="space-y-1">
                          <p>
                            Avg. response:{" "}
                            {photographer.responseTimeHrs != null ? `${photographer.responseTimeHrs} hrs` : "TBD"}
                          </p>
                          <p>Next availability: {availability ?? "Share brief to confirm"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-slate-200">{followerSummary(photographer.socialAccounts)}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {photographer.socialAccounts.map((account) => (
                            <a
                              key={`${account.provider}-${account.handle}`}
                              href={account.profileUrl ?? "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-full border border-white/15 px-3 py-1 text-2xs text-slate-200 transition hover:border-brand-300/60 hover:text-brand-100"
                            >
                              {account.provider}
                              {account.handle ? ` · @${account.handle}` : ""}
                            </a>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-4xl border border-white/10 bg-gradient-to-r from-brand-500/20 via-purple-500/20 to-sky-500/20 p-8 shadow-soft-glow">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Move your shortlist towards a booking</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-200">
              Launch the booking brief wizard to firm up requirements, send consolidated messages, and share timelines
              with your shortlisted creators.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/bookings/new"
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-midnight-900 shadow-soft-glow transition hover:bg-brand-100"
            >
              Create a booking brief
            </Link>
            <Link
              href="/discover"
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
            >
              Discover more
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-soft-glow">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{helper}</p>
    </div>
  );
}

function ShortlistCard({
  photographer,
  comparisonSelected,
  onToggleCompare,
  onRemove,
  onNoteChange,
  noteValue,
  viewMode,
  removing,
}: {
  photographer: ShortlistedPhotographer;
  comparisonSelected: boolean;
  onToggleCompare: () => void;
  onRemove: () => void;
  onNoteChange: (value: string) => void;
  noteValue: string;
  viewMode: "grid" | "list";
  removing: boolean;
}) {
  const badge = verificationBadge(photographer.verificationStatus);
  const hero = photographer.portfolio.at(0);
  const hourlyRate = formatCurrency(photographer.hourlyRate, photographer.currency);
  const followDate = photographer.followedAt
    ? new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric" }).format(new Date(photographer.followedAt))
    : null;
  const availability = formatAvailability(photographer.nextAvailabilityStart, photographer.nextAvailabilityEnd);

  return (
    <article
      className={clsx(
        "relative flex flex-col gap-4 bg-white/5 p-5 transition hover:border-brand-400/40 hover:shadow-soft-glow",
        viewMode === "grid" ? "rounded-3xl border border-white/10" : "border-0 sm:flex-row sm:items-start",
      )}
    >
      {hero ? (
        <div
          className={clsx(
            "overflow-hidden rounded-2xl border border-white/10 bg-midnight-900/40",
            viewMode === "grid" ? "h-36" : "h-32 w-full sm:w-48",
          )}
        >
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${hero.mediaUrl})` }}
            aria-label={hero.title ?? "Portfolio hero"}
          />
        </div>
      ) : null}

      <div className="flex-1 space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-white">{photographer.name}</h3>
              <p className="text-sm text-slate-300">{photographer.headline ?? "Add a headline"}</p>
            </div>
            <span className={clsx("inline-flex items-center gap-1 rounded-full border px-3 py-1 text-2xs", badge.tone)}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {badge.label}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {photographer.city ?? "Location TBD"} • travels {photographer.travelRadiusKm} km
            {photographer.responseTimeHrs ? ` • responds in ~${photographer.responseTimeHrs} hrs` : ""}
            {followDate ? ` • saved ${followDate}` : ""}
          </p>
          {photographer.averageRating != null ? (
            <p className="text-xs text-brand-200">
              {photographer.averageRating.toFixed(1)} ⭐ • {photographer.reviewCount} review
              {photographer.reviewCount === 1 ? "" : "s"}
            </p>
          ) : (
            <p className="text-xs text-slate-400">No reviews captured yet</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {photographer.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-2xs uppercase tracking-wide text-brand-200">
              {tag}
            </span>
          ))}
          {photographer.tags.length === 0 ? (
            <span className="text-2xs uppercase tracking-wide text-slate-500">Tag preferences pending</span>
          ) : null}
        </div>

        <div className="grid gap-3 text-xs text-slate-200 sm:grid-cols-2">
          <div className="space-y-1 rounded-2xl border border-white/10 bg-midnight-900/60 p-3">
            <p className="font-semibold text-white">Rates</p>
            <p>Hourly: {hourlyRate ?? "—"}</p>
            <p>Half-day: {formatCurrency(photographer.halfDayRate, photographer.currency) ?? "—"}</p>
            <p>Full-day: {formatCurrency(photographer.fullDayRate, photographer.currency) ?? "—"}</p>
          </div>
          <div className="space-y-1 rounded-2xl border border-white/10 bg-midnight-900/60 p-3">
            <p className="font-semibold text-white">Next availability</p>
            <p>{availability ?? "Share a brief to confirm slots"}</p>
            <p>{followerSummary(photographer.socialAccounts)}</p>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor={`note-${photographer.id}`} className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Private notes
          </label>
          <textarea
            id={`note-${photographer.id}`}
            value={noteValue}
            onChange={(event) => onNoteChange(event.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-white/10 bg-midnight-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
            placeholder="Add talking points, preferred deliverables, or negotiation notes."
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
          <button
            type="button"
            onClick={onToggleCompare}
            className={clsx(
              "inline-flex items-center justify-center rounded-full border px-4 py-2 transition",
              comparisonSelected
                ? "border-brand-400 bg-brand-500/20 text-brand-50"
                : "border-white/15 text-slate-200 hover:border-brand-400/60 hover:text-brand-100",
            )}
          >
            {comparisonSelected ? "In comparison" : "Compare"}
          </button>
          <Link
            href={`/photographers/${photographer.id}`}
            className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-slate-200 transition hover:border-brand-400/60 hover:text-brand-100"
          >
            View profile
          </Link>
          {photographer.email ? (
            <a
              href={`mailto:${photographer.email}`}
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-slate-200 transition hover:border-brand-400/60 hover:text-brand-100"
            >
              Email
            </a>
          ) : null}
          {photographer.phone ? (
            <a
              href={`tel:${photographer.phone}`}
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-slate-200 transition hover:border-brand-400/60 hover:text-brand-100"
            >
              Call
            </a>
          ) : null}
          <button
            type="button"
            onClick={onRemove}
            disabled={removing}
            className="inline-flex items-center justify-center rounded-full border border-rose-400/40 px-4 py-2 text-rose-100 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {removing ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </article>
  );
}


