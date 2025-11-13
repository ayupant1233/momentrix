import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

async function getDashboardData(userId: string, role: string) {
  if (role === "PHOTOGRAPHER") {
    const profile = await prisma.photographerProfile.findUnique({
      where: { userId },
      include: {
        portfolioItems: {
          take: 3,
          orderBy: { createdAt: "desc" },
        },
        posts: {
          take: 3,
          orderBy: { createdAt: "desc" },
        },
        reviews: {
          take: 3,
          orderBy: { createdAt: "desc" },
          include: {
            booking: true,
          },
        },
      },
    });

    const pendingBookings = await prisma.booking.count({
      where: { photographerId: userId, status: "REQUESTED" },
    });

    return { profile, pendingBookings };
  }

  if (role === "CLIENT") {
    const profile = await prisma.clientProfile.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });

    const activeRequests = await prisma.booking.count({
      where: { clientId: userId, status: { in: ["REQUESTED", "CONFIRMED"] } },
    });

    const savedPhotographers = await prisma.photographerProfile.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
    });

    return { profile, activeRequests, savedPhotographers };
  }

  return {};
}

export default async function AppHome() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/app");
  }

  const dashboardData = await getDashboardData(session.user.id, session.user.role);

  const isPhotographer = session.user.role === "PHOTOGRAPHER";
  const isEmailVerified = session.user.emailVerified ?? false;

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-6 py-12 text-slate-100">
      <header className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="chip">{isPhotographer ? "Creator workspace" : "Client cockpit"}</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            {isPhotographer ? "Showcase, respond, deliver." : "Discover, brief, book."}
          </h1>
          <p className="text-sm text-slate-300">
            Welcome back, {session.user.name ?? "there"}. Pick up right where you left off.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={isPhotographer ? "/studio/portfolio" : "/discover"}
            className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-white transition hover:border-brand-300/60 hover:text-brand-100"
          >
            {isPhotographer ? "Manage portfolio" : "Find photographers"}
          </Link>
          <Link
            href={isPhotographer ? "/studio/availability" : "/bookings/new"}
            className="rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-soft-glow transition hover:from-brand-300 hover:to-brand-500"
          >
            {isPhotographer ? "Update availability" : "Create booking brief"}
          </Link>
        </div>
      </header>

      <main className="grid gap-8 xl:grid-cols-[2fr_1fr]">
        <section className="space-y-6">
          <div className="rounded-4xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-white">
              {isPhotographer ? "At a glance" : "Your requests"}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {isPhotographer ? (
                <>
                  <MetricCard value={dashboardData.pendingBookings ?? 0} label="New booking requests" />
                  <MetricCard
                    value={
                      dashboardData.profile && "reviews" in dashboardData.profile
                        ? dashboardData.profile.reviews.length
                        : 0
                    }
                    label="Reviews this month"
                  />
                </>
              ) : (
                <>
                  <MetricCard value={dashboardData.activeRequests ?? 0} label="Active requests" />
                  <MetricCard value={dashboardData.savedPhotographers?.length ?? 0} label="New talent" />
                </>
              )}
            </div>
          </div>

          {isPhotographer ? (
            <PhotographerPanels dashboardData={dashboardData} />
          ) : (
            <ClientPanels dashboardData={dashboardData} userId={session.user.id} />
          )}
        </section>

        <aside className="space-y-6">
          <div className="rounded-4xl border border-brand-400/40 bg-brand-500/10 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-100">
              Identity verification
            </h3>
            <p className="mt-2 text-sm text-slate-200">
              {isEmailVerified
                ? "Your email is verified. Link your socials next to earn the verified badge."
                : isPhotographer
                  ? "Verify your email and link your socials to unlock premium leads and faster approvals."
                  : "Verify your email to access top creators and secure booking protection."}
            </p>
            <Link
              href="/settings/verification"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-midnight-900"
            >
              {isEmailVerified ? "Manage verification" : "Verify now"}
            </Link>
          </div>

          <div className="rounded-4xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">Next steps</h3>
            <ul className="mt-3 space-y-3 text-sm text-slate-300">
              <li>• {isPhotographer ? "Complete your service catalogue" : "Set your project budget range"}</li>
              <li>• {isPhotographer ? "Publish a new reel" : "Save your favourite creators"}</li>
              <li>• {isPhotographer ? "Enable instant booking" : "Share a detailed brief"}</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}

function MetricCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
    </div>
  );
}

