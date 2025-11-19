import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardNav from "@/components/dashboard-nav";
import BookingForm from "./booking-form";
import QuoteBuilder from "./quote-builder";

export default async function NewBookingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "CLIENT") {
    redirect("/login?callbackUrl=/bookings/new");
  }

  const clientProfile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <>
      <DashboardNav />
      <div className="mx-auto min-h-screen w-full max-w-7xl px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr] xl:gap-10">
          <BookingForm
            defaultLatitude={clientProfile?.latitude ?? null}
            defaultLongitude={clientProfile?.longitude ?? null}
          />
          <QuoteBuilder />
        </div>
      </div>
    </>
  );
}

