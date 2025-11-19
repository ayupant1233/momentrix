import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "CLIENT") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { photographerId } = (await request.json()) as { photographerId?: string };

    if (!photographerId) {
      return NextResponse.json({ message: "photographerId is required" }, { status: 400 });
    }

    await prisma.photographerFollow.upsert({
      where: {
        clientId_photographerId: {
          clientId: session.user.id,
          photographerId,
        },
      },
      create: {
        clientId: session.user.id,
        photographerId,
      },
      update: {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FollowPhotographer]", error);
    return NextResponse.json({ message: "Unable to shortlist photographer" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "CLIENT") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { photographerId } = (await request.json()) as { photographerId?: string };

    if (!photographerId) {
      return NextResponse.json({ message: "photographerId is required" }, { status: 400 });
    }

    await prisma.photographerFollow.deleteMany({
      where: {
        clientId: session.user.id,
        photographerId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[UnfollowPhotographer]", error);
    return NextResponse.json({ message: "Unable to remove photographer" }, { status: 500 });
  }
}

