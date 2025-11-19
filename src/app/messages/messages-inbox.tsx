"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";

type ThreadSummary = {
  id: string;
  bookingId: string | null;
  bookingName: string;
  bookingType: string | null;
  bookingStatus: string | null;
  otherUser: {
    id: string;
    name: string;
    email: string;
  };
  latestMessage: {
    id: string;
    body: string;
    sentAt: string;
    senderName: string;
    senderId: string;
    isFromMe: boolean;
  } | null;
  unreadCount: number;
  updatedAt: string;
};

type MessagesInboxProps = {
  initialThreads: ThreadSummary[];
  currentUserId: string;
};

export function MessagesInbox({ initialThreads, currentUserId }: MessagesInboxProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "bookings">("all");

  // Poll for new messages every 30 seconds
  const { data: threadsData } = useQuery({
    queryKey: ["messages", "threads"],
    queryFn: async () => {
      const res = await fetch("/api/messages/threads");
      if (!res.ok) throw new Error("Failed to load messages");
      return res.json() as Promise<{ threads: ThreadSummary[] }>;
    },
    initialData: { threads: initialThreads },
    refetchInterval: 30000, // 30 seconds
    staleTime: 10000, // 10 seconds
  });

  const threads = threadsData?.threads ?? initialThreads;

  const filteredThreads = useMemo(() => {
    let filtered = threads;

    // Apply filter
    if (filter === "unread") {
      filtered = filtered.filter((t) => t.unreadCount > 0);
    } else if (filter === "bookings") {
      filtered = filtered.filter((t) => t.bookingId != null);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.otherUser.name.toLowerCase().includes(query) ||
          t.bookingName.toLowerCase().includes(query) ||
          t.latestMessage?.body.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [threads, filter, searchQuery]);

  const totalUnread = useMemo(
    () => threads.reduce((sum, t) => sum + t.unreadCount, 0),
    [threads],
  );

  if (threads.length === 0) {
    return (
      <div className="rounded-4xl border border-white/10 bg-white/5 p-12 text-center">
        <p className="text-slate-300">No conversations yet.</p>
        <p className="mt-2 text-sm text-slate-400">
          Messages will appear here once you start a booking.
        </p>
        <Link
          href="/bookings"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-midnight-900"
        >
          View bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={clsx(
              "rounded-full border px-4 py-2 text-xs font-semibold transition",
              filter === "all"
                ? "border-brand-400/60 bg-brand-500/20 text-brand-100"
                : "border-white/15 text-slate-300 hover:border-white/25",
            )}
          >
            All ({threads.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={clsx(
              "rounded-full border px-4 py-2 text-xs font-semibold transition",
              filter === "unread"
                ? "border-brand-400/60 bg-brand-500/20 text-brand-100"
                : "border-white/15 text-slate-300 hover:border-white/25",
            )}
          >
            Unread {totalUnread > 0 ? `(${totalUnread})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setFilter("bookings")}
            className={clsx(
              "rounded-full border px-4 py-2 text-xs font-semibold transition",
              filter === "bookings"
                ? "border-brand-400/60 bg-brand-500/20 text-brand-100"
                : "border-white/15 text-slate-300 hover:border-white/25",
            )}
          >
            Bookings ({threads.filter((t) => t.bookingId != null).length})
          </button>
        </div>
        <input
          type="search"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
        />
      </div>

      {/* Threads list */}
      <div className="space-y-3">
        {filteredThreads.length === 0 ? (
          <div className="rounded-4xl border border-white/10 bg-white/5 p-12 text-center">
            <p className="text-slate-300">No conversations match your filters.</p>
          </div>
        ) : (
          filteredThreads.map((thread) => (
            <Link
              key={thread.id}
              href={thread.bookingId ? `/bookings/${thread.bookingId}` : `/messages/${thread.id}`}
              className="group block rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20 hover:bg-white/10"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-white">{thread.otherUser.name}</h3>
                    {thread.unreadCount > 0 ? (
                      <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs font-semibold text-white">
                        {thread.unreadCount}
                      </span>
                    ) : null}
                    {thread.bookingId ? (
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-400">
                        {thread.bookingName}
                      </span>
                    ) : null}
                  </div>
                  {thread.latestMessage ? (
                    <div className="space-y-1">
                      <p
                        className={clsx("text-sm line-clamp-2", {
                          "font-medium text-white": thread.unreadCount > 0,
                          "text-slate-300": thread.unreadCount === 0,
                        })}
                      >
                        {thread.latestMessage.isFromMe ? "You: " : ""}
                        {thread.latestMessage.body}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDistanceToNow(new Date(thread.latestMessage.sentAt), { addSuffix: true })}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No messages yet</p>
                  )}
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  aria-hidden
                  className="flex-shrink-0 text-slate-400 transition group-hover:text-brand-200"
                >
                  <path
                    fill="currentColor"
                    d="M7.5 4.5L13.5 10L7.5 15.5L6.5 14.5L11 10L6.5 5.5L7.5 4.5Z"
                  />
                </svg>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

