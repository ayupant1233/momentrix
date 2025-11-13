import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EmailVerificationCard from "./email-verification-card";
import SocialVerificationCard from "./social-verification-card";

export default async function VerificationSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/settings/verification");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      emailVerifiedAt: true,
      role: true,
      socialAccounts: {
        select: {
          provider: true,
          handle: true,
          displayName: true,
          followerCount: true,
          profileUrl: true,
          verifiedAt: true,
          updatedAt: true,
        },
      },
      photographerProfile: {
        select: {
          verificationStatus: true,
        },
      },
    },
  });

  if (!user?.email) {
    redirect("/app");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-16 text-slate-100">
      <header className="space-y-2">
        <p className="chip w-fit">Account verification</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Verify your identity</h1>
            <p className="text-sm text-slate-300">
              Confirm your email and link your socials so clients know they’re working with trusted creators.
            </p>
          </div>
          <Link
            href="/app"
            className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      <EmailVerificationCard
        email={user.email}
        verified={Boolean(user.emailVerifiedAt)}
        verifiedAt={user.emailVerifiedAt?.toISOString() ?? null}
      />

      <SocialVerificationCard
        accounts={user.socialAccounts.map((account) => ({
          provider: account.provider,
          handle: account.handle,
          displayName: account.displayName,
          followerCount: account.followerCount,
          profileUrl: account.profileUrl,
          verifiedAt: account.verifiedAt?.toISOString() ?? null,
          updatedAt: account.updatedAt.toISOString(),
        }))}
        role={user.role}
        emailVerified={Boolean(user.emailVerifiedAt)}
        verificationStatus={user.photographerProfile?.verificationStatus ?? null}
      />
    </div>
  );
}
