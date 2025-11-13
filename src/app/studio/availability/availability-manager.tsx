"use client";

import { useMemo, useState, useTransition } from "react";
import clsx from "clsx";

type Settings = {
  travelRadiusKm: number;
  hourlyRate: number | null;
  halfDayRate: number | null;
  fullDayRate: number | null;
  currency: string;
  responseTimeHrs: number;
};

type AvailabilitySlot = {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
};

type SettingsFormState = {
  travelRadiusKm: string;
  hourlyRate: string;
  halfDayRate: string;
  fullDayRate: string;
  currency: string;
  responseTimeHrs: string;
};

type SlotFormState = {
  startTime: string;
  endTime: string;
};

type Props = {
  initialSettings: Settings;
  initialSlots: AvailabilitySlot[];
};

const currencyOptions = ["INR", "USD", "GBP", "EUR", "AED"] as const;

export default function AvailabilityManager({ initialSettings, initialSlots }: Props) {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [settingsForm, setSettingsForm] = useState<SettingsFormState>({
    travelRadiusKm: initialSettings.travelRadiusKm.toString(),
    hourlyRate: initialSettings.hourlyRate ? initialSettings.hourlyRate.toString() : "",
    halfDayRate: initialSettings.halfDayRate ? initialSettings.halfDayRate.toString() : "",
    fullDayRate: initialSettings.fullDayRate ? initialSettings.fullDayRate.toString() : "",
    currency: initialSettings.currency,
    responseTimeHrs: initialSettings.responseTimeHrs.toString(),
  });

  const [slots, setSlots] = useState<AvailabilitySlot[]>(initialSlots);
  const [slotForm, setSlotForm] = useState<SlotFormState>({ startTime: "", endTime: "" });

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slotMessage, setSlotMessage] = useState<string | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);

  const [isSavingSettings, startSavingSettings] = useTransition();
  const [isMutatingSlots, startMutatingSlots] = useTransition();

  const nextFourWeeks = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
    return slots.slice(0, 6).map((slot) => ({
      id: slot.id,
      isBooked: slot.isBooked,
      range: `${formatter.format(new Date(slot.startTime))} → ${formatter.format(new Date(slot.endTime))}`,
    }));
  }, [slots]);

  function handleSettingsChange<K extends keyof SettingsFormState>(key: K, value: string) {
    setSettingsForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSlotChange<K extends keyof SlotFormState>(key: K, value: string) {
    setSlotForm((prev) => ({ ...prev, [key]: value }));
  }

  function submitSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const payload: Record<string, unknown> = {};

    if (settingsForm.travelRadiusKm.trim()) {
      payload.travelRadiusKm = Number.parseInt(settingsForm.travelRadiusKm, 10);
    }
    if (settingsForm.hourlyRate.trim()) {
      payload.hourlyRate = Number.parseInt(settingsForm.hourlyRate, 10);
    }
    if (settingsForm.halfDayRate.trim()) {
      payload.halfDayRate = Number.parseInt(settingsForm.halfDayRate, 10);
    }
    if (settingsForm.fullDayRate.trim()) {
      payload.fullDayRate = Number.parseInt(settingsForm.fullDayRate, 10);
    }
    if (settingsForm.responseTimeHrs.trim()) {
      payload.responseTimeHrs = Number.parseInt(settingsForm.responseTimeHrs, 10);
    }
    if (settingsForm.currency) {
      payload.currency = settingsForm.currency;
    }

    if (Object.keys(payload).length === 0) {
      setError("Adjust something before saving.");
      return;
    }

    startSavingSettings(async () => {
      try {
        const response = await fetch("/api/studio/availability/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.message ?? "Unable to update settings");
        }

        setSettings(json.settings as Settings);
        setMessage("Availability settings updated.");
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unable to update settings");
      }
    });
  }

  function submitSlot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSlotMessage(null);
    setSlotError(null);

    if (!slotForm.startTime || !slotForm.endTime) {
      setSlotError("Select both a start and end time.");
      return;
    }

    const start = new Date(slotForm.startTime);
    const end = new Date(slotForm.endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setSlotError("Invalid date range.");
      return;
    }

    if (start >= end) {
      setSlotError("End time must be after the start time.");
      return;
    }

    startMutatingSlots(async () => {
      try {
        const response = await fetch("/api/studio/availability/slots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startTime: start.toISOString(),
            endTime: end.toISOString(),
          }),
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.message ?? "Unable to publish slot");
        }

        setSlots((prev) =>
          [...prev, json.slot as AvailabilitySlot].sort(
            (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
          ),
        );
        setSlotForm({ startTime: "", endTime: "" });
        setSlotMessage("Availability slot published.");
      } catch (err) {
        console.error(err);
        setSlotError(err instanceof Error ? err.message : "Unable to publish slot");
      }
    });
  }

  function deleteSlot(id: string) {
    setSlotMessage(null);
    setSlotError(null);

    startMutatingSlots(async () => {
      try {
        const response = await fetch(`/api/studio/availability/slots/${id}`, {
          method: "DELETE",
        });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(json.message ?? "Unable to delete slot");
        }
        setSlots((prev) => prev.filter((slot) => slot.id !== id));
        setSlotMessage("Slot removed.");
      } catch (err) {
        console.error(err);
        setSlotError(err instanceof Error ? err.message : "Unable to delete slot");
      }
    });
  }

  const formatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }),
    [],
  );

  return (
    <div className="space-y-8">
      <section className="rounded-4xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-white">Travel & pricing</h2>
        <p className="mb-4 text-sm text-slate-300">
          These rates power booking recommendations and quote summaries for clients.
        </p>
        <form onSubmit={submitSettings} className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="travelRadiusKm" className="text-sm font-medium text-slate-200">
              Travel radius (km)
            </label>
            <input
              id="travelRadiusKm"
              type="number"
              min={1}
              max={500}
              value={settingsForm.travelRadiusKm}
              onChange={(event) => handleSettingsChange("travelRadiusKm", event.target.value)}
              className="input"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="currency" className="text-sm font-medium text-slate-200">
              Currency
            </label>
            <select
              id="currency"
              value={settingsForm.currency}
              onChange={(event) => handleSettingsChange("currency", event.target.value)}
              className="input"
            >
              {currencyOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="responseTimeHrs" className="text-sm font-medium text-slate-200">
              Avg response time (hours)
            </label>
            <input
              id="responseTimeHrs"
              type="number"
              min={1}
              max={240}
              value={settingsForm.responseTimeHrs}
              onChange={(event) => handleSettingsChange("responseTimeHrs", event.target.value)}
              className="input"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="hourlyRate" className="text-sm font-medium text-slate-200">
              Hourly rate
            </label>
            <input
              id="hourlyRate"
              type="number"
              min={0}
              value={settingsForm.hourlyRate}
              onChange={(event) => handleSettingsChange("hourlyRate", event.target.value)}
              className="input"
              placeholder="e.g. 6000"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="halfDayRate" className="text-sm font-medium text-slate-200">
              Half-day (4 hrs)
            </label>
            <input
              id="halfDayRate"
              type="number"
              min={0}
              value={settingsForm.halfDayRate}
              onChange={(event) => handleSettingsChange("halfDayRate", event.target.value)}
              className="input"
              placeholder="e.g. 18000"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="fullDayRate" className="text-sm font-medium text-slate-200">
              Full-day (8 hrs)
            </label>
            <input
              id="fullDayRate"
              type="number"
              min={0}
              value={settingsForm.fullDayRate}
              onChange={(event) => handleSettingsChange("fullDayRate", event.target.value)}
              className="input"
              placeholder="e.g. 32000"
            />
          </div>
          <div className="md:col-span-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-soft-glow transition hover:from-brand-300 hover:to-brand-500 disabled:opacity-60"
            >
              {isSavingSettings ? "Saving..." : "Save availability settings"}
            </button>
            {message ? <span className="text-xs text-emerald-300">{message}</span> : null}
            {error ? <span className="text-xs text-rose-300">{error}</span> : null}
          </div>
        </form>
        <dl className="mt-6 grid gap-4 text-xs text-slate-400 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <dt className="uppercase tracking-wide">Travel radius</dt>
            <dd className="mt-1 text-base font-semibold text-white">{settings.travelRadiusKm} km</dd>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <dt className="uppercase tracking-wide">Rates</dt>
            <dd className="mt-1 space-y-1 text-sm">
              {settings.hourlyRate ? (
                <span className="block">
                  Hourly: {settings.currency} {settings.hourlyRate.toLocaleString()}
                </span>
              ) : null}
              {settings.halfDayRate ? (
                <span className="block">
                  Half-day: {settings.currency} {settings.halfDayRate.toLocaleString()}
                </span>
              ) : null}
              {settings.fullDayRate ? (
                <span className="block">
                  Full-day: {settings.currency} {settings.fullDayRate.toLocaleString()}
                </span>
              ) : null}
              {!settings.hourlyRate && !settings.halfDayRate && !settings.fullDayRate ? (
                <span className="block text-slate-500">Add your rates to appear in pricing filters.</span>
              ) : null}
            </dd>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <dt className="uppercase tracking-wide">Currency</dt>
            <dd className="mt-1 text-base font-semibold text-white">{settings.currency}</dd>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <dt className="uppercase tracking-wide">Response time</dt>
            <dd className="mt-1 text-base font-semibold text-white">~{settings.responseTimeHrs} hrs</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-4xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-white">Availability slots</h2>
        <p className="mb-4 text-sm text-slate-300">
          Publish open slots so clients can lock in dates that work for you. Booked slots cannot be deleted.
        </p>
        <form onSubmit={submitSlot} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="slotStart" className="text-sm font-medium text-slate-200">
              Start time
            </label>
            <input
              id="slotStart"
              type="datetime-local"
              value={slotForm.startTime}
              onChange={(event) => handleSlotChange("startTime", event.target.value)}
              className="input"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="slotEnd" className="text-sm font-medium text-slate-200">
              End time
            </label>
            <input
              id="slotEnd"
              type="datetime-local"
              value={slotForm.endTime}
              onChange={(event) => handleSlotChange("endTime", event.target.value)}
              className="input"
              required
            />
          </div>
          <div className="md:col-span-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={isMutatingSlots}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-soft-glow transition hover:from-brand-300 hover:to-brand-500 disabled:opacity-60"
            >
              {isMutatingSlots ? "Publishing..." : "Add availability slot"}
            </button>
            {slotMessage ? <span className="text-xs text-emerald-300">{slotMessage}</span> : null}
            {slotError ? <span className="text-xs text-rose-300">{slotError}</span> : null}
          </div>
        </form>

        {slots.length === 0 ? (
          <p className="mt-6 text-sm text-slate-300">
            No open slots yet. Add a few upcoming windows so clients can see when you are free.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {slots.map((slot) => (
              <article
                key={slot.id}
                className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">
                    {formatter.format(new Date(slot.startTime))}
                  </p>
                  <span className="text-xs text-slate-400">→ {formatter.format(new Date(slot.endTime))}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{slot.isBooked ? "Reserved" : "Open"}</span>
                  {!slot.isBooked ? (
                    <button
                      type="button"
                      onClick={() => deleteSlot(slot.id)}
                      className={clsx(
                        "rounded-full border border-rose-400/40 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:border-rose-400 hover:text-rose-100",
                        { "opacity-60": isMutatingSlots },
                      )}
                      disabled={isMutatingSlots}
                    >
                      Remove slot
                    </button>
                  ) : (
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-emerald-200">
                      Linked to booking
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {nextFourWeeks.length > 0 ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
            <p className="text-sm font-semibold text-white">Upcoming highlights</p>
            <ul className="mt-2 space-y-2">
              {nextFourWeeks.map((highlight) => (
                <li key={highlight.id} className="flex items-center justify-between gap-3">
                  <span>{highlight.range}</span>
                  <span className={highlight.isBooked ? "text-emerald-300" : "text-brand-200"}>
                    {highlight.isBooked ? "Booked" : "Open"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}

