import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DiscoverClient } from "./discover-client";

export default async function DiscoverPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/discover");
  }

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-6 py-16 text-slate-100">
      <DiscoverClient
        defaultLatitude={profile?.latitude ?? null}
        defaultLongitude={profile?.longitude ?? null}
        defaultRadiusKm={profile?.latitude != null && profile.longitude != null ? 30 : 50}
      />
    </div>
  );
}

