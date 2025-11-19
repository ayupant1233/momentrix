"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ConfirmBookingButton from "./confirm-booking-button";

type BookingRequest = {
  id: string;
  eventName: string | null;
  eventType: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  startTime: string | null;
  endTime: string | null;
  hoursRequested: number | null;
  notes: string | null;
  deliverables: string | null;
  initialMessage: string | null;
  createdAt: string;
};

type Recommendation = {
  id: string;
  profileId: string;
  name: string;
  headline: string;
  city: string;
  hourlyRate: number | null;
  rating: number | null;
  reviews: number;
  phone: string | null;
  email: string | null;
  distance: number;
  travelRadiusKm: number;
  followed: boolean;
};

type RecommendationsClientProps = {
  bookingRequest: BookingRequest;
  nearby: Recommendation[];
  allResults: Recommendation[];
};

function formatRange(value: number | null, prefix = "₹") {
  if (value == null) return "–";
  return `${prefix}${value.toLocaleString("en-IN")}`;
}

export default function RecommendationsClient({ bookingRequest, nearby, allResults }: RecommendationsClientProps) {
  const [comparison, setComparison] = useState<string[]>([]);

  const hasNearby = nearby.length > 0;
  const comparisonProfiles = useMemo(
    () => allResults.filter((profile) => comparison.includes(profile.profileId)),
    [allResults, comparison],
  );
  const otherOptions = useMemo(() => {
    const picked = new Set(comparison);
    return allResults.filter((profile) => !picked.has(profile.profileId));
  }, [allResults, comparison]);

  function toggleComparison(profileId: string) {
    setComparison((prev) => {
      if (prev.includes(profileId)) {
        return prev.filter((id) => id !== profileId);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), profileId];
      }
      return [...prev, profileId];
    });
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-6 py-16 text-slate-100">
      <div className="mb-10 flex flex-col gap-4">
        <Link href="/bookings/new" className="text-sm text-brand-200">
          ← Edit booking brief
        </Link>
        <div className="glass space-y-6 rounded-4xl p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-white">Recommended photographers</h1>
              <p className="text-sm text-slate-300">
                We analysed your brief and surfaced photographers who can travel to{" "}
                {bookingRequest.location ?? "your venue"}. Pick one to send the project request instantly or shortlist
                a few to compare.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
              <p className="uppercase tracking-[0.2em] text-slate-500">Brief summary</p>
              <div className="mt-2 space-y-1 text-white">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">Event</span>
                  <span>{bookingRequest.eventName ?? "Untitled project"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">Type</span>
                  <span>{bookingRequest.eventType ?? "Not specified"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">Location</span>
                  <span>{bookingRequest.location ?? "–"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">Schedule</span>
                  <span>
                    {bookingRequest.startTime
                      ? new Date(bookingRequest.startTime).toLocaleString()
                      : "Start TBD"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {allResults.length} creators scanned • shortlist up to 3 for quick comparison
          </p>
        </div>
      </div>

      <section className="space-y-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              {hasNearby ? "Matches near your venue" : "Top photographers to consider"}
            </h2>
            <p className="text-sm text-slate-300">
              {hasNearby
                ? "Sorted by distance and profile quality."
                : "No one matched your radius exactly, so here are high-performing photographers across the platform."}
            </p>
          </div>
          <div className="flex flex-col gap-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:gap-6">
            <span>{comparison.length} in comparison</span>
            {comparison.length ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-brand-200 hover:text-brand-100"
                onClick={() => setComparison([])}
              >
                Clear comparison
              </button>
            ) : null}
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {(hasNearby ? nearby : allResults.slice(0, 12)).map((photographer) => {
            const isSelected = comparison.includes(photographer.profileId);
            return (
            <article
              key={photographer.profileId}
              className="flex flex-col gap-4 rounded-4xl border border-white/10 bg-white/5 p-6 transition hover:border-brand-300/60"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{photographer.name}</h3>
                  <p className="text-xs uppercase tracking-wide text-brand-200">
                    {photographer.headline} • {photographer.city}
                  </p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                  {photographer.distance.toFixed(1)} km away
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                <span className="rounded-full border border-white/10 px-3 py-1">
                  {formatRange(photographer.hourlyRate)} / hr
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1">
                  {photographer.rating ? `${photographer.rating.toFixed(1)}★ (${photographer.reviews})` : "New on Momentrix"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => toggleComparison(photographer.profileId)}
                className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  isSelected
                    ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-100 hover:border-emerald-300"
                    : comparison.length >= 3
                      ? "border-white/10 text-slate-500"
                      : "border-white/15 text-white hover:border-brand-300/60 hover:text-brand-100"
                }`}
                disabled={!isSelected && comparison.length >= 3}
              >
                {isSelected ? "In comparison" : comparison.length >= 3 ? "Comparison full" : "Compare"}
              </button>

              <div className="flex flex-wrap gap-3 text-xs text-slate-300">
                {photographer.phone ? (
                  <a
                    href={`tel:${photographer.phone.replace(/[^+0-9]/g, "")}`}
                    className="rounded-full border border-white/15 px-3 py-1 font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                  >
                    Call
                  </a>
                ) : null}
                {photographer.email ? (
                  <a
                    href={`mailto:${photographer.email}`}
                    className="rounded-full border border-white/15 px-3 py-1 font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                  >
                    Email
                  </a>
                ) : null}
                <Link
                  href={`/photographers/${photographer.profileId}`}
                  className="rounded-full border border-white/15 px-3 py-1 font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                >
                  View profile
                </Link>
              </div>

              <ConfirmBookingButton
                bookingRequestId={bookingRequest.id}
                photographerId={photographer.id}
              />
            </article>
          );
          })}
        </div>

        {!hasNearby && allResults.length === 0 ? (
          <div className="rounded-4xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-slate-300">
            No photographers are available yet. Our concierge team will reach out once someone matches your brief.
          </div>
        ) : null}
      </section>

      {comparisonProfiles.length ? (
        <section className="mt-12 space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold text-white">Compare side by side</h2>
            <p className="text-sm text-slate-300">
              Pricing, distance, ratings, and contact details at a glance. Remove folks as you narrow in on the right fit.
            </p>
          </div>
          <div className="overflow-x-auto rounded-4xl border border-white/10 bg-white/5">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-white/10 text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left">Photographer</th>
                  <th className="px-4 py-3 text-left">Distance</th>
                  <th className="px-4 py-3 text-left">Rate</th>
                  <th className="px-4 py-3 text-left">Rating</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {comparisonProfiles.map((profile) => (
                  <tr key={profile.profileId} className="divide-x divide-white/10">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-white">{profile.name}</p>
                      <p className="text-xs uppercase tracking-wide text-brand-200">
                        {profile.headline} • {profile.city}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{profile.distance.toFixed(1)} km</td>
                    <td className="px-4 py-4 text-slate-300">{formatRange(profile.hourlyRate)}</td>
                    <td className="px-4 py-4 text-slate-300">
                      {profile.rating ? `${profile.rating.toFixed(1)}★ (${profile.reviews})` : "New on Momentrix"}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-300">
                      {profile.phone ? <div>📞 {profile.phone}</div> : null}
                      {profile.email ? <div>✉️ {profile.email}</div> : null}
                    </td>
                    <td className="px-4 py-4 space-y-2">
                      <ConfirmBookingButton
                        bookingRequestId={bookingRequest.id}
                        photographerId={profile.id}
                      />
                      <button
                        type="button"
                        className="block text-xs text-rose-200 hover:text-rose-100"
                        onClick={() => toggleComparison(profile.profileId)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {otherOptions.length ? (
        <section className="mt-12 space-y-6">
          <h2 className="text-2xl font-semibold text-white">Worth keeping on your radar</h2>
          <p className="text-sm text-slate-300">
            These photographers score high on response time and portfolio strength. Save them as backups or for future projects.
          </p>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {otherOptions.slice(0, 6).map((photographer) => (
              <article
                key={photographer.profileId}
                className="flex flex-col gap-3 rounded-4xl border border-white/10 bg-white/5 p-6"
              >
                <h3 className="text-lg font-semibold text-white">{photographer.name}</h3>
                <p className="text-xs uppercase tracking-wide text-brand-200">
                  {photographer.headline} • {photographer.city}
                </p>
                <p className="text-xs text-slate-300">
                  {formatRange(photographer.hourlyRate)} / hr •{" "}
                  {photographer.rating ? `${photographer.rating.toFixed(1)}★ (${photographer.reviews})` : "New on Momentrix"}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Link
                    href={`/photographers/${photographer.profileId}`}
                    className="rounded-full border border-white/15 px-3 py-1 font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                  >
                    View profile
                  </Link>
                  <button
                    type="button"
                    className="rounded-full border border-white/15 px-3 py-1 font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                    onClick={() => toggleComparison(photographer.profileId)}
                  >
                    {comparison.includes(photographer.profileId) ? "In comparison" : "Compare"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-12 grid gap-6 text-sm text-slate-300 md:grid-cols-2">
        <article className="rounded-4xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white">Need a curated shortlist?</h3>
          <p className="mt-2">
            Share any additional context (budget shifts, travel plans, styling changes) and the Momentrix concierge team will send a tailored shortlist within 24 hours.
          </p>
          <Link
            href="mailto:concierge@momentrix.in?subject=Shortlist%20help%20for%20booking"
            className="mt-4 inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
          >
            Email concierge
          </Link>
        </article>
        <article className="rounded-4xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white">Want to tweak your brief?</h3>
          <p className="mt-2">
            Jump back to the form, adjust location, add references, or update deliverables. Your recommendations will refresh instantly.
          </p>
          <Link
            href="/bookings/new"
            className="mt-4 inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
          >
            Edit brief
          </Link>
        </article>
      </section>
    </div>
  );
}
