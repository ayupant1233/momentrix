import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MediaType, UserRole } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const createSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(1000).optional(),
  mediaUrl: z.string().url(),
  mediaType: z.nativeEnum(MediaType),
  location: z.string().max(120).optional(),
  capturedAt: z.string().datetime().optional(),
  featured: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== UserRole.PHOTOGRAPHER) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = createSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid payload" },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const profile = await prisma.photographerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json(
        { message: "Complete your photographer onboarding before publishing work." },
        { status: 400 },
      );
    }

    const item = await prisma.portfolioItem.create({
      data: {
        photographerId: profile.id,
        title: data.title,
        description: data.description,
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
        location: data.location,
        capturedAt: data.capturedAt ? new Date(data.capturedAt) : undefined,
        featured: data.featured ?? false,
      },
    });

    revalidatePath("/studio/portfolio");
    revalidatePath("/app");

    return NextResponse.json({
      item: {
        ...item,
        capturedAt: item.capturedAt ? item.capturedAt.toISOString() : null,
        createdAt: item.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[PortfolioCreate]", error);
    return NextResponse.json({ message: "Unable to publish portfolio item" }, { status: 500 });
  }
}

