import { prisma } from "./prisma";
import { hashPassword, verifyPassword } from "./password";
import { sendEmailVerificationCode } from "./mail";
import { recalculatePhotographerVerificationStatus } from "./verification-status";

const TOKEN_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export async function generateAndSendEmailVerification(userId: string, email: string) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const tokenHash = await hashPassword(code);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

  await prisma.emailVerificationToken.deleteMany({ where: { userId } });

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  await sendEmailVerificationCode(email, code);
}

export async function verifyEmailCode(userId: string, code: string) {
  const tokens = await prisma.emailVerificationToken.findMany({
    where: { userId, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  for (const token of tokens) {
    const isValid = await verifyPassword(code, token.tokenHash);
    if (isValid) {
      await prisma.$transaction([
        prisma.emailVerificationToken.update({
          where: { id: token.id },
          data: { consumedAt: new Date() },
        }),
        prisma.user.update({
          where: { id: userId },
          data: {
            emailVerifiedAt: new Date(),
            digilockerVerified: true,
          },
        }),
        prisma.emailVerificationToken.deleteMany({
          where: {
            userId,
            id: { not: token.id },
          },
        }),
      ]);
      await recalculatePhotographerVerificationStatus(userId);
      return true;
    }
  }

  return false;
}
