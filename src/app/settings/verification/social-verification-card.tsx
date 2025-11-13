"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { SocialProvider, VerificationStatus } from "@prisma/client";

type SocialAccount = {
  provider: SocialProvider;
  handle: string;
  displayName: string | null;
  followerCount: number;
  profileUrl: string | null;
  verifiedAt: string | null;
  updatedAt: string;
};

type Props = {
  accounts: SocialAccount[];
  role: "CLIENT" | "PHOTOGRAPHER" | "ADMIN";
  emailVerified: boolean;
  verificationStatus: VerificationStatus | null;
};

const PROVIDER_META: Record<
  SocialProvider,
  {
    label: string;
    description: string;
    threshold: number;
    connectUrl: string;
  }
> = {
  INSTAGRAM: {
    label: "Instagram",
    description: "Connect a business or creator account with 200+ followers.",
    threshold: 200,
    connectUrl: "/api/verification/social/meta/start?provider=instagram",
  },
  FACEBOOK: {
    label: "Facebook",
    description: "Verify a Facebook Page with 200+ followers or likes.",
    threshold: 200,
    connectUrl: "/api/verification/social/meta/start?provider=facebook",
  },
  X: {
    label: "X (Twitter)",
    description: "Connect your X account with at least 50 followers.",
    threshold: 50,
    connectUrl: "/api/verification/social/x/start",
  },
};

function computeStatus(account: SocialAccount | undefined, threshold: number) {
  if (!account) return { state: "missing" as const, message: "Not connected yet." };
  if (account.followerCount >= threshold) {
    return {
      state: "verified" as const,
      message: `Verified with ${account.followerCount.toLocaleString()} followers.`,
    };
  }
  return {
    state: "insufficient" as const,
    message: `Connected, but only ${account.followerCount.toLocaleString()} followers. Grow past ${threshold} for full verification.`,
  };
}

export default function SocialVerificationCard({ accounts, role, emailVerified, verificationStatus }: Props) {
  const accountMap = useMemo(() => {
    return accounts.reduce<Record<SocialProvider, SocialAccount>>((acc, account) => {
      acc[account.provider] = account;
      return acc;
    }, {} as Record<SocialProvider, SocialAccount>);
  }, [accounts]);

  const overallStatus = useMemo(() => {
    const hasQualified = accounts.some((account) => {
      const meta = PROVIDER_META[account.provider];
      return account.followerCount >= meta.threshold;
    });
    if (!emailVerified) {
      return {
        tone: "warning" as const,
        title: "Verify your email first",
        body: "Complete the OTP verification to unlock social linking and the Momentrix badge.",
      };
    }
    if (role !== "PHOTOGRAPHER") {
      return {
        tone: "info" as const,
        title: "Social badges are optional",
        body: "Link socials if you want clients to see your verified presence. Photographers must meet follower thresholds.",
      };
    }
    if (hasQualified && verificationStatus === "APPROVED") {
      return {
        tone: "success" as const,
        title: "You’re fully verified",
        body: "Your profile now shows the Momentrix verification badge across discovery and bookings.",
      };
    }
    return {
      tone: "warning" as const,
      title: "Almost there",
      body: "Connect Instagram, Facebook, or X with enough followers to earn the badge. Clients prefer verified photographers.",
    };
  }, [accounts, emailVerified, role, verificationStatus]);

  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Social verification</h2>
          <p className="text-sm text-slate-300">
            Link Instagram, Facebook, or X so clients know they&apos;re working with a trusted creator.
          </p>
        </div>
        <Link
          href="/portfolio"
          className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-brand-300/60 hover:text-brand-100"
        >
          See verified work
        </Link>
      </header>

      <div
        className={`rounded-3xl border p-4 text-sm ${
          overallStatus.tone === "success"
            ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-100"
            : overallStatus.tone === "warning"
              ? "border-amber-400/60 bg-amber-500/10 text-amber-100"
              : "border-brand-400/60 bg-brand-500/10 text-brand-100"
        }`}
      >
        <p className="font-semibold uppercase tracking-wide">{overallStatus.title}</p>
        <p className="mt-1 text-xs opacity-90">{overallStatus.body}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(Object.keys(PROVIDER_META) as SocialProvider[]).map((provider) => {
          const meta = PROVIDER_META[provider];
          const account = accountMap[provider];
          const status = computeStatus(account, meta.threshold);
          return (
            <article key={provider} className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-white">{meta.label}</p>
                  <p className="text-xs text-slate-400">{meta.description}</p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-wide ${
                    status.state === "verified"
                      ? "border-emerald-400/60 text-emerald-200"
                      : status.state === "insufficient"
                        ? "border-amber-400/60 text-amber-200"
                        : "border-white/10 text-slate-400"
                  }`}
                >
                  {status.state === "verified"
                    ? "Verified"
                    : status.state === "insufficient"
                      ? "Needs growth"
                      : "Not linked"}
                </span>
              </div>
              <p className="text-xs text-slate-400">{status.message}</p>
              {account?.profileUrl ? (
                <a
                  href={account.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-200"
                >
                  View profile →
                </a>
              ) : null}
              <div className="mt-auto flex flex-wrap gap-2 text-xs">
                <Link
                  href={meta.connectUrl}
                  className="rounded-full border border-white/15 px-4 py-2 font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                >
                  {account ? "Reconnect" : "Connect"}
                </Link>
                {account?.verifiedAt ? (
                  <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-400">
                    Checked {new Date(account.updatedAt).toLocaleDateString()}
                  </span>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

