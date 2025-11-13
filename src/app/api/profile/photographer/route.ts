import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const payloadSchema = z.object({
  headline: z.string().min(4).max(120),
  bio: z.string().min(20).max(1500),
  city: z.string().min(2).max(120),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  travelRadiusKm: z.number().int().min(1).max(500),
  hourlyRate: z.number().int().min(500).max(200000),
  halfDayRate: z.number().int().min(500).max(400000),
  fullDayRate: z.number().int().min(500).max(600000),
  currency: z.string().length(3).default("INR"),
  instagramHandle: z.string().optional(),
  websiteUrl: z.string().url().or(z.literal("")).optional(),
  services: z.array(z.string().min(2)).min(1).max(12),
  tags: z.array(z.string().min(2)).min(1).max(20),
  phone: z
    .string()
    .min(8, "Provide a reachable phone number")
    .max(20, "Phone number looks too long")
    .optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== UserRole.PHOTOGRAPHER) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.photographerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        select: {
          phone: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== UserRole.PHOTOGRAPHER) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = payloadSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid data" },
        { status: 400 },
      );
    }

    const data = parsed.data;

    await prisma.$transaction([
      prisma.photographerProfile.update({
        where: { userId: session.user.id },
        data: {
          headline: data.headline,
          bio: data.bio,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude,
          travelRadiusKm: data.travelRadiusKm,
          hourlyRate: data.hourlyRate,
          halfDayRate: data.halfDayRate,
          fullDayRate: data.fullDayRate,
          currency: data.currency,
          instagramHandle: data.instagramHandle,
          websiteUrl: data.websiteUrl,
          services: data.services,
          tags: data.tags,
        },
      }),
      ...(data.phone !== undefined
        ? [
            prisma.user.update({
              where: { id: session.user.id },
              data: {
                phone: data.phone,
              },
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PhotographerProfileUpdate]", error);
    return NextResponse.json({ message: "Could not update profile" }, { status: 500 });
  }
}

