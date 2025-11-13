import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const requestSchema = z.object({
  eventName: z.string().min(3),
  eventType: z.string().min(3),
  location: z.string().min(3),
  latitude: z.number(),
  longitude: z.number(),
  startTime: z.string(),
  endTime: z.string(),
  hoursRequested: z.number().min(1),
  notes: z.string().optional(),
  deliverables: z.string().optional(),
  initialMessage: z.string().min(12),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "CLIENT") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const data = requestSchema.parse(payload);

    const bookingRequest = await prisma.bookingRequest.create({
      data: {
        clientId: session.user.id,
        eventName: data.eventName,
        eventType: data.eventType,
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        hoursRequested: data.hoursRequested,
        notes: data.notes,
        deliverables: data.deliverables,
        initialMessage: data.initialMessage,
      },
    });

    return NextResponse.json({ success: true, request: bookingRequest });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
    }
    console.error("Booking request creation failed", error);
    return NextResponse.json({ message: "Unable to submit request" }, { status: 500 });
  }
}
