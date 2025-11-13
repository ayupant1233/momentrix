import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const settingsSchema = z
  .object({
    travelRadiusKm: z.number().int().min(1).max(500).optional(),
    hourlyRate: z.number().int().min(0).max(1_000_000).optional(),
    halfDayRate: z.number().int().min(0).max(2_000_000).optional(),
    fullDayRate: z.number().int().min(0).max(3_000_000).optional(),
    currency: z.string().length(3).optional(),
    responseTimeHrs: z.number().int().min(1).max(240).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Provide at least one field to update.",
  });

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== UserRole.PHOTOGRAPHER) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = settingsSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid payload" },
        { status: 400 },
      );
    }

    const profile = await prisma.photographerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    const { travelRadiusKm, hourlyRate, halfDayRate, fullDayRate, currency, responseTimeHrs } = parsed.data;

    if (travelRadiusKm !== undefined) updates.travelRadiusKm = travelRadiusKm;
    if (hourlyRate !== undefined) updates.hourlyRate = hourlyRate;
    if (halfDayRate !== undefined) updates.halfDayRate = halfDayRate;
    if (fullDayRate !== undefined) updates.fullDayRate = fullDayRate;
    if (currency !== undefined) updates.currency = currency;
    if (responseTimeHrs !== undefined) updates.responseTimeHrs = responseTimeHrs;

    const updated = await prisma.photographerProfile.update({
      where: { id: profile.id },
      data: updates,
      select: {
        travelRadiusKm: true,
        hourlyRate: true,
        halfDayRate: true,
        fullDayRate: true,
        currency: true,
        responseTimeHrs: true,
      },
    });

    revalidatePath("/studio/availability");
    revalidatePath("/app");

    return NextResponse.json({
      settings: {
        travelRadiusKm: updated.travelRadiusKm,
        hourlyRate: updated.hourlyRate ?? null,
        halfDayRate: updated.halfDayRate ?? null,
        fullDayRate: updated.fullDayRate ?? null,
        currency: updated.currency,
        responseTimeHrs: updated.responseTimeHrs ?? 24,
      },
    });
  } catch (error) {
    console.error("[AvailabilitySettings]", error);
    return NextResponse.json({ message: "Unable to update availability settings" }, { status: 500 });
  }
}

