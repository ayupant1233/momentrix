"use client";

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
  const hasNearby = nearby.length > 0;

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-6 py-16 text-slate-100">
      <div className="mb-10 flex flex-col gap-4">
        <Link href="/bookings/new" className="text-sm text-brand-200">
          ← Edit booking brief
        </Link>
        <div className="glass space-y-4 rounded-4xl p-8">
          <h1 className="text-3xl font-semibold text-white">Recommended photographers</h1>
          <p className="text-sm text-slate-300">
            We analysed your brief and surfaced photographers who can travel to {bookingRequest.location ?? "your venue"}.
            Pick one to send the project request instantly.
          </p>
          <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            <div>
              <span className="text-xs uppercase tracking-wide text-slate-500">Event</span>
              <p className="text-white">{bookingRequest.eventName ?? "Untitled project"}</p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wide text-slate-500">Shoot type</span>
              <p className="text-white">{bookingRequest.eventType ?? "Not specified"}</p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wide text-slate-500">Location</span>
              <p className="text-white">{bookingRequest.location ?? "–"}</p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wide text-slate-500">Schedule</span>
              <p className="text-white">
                {bookingRequest.startTime
                  ? `${new Date(bookingRequest.startTime).toLocaleString()}`
                  : "Start TBD"}
              </p>
            </div>
          </div>
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
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{allResults.length} creators scanned</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {(hasNearby ? nearby : allResults.slice(0, 12)).map((photographer) => (
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
          ))}
        </div>

        {!hasNearby && allResults.length === 0 ? (
          <div className="rounded-4xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-slate-300">
            No photographers are available yet. Our concierge team will reach out once someone matches your brief.
          </div>
        ) : null}
      </section>
    </div>
  );
}
