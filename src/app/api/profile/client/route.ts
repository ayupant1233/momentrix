import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const payloadSchema = z.object({
  companyName: z.string().max(120).optional(),
  useCase: z.string().max(240).optional(),
  city: z.string().min(2).max(120),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  budgetMin: z.number().int().min(0).max(10000000).optional(),
  budgetMax: z.number().int().min(0).max(10000000).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== UserRole.CLIENT) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== UserRole.CLIENT) {
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

    await prisma.clientProfile.update({
      where: { userId: session.user.id },
      data,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ClientProfileUpdate]", error);
    return NextResponse.json({ message: "Could not update profile" }, { status: 500 });
  }
}

