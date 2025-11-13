import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { verifyEmailCode } from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  code: z.string().min(4).max(10),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid code" }, { status: 400 });
  }

  const success = await verifyEmailCode(session.user.id, parsed.data.code);

  if (!success) {
    return NextResponse.json({ message: "Invalid or expired code" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerifiedAt: true, role: true },
  });

  return NextResponse.json({ success: true, emailVerifiedAt: user?.emailVerifiedAt });
}
