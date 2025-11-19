"use client";

import { useMemo } from "react";
import clsx from "clsx";

type AnalyticsStats = {
  totalBookings: number;
  completedBookings: number;
  totalRevenue: number;
  averageRating: number | null;
  totalPortfolioItems: number;
  totalPosts: number;
  totalLikes: number;
  totalSaves: number;
  totalEnquiries: number;
  totalFollowers: number;
  bookingsByMonth: Array<{ month: string; count: number }>;
};

type AnalyticsDashboardProps = {
  initialStats: AnalyticsStats;
};

function formatCurrency(amount: number, currency: string = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-IN")}`;
  }
}

function formatMonth(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export function AnalyticsDashboard({ initialStats }: AnalyticsDashboardProps) {
  const completionRate = useMemo(() => {
    if (initialStats.totalBookings === 0) return 0;
    return Math.round((initialStats.completedBookings / initialStats.totalBookings) * 100);
  }, [initialStats.totalBookings, initialStats.completedBookings]);

  const maxBookings = useMemo(() => {
    if (initialStats.bookingsByMonth.length === 0) return 1;
    return Math.max(...initialStats.bookingsByMonth.map((b) => b.count));
  }, [initialStats.bookingsByMonth]);

  const statCards = [
    {
      label: "Total Bookings",
      value: initialStats.totalBookings,
      subtitle: `${initialStats.completedBookings} completed`,
      trend: null,
    },
    {
      label: "Total Revenue",
      value: formatCurrency(initialStats.totalRevenue, "INR"),
      subtitle: `${completionRate}% completion rate`,
      trend: null,
    },
    {
      label: "Average Rating",
      value: initialStats.averageRating ?? "N/A",
      subtitle: `${initialStats.totalBookings > 0 ? "Based on reviews" : "No reviews yet"}`,
      trend: null,
    },
    {
      label: "Followers",
      value: initialStats.totalFollowers,
      subtitle: "Clients following you",
      trend: null,
    },
  ];

  const engagementCards = [
    {
      label: "Portfolio Items",
      value: initialStats.totalPortfolioItems,
      icon: "📸",
    },
    {
      label: "Posts",
      value: initialStats.totalPosts,
      icon: "📝",
    },
    {
      label: "Total Likes",
      value: initialStats.totalLikes,
      icon: "❤️",
    },
    {
      label: "Saves",
      value: initialStats.totalSaves,
      icon: "🔖",
    },
    {
      label: "Enquiries",
      value: initialStats.totalEnquiries,
      icon: "💬",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-white">{card.value}</p>
            <p className="mt-1 text-xs text-slate-400">{card.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Bookings Chart */}
      {initialStats.bookingsByMonth.length > 0 ? (
        <div className="rounded-4xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">Bookings Over Time</h3>
          <p className="mt-1 text-sm text-slate-400">Last 6 months</p>
          <div className="mt-6 flex items-end gap-3">
            {initialStats.bookingsByMonth.map((item, idx) => {
              const height = (item.count / maxBookings) * 100;
              return (
                <div key={idx} className="flex-1 space-y-2">
                  <div className="relative h-32 w-full rounded-t-lg bg-white/5">
                    <div
                      className="absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-brand-500/80 to-brand-400 transition-all"
                      style={{ height: `${height}%` }}
                    />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full pt-2 text-xs font-semibold text-white">
                      {item.count}
                    </div>
                  </div>
                  <p className="text-center text-xs text-slate-400">{formatMonth(item.month)}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-4xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-sm">
          <p className="text-slate-300">No booking data yet.</p>
          <p className="mt-2 text-sm text-slate-400">Your booking trends will appear here once you start receiving bookings.</p>
        </div>
      )}

      {/* Engagement Metrics */}
      <div className="rounded-4xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white">Engagement Metrics</h3>
        <p className="mt-1 text-sm text-slate-400">How your content is performing</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {engagementCards.map((card, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-center"
            >
              <p className="text-2xl">{card.icon}</p>
              <p className="mt-2 text-xl font-bold text-white">{card.value}</p>
              <p className="mt-1 text-xs text-slate-400">{card.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

