import { VerificationStatus, SocialProvider } from "@prisma/client";
import { prisma } from "./prisma";

const SOCIAL_THRESHOLDS: Record<SocialProvider, number> = {
  INSTAGRAM: 200,
  FACEBOOK: 200,
  X: 50,
};

export async function recalculatePhotographerVerificationStatus(userId: string) {
  const data = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      emailVerifiedAt: true,
      photographerProfile: {
        select: {
          id: true,
          verificationStatus: true,
        },
      },
      socialAccounts: {
        select: {
          provider: true,
          followerCount: true,
          verifiedAt: true,
        },
      },
    },
  });

  if (!data?.photographerProfile) {
    return;
  }

  const emailVerified = Boolean(data.emailVerifiedAt);

  const meetsSocialRequirement = data.socialAccounts.some((account) => {
    const threshold = SOCIAL_THRESHOLDS[account.provider] ?? 0;
    return account.followerCount >= threshold;
  });

  const nextStatus =
    emailVerified && meetsSocialRequirement ? VerificationStatus.APPROVED : VerificationStatus.PENDING;

  await prisma.photographerProfile.update({
    where: { id: data.photographerProfile.id },
    data: {
      verificationStatus: nextStatus,
      verifiedAt: nextStatus === VerificationStatus.APPROVED ? new Date() : null,
    },
  });
}

export function getSocialThreshold(provider: SocialProvider) {
  return SOCIAL_THRESHOLDS[provider];
}

