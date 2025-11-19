"use client";

import { useEffect } from "react";

type MarkReadProps = {
  threadId: string | null;
};

export function MarkRead({ threadId }: MarkReadProps) {
  useEffect(() => {
    if (!threadId) return;

    // Mark messages as read when component mounts
    fetch("/api/messages/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId }),
    }).catch((err) => {
      console.error("[MarkRead]", err);
    });
  }, [threadId]);

  return null;
}

