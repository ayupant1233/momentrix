import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import clsx from "clsx";
import ChatComposer from "./chat-composer";

type BookingPageProps = {
  params: {
    id: string;
  };
};

export default async function BookingDetailPage({ params }: BookingPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/bookings/${params.id}`);
  }

  const currentUserId = session.user.id;

  const booking = await prisma.booking.findFirst({
    where: {
      id: params.id,
      OR: [
        { clientId: currentUserId },
        { photographerId: currentUserId },
      ],
    },
    include: {
      client: { select: { name: true, email: true, phone: true } },
      photographer: { select: { name: true, email: true, phone: true } },
      thread: {
        include: {
          messages: {
            orderBy: { sentAt: "asc" },
            include: {
              sender: { select: { name: true, id: true } },
            },
          },
        },
      },
    },
  });

  if (!booking) {
    redirect("/bookings");
  }

  const isClient = booking.clientId === currentUserId;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-16 text-slate-100">
      <header className="rounded-4xl border border-white/10 bg-white/5 p-6">
        <p className="chip w-fit">Booking reference</p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">{booking.eventName}</h1>
            <p className="text-xs uppercase tracking-wide text-brand-200">
              {booking.eventType} • {booking.location ?? "Location TBD"}
            </p>
          </div>
          <span className="rounded-full border border-white/10 px-4 py-1 text-xs text-slate-300">
            {booking.status.replace("_", " ")}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-300">
          <span>{booking.startTime ? format(booking.startTime, "MMM d yyyy, p") : "Start time TBD"}</span>
          <span>•</span>
          <span>Hours requested: {booking.hoursRequested ?? "TBD"}</span>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6 rounded-4xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">Conversation</h2>
          <div
            id="chat"
            className="flex max-h-[460px] flex-col gap-3 overflow-y-auto rounded-3xl border border-white/5 bg-white/[0.03] p-4"
          >
            {booking.thread?.messages.length ? (
              booking.thread.messages.map((message) => (
                <div
                  key={message.id}
                  className={clsx("flex flex-col gap-1 rounded-2xl p-3 text-sm", {
                    "self-end bg-brand-500/20 text-brand-100": message.sender.id === currentUserId,
                    "self-start bg-white/5 text-slate-100": message.sender.id !== currentUserId,
                  })}
                >
                  <p className="font-medium">{message.sender.name ?? "Unnamed"}</p>
                  <p>{message.body}</p>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    {format(message.sentAt, "MMM d • p")}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-300">No messages yet. Start the conversation below.</p>
            )}
          </div>
          <ChatComposer bookingId={booking.id} />
        </div>

        <aside className="space-y-4 rounded-4xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">Summary</h3>
          <ul className="space-y-3 text-sm text-slate-300">
            <li>
              <span className="text-slate-400">{isClient ? "Photographer" : "Client"}:</span>{" "}
              {isClient ? booking.photographer?.name ?? "Pending acceptance" : booking.client?.name ?? "Unknown"}
            </li>
            <li>
              <span className="text-slate-400">Phone:</span>{" "}
              {isClient ? booking.photographer?.phone ?? "Not shared yet" : booking.client?.phone ?? "Not shared yet"}
            </li>
            <li>
              <span className="text-slate-400">Email:</span>{" "}
              {isClient ? booking.photographer?.email ?? "Not shared yet" : booking.client?.email ?? "Not shared yet"}
            </li>
            <li>
              <span className="text-slate-400">Deliverables:</span>{" "}
              {booking.deliverables ?? "Discuss deliverables in chat."}
            </li>
            <li>
              <span className="text-slate-400">Notes:</span> {booking.notes ?? "No additional notes yet."}
            </li>
          </ul>
          <div className="flex flex-wrap gap-3">
            {(isClient ? booking.photographer?.phone : booking.client?.phone) ? (
              <a
                href={`tel:${(isClient ? booking.photographer?.phone : booking.client?.phone)?.replace(/[^+0-9]/g, "")}`}
                className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
              >
                Call now
              </a>
            ) : null}
            <a
              href={`mailto:${isClient ? booking.photographer?.email ?? "" : booking.client?.email ?? ""}`}
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
            >
              Send email
            </a>
          </div>
        </aside>
      </section>
    </div>
  );
}

