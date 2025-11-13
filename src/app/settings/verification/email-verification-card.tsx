"use client";

import { useState, useTransition, FormEvent } from "react";

type EmailVerificationCardProps = {
  email: string;
  verified: boolean;
  verifiedAt: string | null;
};

export default function EmailVerificationCard({ email, verified: initialVerified, verifiedAt }: EmailVerificationCardProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(initialVerified);

  function requestCode() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/verification/email/request", { method: "POST" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.message ?? "Unable to send code");
        return;
      }
      setCodeSent(true);
      setMessage("Verification code sent. Check your inbox—it expires in 10 minutes.");
    });
  }

  function submitCode(event: FormEvent) {
    event.preventDefault();
    if (!code.trim()) {
      setError("Enter the code you received");
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/verification/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(body.message ?? "Invalid code");
        return;
      }

      setVerified(true);
      setMessage("Email verified! You're now one step closer to the Momentrix badge.");
    });
  }

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">Email verification</h3>
        <p className="text-xs text-slate-400">Signed in as {email}</p>
        {verified && verifiedAt ? (
          <p className="text-xs text-emerald-300">Verified on {new Date(verifiedAt).toLocaleString()}</p>
        ) : null}
      </div>

      {verified ? (
        <p>Your email is confirmed. Photographers and clients will see your verified badge.</p>
      ) : (
        <>
          <p>
            Confirm your email to unlock full access. We’ll send a 6-digit code to your inbox—enter it below within 10 minutes.
          </p>
          <button
            type="button"
            onClick={requestCode}
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-soft-glow transition hover:from-brand-300 hover:to-brand-500 disabled:opacity-60"
          >
            {isPending ? "Sending..." : codeSent ? "Resend code" : "Send verification code"}
          </button>

          {codeSent ? (
            <form onSubmit={submitCode} className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="input sm:w-48"
                maxLength={6}
              />
              <button
                type="submit"
                disabled={isPending}
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100 disabled:opacity-60"
              >
                {isPending ? "Verifying..." : "Verify"}
              </button>
            </form>
          ) : null}
        </>
      )}

      {message ? <p className="text-xs text-emerald-300">{message}</p> : null}
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
