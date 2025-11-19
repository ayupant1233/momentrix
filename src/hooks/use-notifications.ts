"use client";

import { useQuery } from "@tanstack/react-query";

/**
 * Hook to get unread message count for notifications
 */
export function useUnreadMessages() {
  const { data } = useQuery({
    queryKey: ["messages", "unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/messages/unread-count");
      if (!res.ok) return { count: 0 };
      const payload = await res.json();
      return { count: payload.count ?? 0 };
    },
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 10000,
  });

  return data?.count ?? 0;
}

/**
 * Hook to get notification summary (messages, bookings, etc.)
 */
export function useNotificationSummary() {
  const unreadMessages = useUnreadMessages();

  return {
    messages: unreadMessages,
    total: unreadMessages,
    hasNotifications: unreadMessages > 0,
  };
}

