"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ConfirmBookingButtonProps = {
  bookingRequestId: string;
  photographerId: string;
};

export default function ConfirmBookingButton({ bookingRequestId, photographerId }: ConfirmBookingButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    startTransition(async () => {
      setError(null);
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingRequestId, photographerId }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.message ?? "Unable to confirm booking");
        return;
      }

      router.push(`/bookings/${payload.booking.id}`);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleConfirm}
        disabled={pending}
        className="w-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-soft-glow transition hover:from-brand-300 hover:to-brand-500 disabled:opacity-60"
      >
        {pending ? "Sending request..." : "Request this photographer"}
      </button>
      {error ? <span className="text-xs text-rose-400">{error}</span> : null}
    </div>
  );
}
