import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AvailabilityManager from "./availability-manager";

export const metadata = {
  title: "Availability & Pricing | Momentrix",
};

export default async function AvailabilityPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "PHOTOGRAPHER") {
    redirect("/login?callbackUrl=/studio/availability");
  }

  const profile = await prisma.photographerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      travelRadiusKm: true,
      hourlyRate: true,
      halfDayRate: true,
      fullDayRate: true,
      currency: true,
      responseTimeHrs: true,
      availability: {
        orderBy: { startTime: "asc" },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          isBooked: true,
        },
      },
    },
  });

  if (!profile) {
    redirect("/onboarding/photographer");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-12 text-slate-100">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="chip w-fit">Creator studio</p>
          <h1 className="text-3xl font-semibold text-white">Availability & pricing</h1>
          <p className="text-sm text-slate-300">
            Share how far you can travel, set your day rates, and publish open slots clients can instantly book.
          </p>
        </div>
      </header>
      <AvailabilityManager
        initialSettings={{
          travelRadiusKm: profile.travelRadiusKm,
          hourlyRate: profile.hourlyRate ?? null,
          halfDayRate: profile.halfDayRate ?? null,
          fullDayRate: profile.fullDayRate ?? null,
          currency: profile.currency,
          responseTimeHrs: profile.responseTimeHrs ?? 24,
        }}
        initialSlots={profile.availability.map((slot) => ({
          ...slot,
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
        }))}
      />
    </div>
  );
}

