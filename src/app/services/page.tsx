import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Services & Pricing | Momentrix",
  description:
    "Explore standard photography packages, add-ons, and day rates offered by verified Momentrix creators.",
};

const PACKAGE_LABELS: Record<string, string> = {
  hourlyRate: "Hourly coverage",
  halfDayRate: "Half-day experience (4 hrs)",
  fullDayRate: "Full-day experience (8 hrs)",
};

const DEFAULT_DELIVERABLES = [
  "All edited images in high-resolution",
  "Private online gallery for 60 days",
  "Standard colour grading",
];

export default async function ServicesPage() {
  const premiumCreators = await prisma.photographerProfile.findMany({
    take: 12,
    orderBy: [
      { verificationStatus: "desc" },
      { updatedAt: "desc" },
    ],
    select: {
      id: true,
      headline: true,
      city: true,
      currency: true,
      hourlyRate: true,
      halfDayRate: true,
      fullDayRate: true,
      travelRadiusKm: true,
      services: true,
      tags: true,
      verificationStatus: true,
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-6 py-16 text-slate-100">
      <header className="mb-12 space-y-3 text-center">
        <p className="chip mx-auto w-fit">Services & pricing</p>
        <h1 className="text-4xl font-semibold text-white">Transparent packages from trusted photographers</h1>
        <p className="mx-auto max-w-3xl text-sm text-slate-300">
          Each creator on Momentrix publishes their day rates and add-ons upfront. Compare options, customise your quote,
          and connect instantly when you are ready to book.
        </p>
      </header>

      <section className="mb-16 grid gap-6 rounded-4xl border border-white/10 bg-white/5 p-8 md:grid-cols-2">
        <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">What&apos;s included</h2>
          <ul className="space-y-2 text-sm text-slate-300">
            {DEFAULT_DELIVERABLES.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          <p className="text-xs text-slate-500">
            Want aerial shots, same-day edits, or live sharing? Add them while submitting your brief and we’ll factor it
            into the quote.
          </p>
        </article>
        <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">How pricing works</h2>
          <ol className="space-y-2 text-sm text-slate-300">
            <li>1. Choose a core package (hourly, half-day, or full-day).</li>
            <li>2. Layer add-ons like drone coverage or a second shooter.</li>
            <li>3. Share your brief—photographers respond with a final confirmation and availability.</li>
          </ol>
          <Link
            href="/bookings/new"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-soft-glow transition hover:from-brand-300 hover:to-brand-500"
          >
            Build your quote
          </Link>
        </article>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold text-white">Popular packages</h2>
          <Link href="/discover" className="text-sm text-brand-200">
            Browse all photographers →
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {premiumCreators.map((creator) => {
            const rates = [
              { key: "hourlyRate" as const, amount: creator.hourlyRate },
              { key: "halfDayRate" as const, amount: creator.halfDayRate },
              { key: "fullDayRate" as const, amount: creator.fullDayRate },
            ].filter((rate) => rate.amount);

            const services = Array.isArray(creator.services) ? (creator.services as string[]) : [];
            const tags = Array.isArray(creator.tags) ? (creator.tags as string[]) : [];

            return (
              <article key={creator.id} className="flex flex-col gap-4 rounded-4xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {creator.user?.name ?? creator.headline ?? "Momentrix photographer"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {creator.city ?? "Location TBD"} • travels {creator.travelRadiusKm} km
                    </p>
                  </div>
                  <span className="rounded-full border border-brand-400/40 px-3 py-1 text-[11px] uppercase tracking-wide text-brand-200">
                    {creator.verificationStatus.toLowerCase()}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-300">
                  {rates.length ? (
                    rates.map((rate) => (
                      <div
                        key={rate.key}
                        className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-3"
                      >
                        <span>{PACKAGE_LABELS[rate.key]}</span>
                        <span className="font-semibold text-white">
                          {formatCurrency(rate.amount ?? 0, creator.currency)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">Rates coming soon. Reach out for a custom quote.</p>
                  )}
                </div>

                {services.length ? (
                  <div className="space-y-2">
                    <h3 className="text-xs uppercase tracking-wide text-slate-400">Specialities</h3>
                    <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-brand-200">
                      {services.slice(0, 6).map((service) => (
                        <span key={service} className="rounded-full border border-brand-400/40 px-3 py-1">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {tags.length ? (
                  <div className="space-y-2">
                    <h3 className="text-xs uppercase tracking-wide text-slate-400">Signature styles</h3>
                    <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-300">
                      {tags.slice(0, 6).map((tag) => (
                        <span key={tag} className="rounded-full border border-white/10 px-3 py-1">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-auto flex flex-wrap gap-2 text-xs">
                  {creator.user?.phone ? (
                    <a
                      href={`tel:${creator.user.phone.replace(/[^+0-9]/g, "")}`}
                      className="rounded-full border border-white/15 px-3 py-1 font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                    >
                      Call
                    </a>
                  ) : null}
                  <a
                    href={`mailto:${creator.user?.email ?? ""}`}
                    className="rounded-full border border-white/15 px-3 py-1 font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                  >
                    Email
                  </a>
                  <Link
                    href={`/photographers/${creator.id}`}
                    className="rounded-full border border-white/15 px-3 py-1 font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                  >
                    View profile
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-16 space-y-4 rounded-4xl border border-white/10 bg-white/5 p-8 text-sm text-slate-300">
        <h2 className="text-lg font-semibold text-white">Need something bespoke?</h2>
        <p>
          Many photographers offer destination packages, multi-day events, and post-production services. Share your
          brief and our concierge team will help you shortlist the right talent.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-midnight-900 transition hover:bg-brand-100"
        >
          Talk to us on WhatsApp
        </Link>
      </section>
    </div>
  );
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

