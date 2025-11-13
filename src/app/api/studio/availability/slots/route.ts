import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const slotSchema = z
  .object({
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
  })
  .refine((data) => new Date(data.startTime) < new Date(data.endTime), {
    message: "End time must be after the start time.",
  });

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== UserRole.PHOTOGRAPHER) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = slotSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid payload" },
        { status: 400 },
      );
    }

    const profile = await prisma.photographerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    const startTime = new Date(parsed.data.startTime);
    const endTime = new Date(parsed.data.endTime);

    const overlap = await prisma.availabilitySlot.findFirst({
      where: {
        photographerId: profile.id,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (overlap) {
      return NextResponse.json(
        { message: "This slot overlaps with an existing availability window." },
        { status: 400 },
      );
    }

    const slot = await prisma.availabilitySlot.create({
      data: {
        photographerId: profile.id,
        startTime,
        endTime,
      },
    });

    revalidatePath("/studio/availability");
    revalidatePath("/app");

    return NextResponse.json({
      slot: {
        ...slot,
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
      },
    });
  } catch (error) {
    console.error("[AvailabilitySlotCreate]", error);
    return NextResponse.json({ message: "Unable to publish availability slot" }, { status: 500 });
  }
}

