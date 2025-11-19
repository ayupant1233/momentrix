import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardNav from "@/components/dashboard-nav";
import { BackLink } from "@/components/back-link";
import { AnalyticsDashboard } from "./analytics-dashboard";

export const metadata: Metadata = {
  title: "Analytics & Insights | Momentrix",
  description: "Track your performance, bookings, and growth on Momentrix.",
};

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "PHOTOGRAPHER") {
    redirect("/login?callbackUrl=/studio/analytics");
  }

  const userId = session.user.id;

  // Get booking stats
  const bookings = await prisma.booking.findMany({
    where: { photographerId: userId },
    select: {
      id: true,
      status: true,
      totalAmount: true,
      currency: true,
      createdAt: true,
      startTime: true,
    },
  });

  // Get profile stats
  const profile = await prisma.photographerProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      portfolioItems: {
        select: { id: true },
      },
      posts: {
        select: { id: true, likes: true, saves: true, enquiries: true },
      },
      reviews: {
        select: { rating: true },
      },
      followers: {
        select: { id: true },
      },
    },
  });

  // Calculate stats
  const totalBookings = bookings.length;
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED").length;
  const totalRevenue = bookings
    .filter((b) => b.totalAmount != null)
    .reduce((sum, b) => sum + (b.totalAmount ?? 0), 0);
  const averageRating =
    profile?.reviews.length && profile.reviews.length > 0
      ? profile.reviews.reduce((sum, r) => sum + r.rating, 0) / profile.reviews.length
      : null;
  const totalPortfolioItems = profile?.portfolioItems.length ?? 0;
  const totalPosts = profile?.posts.length ?? 0;
  const totalLikes = profile?.posts.reduce((sum, p) => sum + p.likes, 0) ?? 0;
  const totalSaves = profile?.posts.reduce((sum, p) => sum + p.saves, 0) ?? 0;
  const totalEnquiries = profile?.posts.reduce((sum, p) => sum + p.enquiries, 0) ?? 0;
  const totalFollowers = profile?.followers.length ?? 0;

  // Get bookings by month for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const recentBookings = bookings.filter((b) => b.createdAt >= sixMonthsAgo);
  const bookingsByMonth = new Map<string, number>();

  for (const booking of recentBookings) {
    const monthKey = `${booking.createdAt.getFullYear()}-${String(booking.createdAt.getMonth() + 1).padStart(2, "0")}`;
    bookingsByMonth.set(monthKey, (bookingsByMonth.get(monthKey) ?? 0) + 1);
  }

  const stats = {
    totalBookings,
    completedBookings,
    totalRevenue,
    averageRating: averageRating != null ? Number(averageRating.toFixed(1)) : null,
    totalPortfolioItems,
    totalPosts,
    totalLikes,
    totalSaves,
    totalEnquiries,
    totalFollowers,
    bookingsByMonth: Array.from(bookingsByMonth.entries()).map(([month, count]) => ({
      month,
      count,
    })),
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(32,28,64,0.7)_0%,_rgba(3,6,20,1)_60%)] pb-20 text-white">
      <DashboardNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-10 sm:px-6 lg:px-8">
        <BackLink href="/app" label="Back to dashboard" />

        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-200/80">Analytics</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Performance & Insights</h1>
          <p className="max-w-2xl text-sm text-slate-300">
            Track your bookings, revenue, engagement, and growth metrics to understand what&apos;s working.
          </p>
        </header>

        <AnalyticsDashboard initialStats={stats} />
      </main>
    </div>
  );
}

