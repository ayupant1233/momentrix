import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const createSchema = z.object({
  title: z.string().min(3).max(140),
  content: z.string().max(2200).optional(),
  mediaUrls: z.array(z.string().url()).min(1).max(10),
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

    const profile = await prisma.photographerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json(
        { message: "Complete your photographer onboarding before publishing posts." },
        { status: 400 },
      );
    }

    const post = await prisma.post.create({
      data: {
        photographerId: profile.id,
        title: parsed.data.title,
        content: parsed.data.content,
        mediaUrls: parsed.data.mediaUrls,
      },
    });

    revalidatePath("/studio/posts");
    revalidatePath("/app");

    return NextResponse.json({
      post: {
        ...post,
        mediaUrls: (post.mediaUrls as string[]) ?? [],
        createdAt: post.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[PostsCreate]", error);
    return NextResponse.json({ message: "Unable to publish post" }, { status: 500 });
  }
}