function PhotographerPanels({
  dashboardData,
}: {
  dashboardData: Awaited<ReturnType<typeof getDashboardData>>;
}) {
  const profile =
    dashboardData.profile && "portfolioItems" in dashboardData.profile
      ? dashboardData.profile
      : null;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-4xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white">Portfolio highlights</h3>
        <div className="mt-4 space-y-3">
          {profile?.portfolioItems?.length ? (
            profile.portfolioItems.map((item) => (
              <article key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-slate-400">{item.location ?? "Location TBD"}</p>
              </article>
            ))
          ) : (
            <EmptyState message="Upload portfolio pieces to attract new briefs." link="/studio/portfolio/new" />
          )}
        </div>
      </div>
      <div className="rounded-4xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white">Recent social posts</h3>
        <div className="mt-4 space-y-3">
          {profile?.posts?.length ? (
            profile.posts.map((post) => (
              <article key={post.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">{post.title}</p>
                <p className="text-xs text-slate-400">
                  {post.likes} likes • {post.enquiries} enquiries
                </p>
              </article>
            ))
          ) : (
            <EmptyState message="Share behind-the-scenes clips to stay top of mind." link="/studio/posts/new" />
          )}
        </div>
      </div>
    </div>
  );
}

function ClientPanels({
  dashboardData,
  userId,
}: {
  dashboardData: Awaited<ReturnType<typeof getDashboardData>>;
  userId: string;
}) {
  const hasActiveRequest = (dashboardData.activeRequests ?? 0) > 0;
  return (
    <div className="space-y-6">
      {hasActiveRequest ? null : (
        <div className="rounded-4xl border border-brand-400/40 bg-brand-500/10 p-6">
          <h3 className="text-lg font-semibold text-white">Share your brief</h3>
          <p className="mt-3 text-sm text-slate-300">
            Submit a project brief to unlock personalised photographer recommendations aligned with your needs.
          </p>
          <Link
            href="/bookings/new"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-midnight-900"
          >
            Create a new brief
          </Link>
        </div>
      )}
      <div className="rounded-4xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white">Suggested photographers</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {dashboardData.savedPhotographers?.length ? (
            dashboardData.savedPhotographers.map((photographer) => (
              <article key={photographer.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">{photographer.userId}</p>
                <p className="text-xs uppercase tracking-wide text-brand-200">
                  {photographer.tags ? JSON.stringify(photographer.tags).replace(/[\[\]\"]+/g, "") : "Set tags"}
                </p>
              </article>
            ))
          ) : (
            <EmptyState
              message="Complete a brief to get handpicked matches."
              link="/bookings/new"
            />
          )}
        </div>
      </div>
      <ClientFeed userId={userId} />
    </div>
  );
}

function EmptyState({ message, link }: { message: string; link: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-6 text-sm text-slate-300">
      <p>{message}</p>
      <Link href={link} className="mt-2 inline-flex text-brand-200">
        Take action →
      </Link>
    </div>
  );
}

async function ClientFeed({ userId }: { userId: string }) {
  const recommendations = await prisma.photographerProfile.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      headline: true,
      city: true,
      travelRadiusKm: true,
      tags: true,
      portfolioItems: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          mediaUrl: true,
          title: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
    },
  });

  return (
    <div className="rounded-4xl border border-white/10 bg-white/5 p-6">
      <h3 className="text-lg font-semibold text-white">Near you</h3>
      <p className="mt-2 text-sm text-slate-300">A feed of creators recently active in your region.</p>
      <div className="mt-6 space-y-4">
        {recommendations.length === 0 ? (
          <EmptyState message="Update your location to surface nearby photographers." link="/onboarding/client" />
        ) : (
          recommendations.map((photographer) => {
            const tags = Array.isArray(photographer.tags) ? (photographer.tags as string[]) : [];
            const hero = photographer.portfolioItems.at(0);
            return (
              <article key={photographer.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {photographer.user?.name ?? photographer.headline ?? "Momentrix photographer"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {photographer.city ?? "Location TBD"} • travels {photographer.travelRadiusKm} km
                    </p>
                  </div>
                  <Link
                    href={`/photographers/${photographer.id}`}
                    className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-1 text-xs font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                  >
                    View profile
                  </Link>
                </div>
                {hero ? (
                  <div className="mt-3 overflow-hidden rounded-3xl border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={hero.mediaUrl} alt={hero.title} className="h-48 w-full object-cover" />
                  </div>
                ) : null}
                {tags.length ? (
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-brand-200">
                    {tags.slice(0, 6).map((tag) => (
                      <span key={tag} className="rounded-full border border-brand-400/40 px-3 py-1">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>
      <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
        <span>Need a curated shortlist?</span>
        <Link href="/bookings/new" className="text-brand-200">
          Share a brief →
        </Link>
      </div>
    </div>
  );
}

