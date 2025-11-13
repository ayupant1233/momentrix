import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";

export default async function BookingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/bookings");
  }

  const bookings =
    session.user.role === "PHOTOGRAPHER"
      ? await prisma.booking.findMany({
          where: { photographerId: session.user.id },
          orderBy: { createdAt: "desc" },
          include: {
            client: { select: { name: true, email: true, phone: true } },
          },
        })
      : await prisma.booking.findMany({
          where: { clientId: session.user.id },
          orderBy: { createdAt: "desc" },
          include: {
            photographer: { select: { name: true, email: true, phone: true } },
          },
        });

  const isClient = session.user.role === "CLIENT";

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-6 py-16 text-slate-100">
      <header className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="chip">{isClient ? "Your shoot requests" : "Incoming bookings"}</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">
            {isClient ? "Keep track of every event" : "Respond quickly to lock in clients"}
          </h1>
          <p className="text-sm text-slate-300">
            Manage statuses, review briefs, and jump into chat threads to finalise details.
          </p>
        </div>
        {isClient ? (
          <Link
            href="/bookings/new"
            className="rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-soft-glow transition hover:from-brand-300 hover:to-brand-500"
          >
            Create new request
          </Link>
        ) : null}
      </header>

      <main className="grid gap-5">
        {bookings.length === 0 ? (
          <div className="rounded-4xl border border-dashed border-white/15 bg-white/5 p-10 text-center text-sm text-slate-300">
            {isClient
              ? "You haven’t created any booking briefs yet. Start by discovering a photographer."
              : "No bookings yet. Update your profile and share reels to attract more clients."}
          </div>
        ) : (
          bookings.map((booking) => {
            const photographer = "photographer" in booking ? booking.photographer : null;
            const client = "client" in booking ? booking.client : null;

            return (
              <article
                key={booking.id}
                className="flex flex-col gap-4 rounded-4xl border border-white/10 bg-white/5 p-6 transition hover:border-brand-300/60"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{booking.eventName}</h2>
                    <p className="text-xs uppercase tracking-wide text-brand-200">{booking.eventType}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                    {booking.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-slate-300">
                  <span>{format(booking.startTime ?? booking.createdAt, "MMM d, yyyy p")}</span>
                  <span>•</span>
                  <span>{booking.location ?? "Location TBD"}</span>
                </div>
                <p className="text-xs text-slate-400">
                  {isClient
                    ? `Photographer: ${photographer?.name ?? "Pending"}`
                    : `Client: ${client?.name ?? "Unknown"}`}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                  {isClient ? (
                    <>
                      {photographer?.phone ? <span>📞 {photographer.phone}</span> : null}
                      {photographer?.email ? <span>✉️ {photographer.email}</span> : null}
                    </>
                  ) : (
                    <>
                      {client?.phone ? <span>📞 {client.phone}</span> : null}
                      {client?.email ? <span>✉️ {client.email}</span> : null}
                    </>
                  )}
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/bookings/${booking.id}`}
                    className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                  >
                    View details
                  </Link>
                  <Link
                    href={`/bookings/${booking.id}#chat`}
                    className="rounded-full bg-brand-500/20 px-4 py-2 text-sm font-semibold text-brand-100 transition hover:bg-brand-400/30"
                  >
                    Open chat
                  </Link>
                  {(isClient ? photographer?.phone : client?.phone) ? (
                    <a
                      href={`tel:${(isClient ? photographer?.phone : client?.phone)?.replace(/[^+0-9]/g, "")}`}
                      className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                    >
                      Call
                    </a>
                  ) : null}
                  <a
                    href={`mailto:${isClient ? photographer?.email ?? "" : client?.email ?? ""}`}
                    className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                  >
                    Email
                  </a>
                </div>
              </article>
            );
          })
        )}
      </main>
    </div>
  );
}

