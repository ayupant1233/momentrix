"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

type ChatComposerProps = {
  bookingId: string;
};

export default function ChatComposer({ bookingId }: ChatComposerProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (body: string) => {
      const res = await fetch(`/api/bookings/${bookingId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.message ?? "Failed to send message");
      }
      return payload;
    },
    onSuccess: () => {
      setMessage("");
      router.refresh();
      setError(null);
    },
    onError: (err) => {
      setError((err as Error).message);
    },
  });

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!message.trim()) {
          setError("Message cannot be empty");
          return;
        }
        mutation.mutate(message.trim());
      }}
    >
      <textarea
        className="input min-h-[120px] resize-none"
        placeholder="Share updates, confirm details, or ask questions..."
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      {error ? <span className="text-xs text-rose-400">{error}</span> : null}
      <button
        type="submit"
        disabled={mutation.isPending}
        className="self-end rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-soft-glow transition hover:from-brand-300 hover:to-brand-500 disabled:opacity-60"
      >
        {mutation.isPending ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}

