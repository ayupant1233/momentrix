import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BookingForm from "./booking-form";

export default async function NewBookingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "CLIENT") {
    redirect("/login?callbackUrl=/bookings/new");
  }

  const clientProfile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl px-6 py-16 text-slate-100">
      <BookingForm
        defaultLatitude={clientProfile?.latitude ?? null}
        defaultLongitude={clientProfile?.longitude ?? null}
      />
    </div>
  );
}

