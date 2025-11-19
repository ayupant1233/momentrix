import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardNav from "@/components/dashboard-nav";
import { BackLink } from "@/components/back-link";
import { format } from "date-fns";
import clsx from "clsx";

type PageProps = {
  params: Promise<{ profileId?: string }>;
};

export default async function PhotographerProfilePage({ params }: PageProps) {
  const { profileId } = await params;

  if (!profileId) {
    notFound();
  }

  const profile = await prisma.photographerProfile.findUnique({
    where: { id: profileId },
    include: {
      user: {
        select: { name: true, email: true, phone: true },
      },
      portfolioItems: {
        orderBy: { createdAt: "desc" },
        take: 24,
      },
      availability: {
        orderBy: { startTime: "asc" },
        take: 6,
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 12,
        include: {
          booking: {
            select: {
              eventName: true,
              location: true,
              eventType: true,
              startTime: true,
            },
          },
          client: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!profile) {
    notFound();
  }

  const services = Array.isArray(profile.services)
    ? profile.services.map((service) => String(service))
    : [];
  const tags = Array.isArray(profile.tags) ? profile.tags.map((tag) => String(tag)) : [];

  const averageRating =
    profile.reviews.length > 0
      ? profile.reviews.reduce((sum, review) => sum + review.rating, 0) / profile.reviews.length
      : null;

  return (
    <>
      <DashboardNav />
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-14 text-slate-100">
        <BackLink href="/discover" label="Back to discover" className="mb-4" />

        <header className="rounded-4xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <span className="chip w-fit">Momentrix photographer</span>
              <h1 className="text-4xl font-semibold text-white">
                {profile.user?.name ?? "Untitled Photographer"}
              </h1>
              <p className="max-w-xl text-sm text-slate-300">
                {profile.bio ??
                  "This photographer hasn’t added a bio yet. Encourage them to share their story to build trust faster."}
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                <span>{profile.city ?? "Location upcoming"}</span>
                <span>•</span>
                <span>Travels up to {profile.travelRadiusKm} km</span>
                <span>•</span>
                <span>
                  {profile.responseTimeHrs ? `Responds in ~${profile.responseTimeHrs} hrs` : "Responsive in under a day"}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-brand-200">
                {verificationBadge(profile.verificationStatus)}
                {averageRating ? <span>{averageRating.toFixed(1)}★ ({profile.reviews.length} reviews)</span> : null}
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
              <p className="text-xs uppercase tracking-wide text-slate-400">Direct contact</p>
              {profile.user?.phone ? <span>📞 {profile.user.phone}</span> : <span>Phone not shared yet.</span>}
              {profile.user?.email ? <span>✉️ {profile.user.email}</span> : <span>Email not shared yet.</span>}
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.user?.phone ? (
                  <a
                    href={`tel:${profile.user.phone.replace(/[^+0-9]/g, "")}`}
                    className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                  >
                    Call
                  </a>
                ) : null}
                {profile.user?.email ? (
                  <a
                    href={`mailto:${profile.user.email}`}
                    className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                  >
                    Email
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 text-xs text-brand-200 sm:grid-cols-2">
            {profile.hourlyRate ? (
              <span className="rounded-full border border-brand-400/40 px-3 py-1">
                Hourly: {formatCurrency(profile.hourlyRate)}
              </span>
            ) : null}
            {profile.halfDayRate ? (
              <span className="rounded-full border border-brand-400/40 px-3 py-1">
                Half-day: {formatCurrency(profile.halfDayRate)}
              </span>
            ) : null}
            {profile.fullDayRate ? (
              <span className="rounded-full border border-brand-400/40 px-3 py-1">
                Full-day: {formatCurrency(profile.fullDayRate)}
              </span>
            ) : null}
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="rounded-4xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold text-white">Signature services</h2>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-brand-200">
                {services.length ? (
                  services.map((service) => (
                    <span key={service} className="rounded-full border border-brand-400/40 px-3 py-1">
                      {service}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">Services will appear here once this creator updates their profile.</p>
                )}
              </div>
              {tags.length ? (
                <>
                  <h3 className="mt-6 text-xs uppercase tracking-wide text-slate-400">Styles</h3>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-brand-200">
                    {tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-brand-400/40 px-3 py-1">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            <div className="space-y-4 rounded-4xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Portfolio</h2>
                <span className="text-xs uppercase tracking-wide text-slate-400">{profile.portfolioItems.length} items</span>
              </div>
              {profile.portfolioItems.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {profile.portfolioItems.map((item) => (
                    <article
                      key={item.id}
                      className="flex flex-col gap-2 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300"
                    >
                      {item.mediaUrl ? (
                        <div className="relative h-36 w-full overflow-hidden rounded-2xl border border-white/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.mediaUrl} alt={item.title} className="h-full w-full object-cover" />
                        </div>
                      ) : null}
                      <p className="font-semibold text-white">{item.title}</p>
                      {item.location ? <p className="text-[11px] text-slate-400">{item.location}</p> : null}
                      <p className="text-[11px] text-slate-500">
                        {item.mediaType.toLowerCase()} • {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-6 text-sm text-slate-300">
                  No portfolio entries yet. Once the creator uploads work, you’ll see reels, carousels, and stills here.
                </div>
              )}
            </div>

            <div className="rounded-4xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold text-white">Reviews</h2>
              {profile.reviews.length ? (
                <div className="mt-4 space-y-4">
                  {profile.reviews.map((review) => (
                    <article key={review.id} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-brand-200">{review.rating}★</span>
                        <span className="text-xs text-slate-400">
                          {review.client?.name ?? "Anonymous"}
                          {review.booking?.eventName ? ` • ${review.booking.eventName}` : ""}
                        </span>
                        <span className="text-xs text-slate-500">
                          {format(new Date(review.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      {review.comment ? <p className="mt-2 text-sm text-slate-200">{review.comment}</p> : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-300">
                  Reviews from clients will show up here after bookings are completed.
                </p>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-4xl border border-brand-400/40 bg-brand-500/10 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-100">Share this profile</h3>
              <p className="mt-2 text-sm text-slate-200">
                Send the profile to teammates or clients so everyone can align on the shortlists.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                      alert("Profile link copied to clipboard.");
                    } catch {
                      alert("Copy failed. Use your browser menu instead.");
                    }
                  }}
                  className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                >
                  Copy link
                </button>
                <a
                  href={`mailto:?subject=Check%20out%20${encodeURIComponent(profile.user?.name ?? "this photographer")}&body=${encodeURIComponent(
                    window.location.href,
                  )}`}
                  className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                >
                  Email
                </a>
              </div>
            </div>

            <div className="rounded-4xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">Availability</h3>
              <div className="mt-3 space-y-3">
                {profile.availability.length ? (
                  profile.availability.map((slot) => (
                    <div
                      key={slot.id}
                      className={clsx(
                        "rounded-3xl border px-4 py-3 text-xs text-slate-300",
                        slot.isBooked ? "border-emerald-400/60 bg-emerald-500/10" : "border-white/10 bg-white/5",
                      )}
                    >
                      <p className="text-sm font-semibold text-white">
                        {format(new Date(slot.startTime), "MMM d, yyyy p")} — {format(new Date(slot.endTime), "p")}
                      </p>
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">
                        {slot.isBooked ? "Reserved" : "Open for booking"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No availability published yet. Ask the photographer for options.</p>
                )}
              </div>
              <Link
                href="/bookings/new"
                className="mt-4 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-soft-glow transition hover:from-brand-300 hover:to-brand-500"
              >
                Request availability
              </Link>
            </div>

            <div className="rounded-4xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">Similar creators</h3>
              <p className="mt-2 text-xs text-slate-400">
                We’ll surface similar profiles once this creator adds more work and tags.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </>
  );
}

function verificationBadge(status: string) {
  if (status === "APPROVED") {
    return (
      <span className="rounded-full border border-emerald-400/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
        Fully verified
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className="rounded-full border border-amber-400/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">
        Verification pending
      </span>
    );
  }
  return (
    <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
      Trust review
    </span>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
