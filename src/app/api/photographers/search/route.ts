import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitude = Number(searchParams.get("latitude") ?? "0");
  const longitude = Number(searchParams.get("longitude") ?? "0");
  const radius = Number(searchParams.get("radius") ?? "50");
  const text = (searchParams.get("q") ?? "").toLowerCase();
  const minRate = searchParams.get("minRate");
  const maxRate = searchParams.get("maxRate");
  const verification = searchParams.get("verification");
  const servicesFilter = (searchParams.get("services") ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const sortBy = searchParams.get("sort") ?? "distance";

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return NextResponse.json({ message: "Invalid coordinates" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const viewerId = session?.user?.id && session.user.role === "CLIENT" ? session.user.id : null;

  let followedSet = new Set<string>();
  if (viewerId) {
    const followed = await prisma.photographerFollow.findMany({
      where: { clientId: viewerId },
      select: { photographerId: true },
    });
    followedSet = new Set(followed.map((item) => item.photographerId));
  }

  const profiles = await prisma.photographerProfile.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      verificationStatus:
        verification === "verified"
          ? "APPROVED"
          : verification === "pending"
            ? { in: ["PENDING", "APPROVED"] }
            : { not: "REJECTED" },
    },
    include: {
      user: {
        select: { name: true, email: true, phone: true },
      },
      reviews: true,
      portfolioItems: {
        take: 3,
        orderBy: { createdAt: "desc" },
      },
      availability: {
        take: 1,
        orderBy: { startTime: "asc" },
      },
    },
  });

  const enriched = profiles
    .map((profile) => {
      if (profile.latitude == null || profile.longitude == null) {
        return null;
      }

      const distance = haversineDistance(latitude, longitude, profile.latitude, profile.longitude);
      const matchesSearch =
        !text ||
        profile.headline?.toLowerCase().includes(text) ||
        profile.bio?.toLowerCase().includes(text) ||
        JSON.stringify(profile.tags ?? "").toLowerCase().includes(text) ||
        JSON.stringify(profile.services ?? "").toLowerCase().includes(text);

      if (!matchesSearch) {
        return null;
      }

      const services = Array.isArray(profile.services)
        ? profile.services.map((service) => String(service))
        : null;

      const tags = Array.isArray(profile.tags)
        ? profile.tags.map((tag) => String(tag))
        : null;

      const minBudget = minRate ? Number(minRate) : undefined;
      const maxBudget = maxRate ? Number(maxRate) : undefined;
      const hourly = profile.hourlyRate ?? profile.fullDayRate ?? undefined;
      const fullDay = profile.fullDayRate ?? profile.hourlyRate ?? undefined;

      if (minBudget && hourly && hourly < minBudget && fullDay && fullDay < minBudget) {
        return null;
      }

      if (maxBudget && hourly && hourly > maxBudget && fullDay && fullDay > maxBudget) {
        return null;
      }

      if (
        servicesFilter.length &&
        !servicesFilter.every((service) =>
          (services ?? []).some((item) => item.toLowerCase().includes(service)),
        )
      ) {
        return null;
      }

      return {
        id: profile.id,
        name: profile.user?.name ?? "Untitled Creator",
        headline: profile.headline,
        city: profile.city,
        distance,
        travelRadiusKm: profile.travelRadiusKm,
        hourlyRate: profile.hourlyRate,
        fullDayRate: profile.fullDayRate,
        verificationStatus: profile.verificationStatus,
        services,
        tags,
        reviews: profile.reviews.length,
        averageRating:
          profile.reviews.length > 0
            ? profile.reviews.reduce((sum, review) => sum + review.rating, 0) / profile.reviews.length
            : null,
        portfolioItems: profile.portfolioItems.map((item) => ({
          id: item.id,
          title: item.title,
          mediaUrl: item.mediaUrl,
        })),
        email: profile.user?.email ?? "",
        phone: profile.user?.phone ?? "",
        followed: followedSet.has(profile.id),
        nextAvailability: profile.availability[0]?.startTime ?? null,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item) => item.distance <= radius + item.travelRadiusKm);

  const sorted = [...enriched].sort((a, b) => {
    switch (sortBy) {
      case "price-asc": {
        const priceA = a.hourlyRate ?? a.fullDayRate ?? Number.MAX_SAFE_INTEGER;
        const priceB = b.hourlyRate ?? b.fullDayRate ?? Number.MAX_SAFE_INTEGER;
        return priceA - priceB;
      }
      case "price-desc": {
        const priceA = a.hourlyRate ?? a.fullDayRate ?? 0;
        const priceB = b.hourlyRate ?? b.fullDayRate ?? 0;
        return priceB - priceA;
      }
      case "rating":
        return (b.averageRating ?? 0) - (a.averageRating ?? 0);
      case "recent":
        return (b.portfolioItems[0]?.id ?? "").localeCompare(a.portfolioItems[0]?.id ?? "");
      case "distance":
      default:
        return a.distance - b.distance;
    }
  });

  return NextResponse.json({ results: sorted.slice(0, 24) });
}

