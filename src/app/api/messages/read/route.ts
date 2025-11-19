import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { threadId } = (await request.json()) as { threadId?: string };

    if (!threadId) {
      return NextResponse.json({ message: "threadId is required" }, { status: 400 });
    }

    // Verify user has access to this thread
    const thread = await prisma.chatThread.findFirst({
      where: {
        id: threadId,
        OR: [{ clientId: session.user.id }, { photographerId: session.user.id }],
      },
    });

    if (!thread) {
      return NextResponse.json({ message: "Thread not found" }, { status: 404 });
    }

    // Mark all unread messages in this thread as read
    await prisma.message.updateMany({
      where: {
        threadId,
        senderId: { not: session.user.id },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MarkMessagesRead]", error);
    return NextResponse.json({ message: "Unable to mark messages as read" }, { status: 500 });
  }
}

