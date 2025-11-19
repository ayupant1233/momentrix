import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardNav from "@/components/dashboard-nav";
import { DiscoverClient } from "./discover-client";

export default async function DiscoverPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/discover");
  }

  if (session.user.role !== "CLIENT") {
    redirect("/app");
  }

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  });

  const availablePhotographers = await prisma.photographerProfile.findMany({
    take: 8,
    orderBy: [
      { verificationStatus: "desc" },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      headline: true,
      city: true,
      travelRadiusKm: true,
      hourlyRate: true,
      fullDayRate: true,
      services: true,
      tags: true,
      verificationStatus: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      portfolioItems: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          mediaUrl: true,
        },
      },
    },
  });

  return (
    <>
      <DashboardNav />
      <div className="mx-auto min-h-screen w-full max-w-6xl px-6 py-14 text-slate-100">
      <DiscoverClient
        defaultLatitude={profile?.latitude ?? null}
        defaultLongitude={profile?.longitude ?? null}
        defaultRadiusKm={profile?.latitude != null && profile.longitude != null ? 30 : 50}
        available={availablePhotographers.map((photographer) => ({
          id: photographer.id,
          name: photographer.user?.name ?? "Momentrix photographer",
          headline: photographer.headline,
          city: photographer.city,
          travelRadiusKm: photographer.travelRadiusKm,
          hourlyRate: photographer.hourlyRate,
          fullDayRate: photographer.fullDayRate,
          services: Array.isArray(photographer.services) ? (photographer.services as string[]) : null,
          tags: Array.isArray(photographer.tags) ? (photographer.tags as string[]) : null,
          verificationStatus: photographer.verificationStatus,
          email: photographer.user?.email ?? "",
          phone: photographer.user?.phone ?? "",
          hero: photographer.portfolioItems[0] ?? null,
        }))}
      />
      </div>
    </>
  );
}

