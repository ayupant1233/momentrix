import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const createSchema = z.object({
  bookingRequestId: z.string().cuid(),
  photographerId: z.string().cuid(),
});

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const bookings =
    session.user.role === UserRole.PHOTOGRAPHER
      ? await prisma.booking.findMany({
          where: { photographerId: session.user.id },
          orderBy: { createdAt: "desc" },
          include: {
            client: {
              select: { name: true, email: true },
            },
            thread: {
              include: {
                messages: {
                  orderBy: { sentAt: "desc" },
                  take: 1,
                  include: { sender: { select: { name: true } } },
                },
              },
            },
          },
        })
      : await prisma.booking.findMany({
          where: { clientId: session.user.id },
          orderBy: { createdAt: "desc" },
          include: {
            photographer: {
              select: { name: true, email: true },
            },
            thread: {
              include: {
                messages: {
                  orderBy: { sentAt: "desc" },
                  take: 1,
                  include: { sender: { select: { name: true } } },
                },
              },
            },
          },
        });

  return NextResponse.json({ bookings });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== UserRole.CLIENT) {
    return NextResponse.json({ message: "Only clients can create bookings" }, { status: 403 });
  }

  try {
    const json = await request.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid booking details" },
        { status: 400 },
      );
    }
    const data = parsed.data;

    const [bookingRequest, photographer] = await Promise.all([
      prisma.bookingRequest.findUnique({
        where: { id: data.bookingRequestId },
      }),
      prisma.user.findUnique({
        where: { id: data.photographerId, role: UserRole.PHOTOGRAPHER },
      }),
    ]);

    if (!bookingRequest || bookingRequest.clientId !== session.user.id) {
      return NextResponse.json({ message: "Booking request not found" }, { status: 404 });
    }

    if (!photographer) {
      return NextResponse.json({ message: "Photographer not found" }, { status: 404 });
    }

    if (bookingRequest.status === "BOOKED") {
      return NextResponse.json({ message: "Request already booked" }, { status: 400 });
    }

    const booking = await prisma.booking.create({
      data: {
        clientId: session.user.id,
        photographerId: data.photographerId,
        bookingRequestId: bookingRequest.id,
        eventName: bookingRequest.eventName,
        eventType: bookingRequest.eventType,
        location: bookingRequest.location,
        latitude: bookingRequest.latitude,
        longitude: bookingRequest.longitude,
        startTime: bookingRequest.startTime ?? undefined,
        endTime: bookingRequest.endTime ?? undefined,
        hoursRequested: bookingRequest.hoursRequested,
        notes: bookingRequest.notes,
        deliverables: bookingRequest.deliverables,
        status: "REQUESTED",
      },
      include: {
        client: { select: { name: true, email: true } },
        photographer: { select: { name: true, email: true } },
      },
    });

    const threadData = {
      clientId: session.user.id,
      photographerId: data.photographerId,
      bookingId: booking.id,
      messages: bookingRequest.initialMessage && bookingRequest.initialMessage.trim().length > 0
        ? {
            create: {
              senderId: session.user.id,
              body: bookingRequest.initialMessage.trim(),
            },
          }
        : undefined,
    } as const;

    await prisma.$transaction([
      prisma.bookingRequest.update({
        where: { id: bookingRequest.id },
        data: { status: "BOOKED" },
      }),
      prisma.chatThread.create({ data: threadData }),
    ]);

    const thread = await prisma.chatThread.findFirst({
      where: { bookingId: booking.id },
      include: {
        messages: {
          orderBy: { sentAt: "desc" },
          take: 1,
          include: { sender: { select: { name: true } } },
        },
      },
    });

    return NextResponse.json({ booking, thread });
  } catch (error) {
    console.error("[BookingCreate]", error);
    return NextResponse.json({ message: "Unable to create booking" }, { status: 500 });
  }
}

