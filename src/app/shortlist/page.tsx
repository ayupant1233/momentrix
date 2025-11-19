import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { Prisma } from "@prisma/client";

import DashboardNav from "@/components/dashboard-nav";
import { BackLink } from "@/components/back-link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { ShortlistClient } from "./shortlist-client";

export const metadata: Metadata = {
  title: "Shortlist | Momentrix",
  description:
    "Review, compare, and take action on the photographers you have shortlisted for upcoming shoots.",
};

export const dynamic = "force-dynamic";

function toStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.filter((value): value is string => typeof value === "string");
}

export default async function ShortlistPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/shortlist");
  }

  if (session.user.role !== "CLIENT") {
    redirect("/app");
  }

  // Get photographer IDs that the client follows
  const followRecords = await (prisma as any).photographerFollow.findMany({
    where: { clientId: session.user.id },
    select: { photographerId: true },
  });

  const photographerIds = followRecords.map((f: { photographerId: string }) => f.photographerId);

  // If no follows, return empty array
  if (photographerIds.length === 0) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(32,28,64,0.7)_0%,_rgba(3,6,20,1)_60%)] pb-20 text-white">
        <DashboardNav />
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-10 sm:px-6 lg:px-8">
          <BackLink href="/app" label="Back to dashboard" />
          <header className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-200/80">Shortlist</p>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Review your saved photographers</h1>
            <p className="max-w-2xl text-sm text-slate-300">
              Compare creators side-by-side, capture personal notes, and progress your top choices towards a confirmed
              booking.
            </p>
          </header>
          <div className="rounded-4xl border border-white/10 bg-white/5 p-12 text-center">
            <p className="text-slate-300">You haven&apos;t shortlisted any photographers yet.</p>
            <p className="mt-2 text-sm text-slate-400">
              <Link href="/discover" className="text-brand-200 hover:text-brand-100">
                Discover photographers →
              </Link>
            </p>
          </div>
        </main>
      </div>
    );
  }

  const shortlistInclude = Prisma.validator<Prisma.PhotographerProfileInclude>()({
    user: true,
    portfolioItems: {
      take: 4,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        mediaUrl: true,
      },
    },
    reviews: {
      select: {
        rating: true,
      },
    },
    availability: {
      where: {
        startTime: {
          gte: new Date(),
        },
        isBooked: false,
      },
      orderBy: {
        startTime: "asc",
      },
      take: 1,
      select: {
        startTime: true,
        endTime: true,
      },
    },
  });

  type ShortlistProfile = Prisma.PhotographerProfileGetPayload<{ include: typeof shortlistInclude }>;

  const savedProfiles: ShortlistProfile[] = await prisma.photographerProfile.findMany({
    where: {
      id: { in: photographerIds },
    },
    orderBy: { updatedAt: "desc" },
    include: shortlistInclude,
  });

  // Get social accounts for all users
  const userIds = savedProfiles.map((p) => p.userId).filter((id): id is string => id != null);
  const socialAccountsMap = new Map<string, Array<{
    provider: string;
    handle: string;
    followerCount: number;
    profileUrl: string | null;
    verifiedAt: Date | null;
  }>>();

  if (userIds.length > 0) {
    const socialAccounts = await (prisma as any).socialAccount.findMany({
      where: { userId: { in: userIds } },
      select: {
        userId: true,
        provider: true,
        handle: true,
        followerCount: true,
        profileUrl: true,
        verifiedAt: true,
      },
    });

    for (const account of socialAccounts) {
      if (!socialAccountsMap.has(account.userId)) {
        socialAccountsMap.set(account.userId, []);
      }
      socialAccountsMap.get(account.userId)!.push({
        provider: account.provider,
        handle: account.handle,
        followerCount: account.followerCount,
        profileUrl: account.profileUrl,
        verifiedAt: account.verifiedAt,
      });
    }
  }

  // Get follower records for the current client
  const followersMap = new Map<string, { createdAt: Date }>();
  if (photographerIds.length > 0) {
    const followers = await (prisma as any).photographerFollow.findMany({
      where: {
        clientId: session.user.id,
        photographerId: { in: photographerIds },
      },
      select: {
        photographerId: true,
        createdAt: true,
      },
    });

    for (const follow of followers) {
      followersMap.set(follow.photographerId, { createdAt: follow.createdAt });
    }
  }

  const shortlist = savedProfiles.map((profile: ShortlistProfile) => {
    const services = toStringArray(profile.services);
    const tags = toStringArray(profile.tags);
    const reviewCount = profile.reviews.length;
    const averageRating =
      reviewCount === 0
        ? null
        : profile.reviews.reduce((total: number, review: { rating: number }) => total + review.rating, 0) /
          reviewCount;
    const nextAvailability = profile.availability.length > 0 ? profile.availability[0] : null;
    const followerRecord = followersMap.get(profile.id);

    return {
      id: profile.id,
      userId: profile.userId,
      name: profile.user?.name ?? profile.headline ?? "Momentrix photographer",
      headline: profile.headline,
      city: profile.city,
      verificationStatus: profile.verificationStatus,
      hourlyRate: profile.hourlyRate,
      halfDayRate: profile.halfDayRate,
      fullDayRate: profile.fullDayRate,
      currency: profile.currency,
      responseTimeHrs: profile.responseTimeHrs,
      travelRadiusKm: profile.travelRadiusKm,
      services,
      tags,
      email: profile.user?.email ?? null,
      phone: profile.user?.phone ?? null,
      averageRating: averageRating != null ? Number(averageRating.toFixed(1)) : null,
      reviewCount,
      followedAt: followerRecord?.createdAt?.toISOString() ?? null,
      nextAvailabilityStart: nextAvailability?.startTime?.toISOString() ?? null,
      nextAvailabilityEnd: nextAvailability?.endTime?.toISOString() ?? null,
      socialAccounts:
        (socialAccountsMap.get(profile.userId) ?? []).map((account) => ({
          provider: account.provider,
          handle: account.handle,
          followerCount: account.followerCount,
          profileUrl: account.profileUrl,
          verifiedAt: account.verifiedAt?.toISOString() ?? null,
        })),
      portfolio: profile.portfolioItems.map(
        (item: { id: string; title: string; mediaUrl: string }) => ({
          id: item.id,
          title: item.title,
          mediaUrl: item.mediaUrl,
        }),
      ),
    };
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(32,28,64,0.7)_0%,_rgba(3,6,20,1)_60%)] pb-20 text-white">
      <DashboardNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-10 sm:px-6 lg:px-8">
        <BackLink href="/app" label="Back to dashboard" />

        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-200/80">Shortlist</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Review your saved photographers</h1>
          <p className="max-w-2xl text-sm text-slate-300">
            Compare creators side-by-side, capture personal notes, and progress your top choices towards a confirmed
            booking.
          </p>
        </header>

        <ShortlistClient initialPhotographers={shortlist} />
      </main>
    </div>
  );
}


