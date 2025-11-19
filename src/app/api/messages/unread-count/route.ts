import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ count: 0 });
  }

  const userId = session.user.id;
  const isPhotographer = session.user.role === "PHOTOGRAPHER";

  // Get all thread IDs for this user
  const threads = await prisma.chatThread.findMany({
    where: isPhotographer
      ? { photographerId: userId }
      : { clientId: userId },
    select: { id: true },
  });

  const threadIds = threads.map((t) => t.id);

  if (threadIds.length === 0) {
    return NextResponse.json({ count: 0 });
  }

  // Count unread messages
  const unreadCount = await prisma.message.count({
    where: {
      threadId: { in: threadIds },
      senderId: { not: userId },
      readAt: null,
    },
  });

  return NextResponse.json({ count: unreadCount });
}

