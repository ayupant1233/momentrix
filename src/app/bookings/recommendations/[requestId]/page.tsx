import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import DashboardNav from "@/components/dashboard-nav";
import { BackLink } from "@/components/back-link";
import RecommendationsClient from "./recommendations-client";

export const metadata: Metadata = {
  title: "Photographer recommendations | Momentrix",
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default async function RecommendationsPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "CLIENT") {
    redirect(`/login?callbackUrl=/bookings/recommendations/${requestId}`);
  }

  const bookingRequest = await prisma.bookingRequest.findUnique({
    where: { id: requestId },
  });

  if (!bookingRequest || bookingRequest.clientId !== session.user.id) {
    redirect("/bookings/new");
  }

  const bookingRequestPayload = {
    id: bookingRequest.id,
    eventName: bookingRequest.eventName,
    eventType: bookingRequest.eventType,
    location: bookingRequest.location,
    latitude: bookingRequest.latitude,
    longitude: bookingRequest.longitude,
    startTime: bookingRequest.startTime?.toISOString() ?? null,
    endTime: bookingRequest.endTime?.toISOString() ?? null,
    hoursRequested: bookingRequest.hoursRequested,
    notes: bookingRequest.notes,
    deliverables: bookingRequest.deliverables,
    initialMessage: bookingRequest.initialMessage,
    createdAt: bookingRequest.createdAt.toISOString(),
  };

  const follows = await prisma.photographerFollow.findMany({
    where: { clientId: session.user.id },
    select: { photographerId: true },
  });
  const followedIds = new Set(follows.map((follow) => follow.photographerId));

  const profiles = await prisma.photographerProfile.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
      reviews: true,
    },
  });

  const requestLat = bookingRequest.latitude ?? 0;
  const requestLon = bookingRequest.longitude ?? 0;

  const enriched = profiles
    .filter((profile) => profile.latitude != null && profile.longitude != null)
    .map((profile) => {
      const distance = haversineDistance(requestLat, requestLon, profile.latitude!, profile.longitude!);
      // Ensure distance is a valid number and not too large
      const validDistance = isFinite(distance) && distance >= 0 ? Math.min(distance, 50000) : 50000;
      return {
        id: profile.userId, // userId for booking creation
        profileId: profile.id, // profileId for profile links
        name: profile.user?.name ?? "Untitled Photographer",
        headline: profile.headline ?? "Add a headline",
        city: profile.city ?? "City TBD",
        hourlyRate: profile.hourlyRate,
        rating:
          profile.reviews.length > 0
            ? profile.reviews.reduce((sum, review) => sum + review.rating, 0) / profile.reviews.length
            : null,
        reviews: profile.reviews.length,
        phone: profile.user?.phone ?? null,
        email: profile.user?.email ?? null,
        distance: validDistance,
        travelRadiusKm: profile.travelRadiusKm ?? 0,
        followed: followedIds.has(profile.id),
      };
    })
    .sort((a, b) => a.distance - b.distance);

  const nearby = enriched.filter((item) => item.distance <= item.travelRadiusKm + 10).slice(0, 12);
  const fallback = enriched.slice(0, 12);

  return (
    <>
      <DashboardNav />
      <div className="mx-auto min-h-screen w-full max-w-6xl px-6 py-14 text-slate-100">
        <BackLink href="/bookings" label="Back to bookings" className="mb-6" />
        <RecommendationsClient
          bookingRequest={bookingRequestPayload}
          nearby={(nearby.length ? nearby : fallback).map((item) => ({
            ...item,
            distance: Number(item.distance),
          }))}
          allResults={enriched.map((item) => ({
            ...item,
            distance: Number(item.distance),
          }))}
        />
      </div>
    </>
  );
}
