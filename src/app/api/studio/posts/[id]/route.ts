import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== UserRole.PHOTOGRAPHER) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const profile = await prisma.photographerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { photographerId: true },
    });

    if (!post || post.photographerId !== profile.id) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    await prisma.post.delete({ where: { id } });

    revalidatePath("/studio/posts");
    revalidatePath("/app");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PostsDelete]", error);
    return NextResponse.json({ message: "Unable to delete post" }, { status: 500 });
  }
}

