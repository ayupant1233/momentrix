import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const messageSchema = z.object({
  body: z.string().min(1).max(2000),
});

type RouteParams = {
  params: {
    id: string;
  };
};

export async function POST(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const booking = await prisma.booking.findFirst({
    where: {
      id: params.id,
      OR: [
        { clientId: session.user.id },
        { photographerId: session.user.id },
      ],
    },
    include: {
      thread: true,
    },
  });

  if (!booking || !booking.thread) {
    return NextResponse.json({ message: "Conversation not found" }, { status: 404 });
  }

  const json = await request.json();
  const parsed = messageSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid message" },
      { status: 400 },
    );
  }

  const message = await prisma.message.create({
    data: {
      threadId: booking.thread.id,
      senderId: session.user.id,
      body: parsed.data.body,
    },
    include: {
      sender: { select: { name: true } },
    },
  });

  return NextResponse.json({ message });
}

