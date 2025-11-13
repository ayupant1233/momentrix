import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAndSendEmailVerification } from "@/lib/email-verification";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, emailVerifiedAt: true },
  });

  if (!user?.email) {
    return NextResponse.json({ message: "Email not found" }, { status: 400 });
  }

  if (user.emailVerifiedAt) {
    return NextResponse.json({ message: "Email already verified" }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ message: "Email provider not configured" }, { status: 500 });
  }

  try {
    await generateAndSendEmailVerification(user.id, user.email);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[EmailVerificationRequest]", error);
    return NextResponse.json({ message: "Unable to send verification code" }, { status: 500 });
  }
}
