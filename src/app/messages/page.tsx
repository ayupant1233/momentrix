import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardNav from "@/components/dashboard-nav";
import { BackLink } from "@/components/back-link";
import { MessagesInbox } from "./messages-inbox";

export const metadata: Metadata = {
  title: "Messages | Momentrix",
  description: "Your conversations with photographers and clients.",
};

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/messages");
  }

  const userId = session.user.id;
  const isPhotographer = session.user.role === "PHOTOGRAPHER";

  // Get all threads for this user
  const threads = await prisma.chatThread.findMany({
    where: isPhotographer
      ? { photographerId: userId }
      : { clientId: userId },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      photographer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      booking: {
        select: {
          id: true,
          eventName: true,
          eventType: true,
          status: true,
        },
      },
      messages: {
        orderBy: { sentAt: "desc" },
        take: 1,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Count unread messages per thread
  const threadIds = threads.map((t) => t.id);
  const unreadCounts = new Map<string, number>();

  if (threadIds.length > 0) {
    const unreadMessages = await prisma.message.findMany({
      where: {
        threadId: { in: threadIds },
        senderId: { not: userId },
        readAt: null,
      },
      select: {
        threadId: true,
      },
    });

    for (const msg of unreadMessages) {
      unreadCounts.set(msg.threadId, (unreadCounts.get(msg.threadId) ?? 0) + 1);
    }
  }

  const threadsWithUnread = threads.map((thread) => {
    const otherUser = isPhotographer ? thread.client : thread.photographer;
    const latestMessage = thread.messages[0];
    const unreadCount = unreadCounts.get(thread.id) ?? 0;

    return {
      id: thread.id,
      bookingId: thread.bookingId,
      bookingName: thread.booking?.eventName ?? "General conversation",
      bookingType: thread.booking?.eventType ?? null,
      bookingStatus: thread.booking?.status ?? null,
      otherUser: {
        id: otherUser?.id ?? "",
        name: otherUser?.name ?? "Unknown",
        email: otherUser?.email ?? "",
      },
      latestMessage: latestMessage
        ? {
            id: latestMessage.id,
            body: latestMessage.body,
            sentAt: latestMessage.sentAt.toISOString(),
            senderName: latestMessage.sender.name ?? "Unknown",
            senderId: latestMessage.sender.id,
            isFromMe: latestMessage.sender.id === userId,
          }
        : null,
      unreadCount,
      updatedAt: thread.updatedAt.toISOString(),
    };
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(32,28,64,0.7)_0%,_rgba(3,6,20,1)_60%)] pb-20 text-white">
      <DashboardNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-10 sm:px-6 lg:px-8">
        <BackLink href="/app" label="Back to dashboard" />

        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-200/80">Messages</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Your conversations</h1>
          <p className="max-w-2xl text-sm text-slate-300">
            Stay connected with {isPhotographer ? "clients" : "photographers"} and keep your projects moving forward.
          </p>
        </header>

        <MessagesInbox initialThreads={threadsWithUnread} currentUserId={userId} />
      </main>
    </div>
  );
}

