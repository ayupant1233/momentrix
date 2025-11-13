import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookingStatus, UserRole } from "@prisma/client";
import { z } from "zod";

const statusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
});

type RouteParams = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: RouteParams) {
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
      client: { select: { name: true, email: true } },
      photographer: { select: { name: true, email: true } },
      thread: {
        include: {
          messages: {
            orderBy: { sentAt: "asc" },
            include: {
              sender: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ message: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({ booking });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({ where: { id: params.id } });

  if (!booking) {
    return NextResponse.json({ message: "Booking not found" }, { status: 404 });
  }

  const isPhotographer = session.user.role === UserRole.PHOTOGRAPHER && booking.photographerId === session.user.id;
  const isClient = session.user.role === UserRole.CLIENT && booking.clientId === session.user.id;

  if (!isPhotographer && !isClient) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const json = await request.json();
  const parsed = statusSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid status" },
      { status: 400 },
    );
  }

  // Clients can cancel, photographers manage confirmations/progress.
  if (
    isClient &&
    !["CANCELLED", "REQUESTED"].includes(parsed.data.status)
  ) {
    return NextResponse.json({ message: "Clients can only cancel or re-request bookings." }, { status: 403 });
  }

  const updated = await prisma.booking.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ booking: updated });
}

