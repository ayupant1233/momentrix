import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardNav from "@/components/dashboard-nav";
import PortfolioManager from "./portfolio-manager";

export const metadata = {
  title: "Portfolio Manager | Momentrix Studio",
};

export default async function PortfolioPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "PHOTOGRAPHER") {
    redirect("/login?callbackUrl=/studio/portfolio");
  }

  const profile = await prisma.photographerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      portfolioItems: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          mediaUrl: true,
          mediaType: true,
          featured: true,
          capturedAt: true,
          location: true,
          createdAt: true,
        },
      },
    },
  });

  if (!profile) {
    redirect("/onboarding/photographer");
  }

  return (
    <>
      <DashboardNav />
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-14 text-slate-100">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="chip w-fit">Creator studio</p>
          <h1 className="text-3xl font-semibold text-white">Curate your portfolio</h1>
          <p className="text-sm text-slate-300">
            Upload signature work, feature your best shoots, and keep prospects inspired.
          </p>
        </div>
      </header>
      <PortfolioManager
        profileId={profile.id}
        initialItems={profile.portfolioItems.map((item) => ({
          ...item,
          capturedAt: item.capturedAt ? item.capturedAt.toISOString() : null,
          createdAt: item.createdAt.toISOString(),
        }))}
      />
      </div>
    </>
  );
}

