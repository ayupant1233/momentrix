import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function PhotographerProfilePage({ params }: { params: { profileId: string } }) {
  const profile = await prisma.photographerProfile.findUnique({
    where: { id: params.profileId },
    include: {
      user: {
        select: { name: true, email: true, phone: true },
      },
      portfolioItems: {
        orderBy: { createdAt: "desc" },
        take: 12,
      },
    },
  });

  if (!profile) {
    notFound();
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-5xl px-6 py-16 text-slate-100">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">{profile.user?.name ?? "Untitled Photographer"}</h1>
          <p className="text-sm text-slate-300">
            {profile.headline ?? "Update your headline to make a stronger first impression."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-300">
          {profile.user?.phone ? <span>📞 {profile.user.phone}</span> : null}
          {profile.user?.email ? <span>✉️ {profile.user.email}</span> : null}
        </div>
      </header>

      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold text-white">Recent work</h2>
        {profile.portfolioItems.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profile.portfolioItems.map((item) => (
              <article key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <p className="font-semibold text-white">{item.title}</p>
                {item.location ? <p className="text-xs text-slate-400">{item.location}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-300">No portfolio items yet.</p>
        )}
      </section>
    </div>
  );
}
