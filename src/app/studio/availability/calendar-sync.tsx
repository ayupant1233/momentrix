"use client";

import { useState } from "react";
import clsx from "clsx";

type CalendarProvider = "google" | "outlook" | "apple";

type CalendarSyncProps = {
  isConnected: boolean;
  provider: CalendarProvider | null;
};

export function CalendarSync({ isConnected, provider }: CalendarSyncProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const providers: Array<{ id: CalendarProvider; name: string; icon: string }> = [
    { id: "google", name: "Google Calendar", icon: "📅" },
    { id: "outlook", name: "Outlook", icon: "📆" },
    { id: "apple", name: "Apple Calendar", icon: "🍎" },
  ];

  async function handleConnect(providerId: CalendarProvider) {
    setIsConnecting(true);
    // Placeholder for calendar sync integration
    // In production, this would:
    // 1. Redirect to OAuth flow for the calendar provider
    // 2. Store access tokens securely
    // 3. Set up webhooks/sync to keep calendars in sync
    setTimeout(() => {
      setIsConnecting(false);
      alert(
        `Calendar sync with ${providers.find((p) => p.id === providerId)?.name} is coming soon! This feature will automatically sync your availability slots with your calendar.`,
      );
    }, 1000);
  }

  function handleDisconnect() {
    // Placeholder for disconnect
    alert("Calendar sync disconnect is coming soon!");
  }

  return (
    <div className="rounded-4xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">Calendar Sync</h3>
          <p className="mt-2 text-sm text-slate-300">
            Connect your calendar to automatically sync availability and prevent double bookings.
          </p>
          {isConnected && provider ? (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-brand-400/40 bg-brand-500/10 px-4 py-3">
              <span className="text-2xl">
                {providers.find((p) => p.id === provider)?.icon ?? "📅"}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">
                  Connected to {providers.find((p) => p.id === provider)?.name}
                </p>
                <p className="text-xs text-slate-300">Your calendar is syncing automatically</p>
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:border-rose-400/60 hover:text-rose-300"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {providers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleConnect(p.id)}
                  disabled={isConnecting}
                  className={clsx(
                    "flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition",
                    "hover:border-brand-400/60 hover:bg-white/10",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  <span className="text-2xl">{p.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{p.name}</p>
                    <p className="text-xs text-slate-400">Connect</p>
                  </div>
                  {isConnecting ? (
                    <svg
                      className="h-4 w-4 animate-spin text-slate-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      aria-hidden
                      className="text-slate-400"
                    >
                      <path
                        fill="currentColor"
                        d="M5.5 4.5L10.5 9.5L5.5 14.5L4.5 13.5L8 10L4.5 6.5L5.5 4.5Z"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-400">
        💡 <strong>Coming soon:</strong> Automatic two-way sync between your calendar and Momentrix availability.
        Bookings will be added to your calendar, and existing calendar events will block availability.
      </p>
    </div>
  );
}

