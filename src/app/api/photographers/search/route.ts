import { NextResponse } from "next/server";
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

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return NextResponse.json({ message: "Invalid coordinates" }, { status: 400 });
  }

  const profiles = await prisma.photographerProfile.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      verificationStatus: { not: "REJECTED" },
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
        JSON.stringify(profile.tags ?? "")
          .toLowerCase()
          .includes(text);

      if (!matchesSearch) {
        return null;
      }

      const services = Array.isArray(profile.services)
        ? profile.services.map((service) => String(service))
        : null;

      const tags = Array.isArray(profile.tags)
        ? profile.tags.map((tag) => String(tag))
        : null;

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
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item) => item.distance <= radius + item.travelRadiusKm)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 24);

  return NextResponse.json({ results: enriched });
}

