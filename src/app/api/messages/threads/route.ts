import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
      bookingType: thread.booking?.eventType,
      bookingStatus: thread.booking?.status,
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

  return NextResponse.json({ threads: threadsWithUnread });
}

