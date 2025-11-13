import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { generateAndSendEmailVerification } from "@/lib/email-verification";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().min(2).max(80),
  role: z.nativeEnum(UserRole),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = registerSchema.safeParse(json);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid information provided";
      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    const { email, password, role, name } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Account already exists. Try signing in." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        ...(role === UserRole.CLIENT
          ? {
              clientProfile: {
                create: {},
              },
            }
          : {
              photographerProfile: {
                create: {},
              },
            }),
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
      },
    });

    try {
      await generateAndSendEmailVerification(user.id, user.email);
    } catch (error) {
      console.error("[Register] Failed to send verification email", error);
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Registration failed", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

