"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

const schema = z.object({
  eventName: z.string().min(3, "Name your project"),
  eventType: z.string().min(3, "Describe the type of shoot"),
  location: z.string().min(3, "Share the shoot location"),
  latitude: z.string().min(1, "Latitude required"),
  longitude: z.string().min(1, "Longitude required"),
  startDate: z.string().min(1, "Pick a start time"),
  endDate: z.string().min(1, "Pick an end time"),
  hoursRequested: z.string().min(1, "Specify duration"),
  notes: z.string().optional(),
  deliverables: z.string().optional(),
  initialMessage: z.string().min(12, "Introduce your project to the photographer"),
});

type FormValues = z.infer<typeof schema>;

type BookingFormProps = {
  defaultLatitude: number | null;
  defaultLongitude: number | null;
};

export default function BookingForm({
  defaultLatitude,
  defaultLongitude,
}: BookingFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [defaultDates] = useState(() => ({
    start: new Date().toISOString().slice(0, 16),
    end: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
  }));
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      latitude: defaultLatitude?.toString() ?? "",
      longitude: defaultLongitude?.toString() ?? "",
      startDate: defaultDates.start,
      endDate: defaultDates.end,
      hoursRequested: "4",
    },
  });

  function handleDetectLocation() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported in this browser.");
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue("latitude", position.coords.latitude.toFixed(6));
        setValue("longitude", position.coords.longitude.toFixed(6));
        setGeoLoading(false);
      },
      () => {
        setGeoError("Unable to fetch location. Allow access and try again.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const response = await fetch("/api/bookings/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName: values.eventName,
        eventType: values.eventType,
        location: values.location,
        latitude: Number(values.latitude),
        longitude: Number(values.longitude),
        startTime: new Date(values.startDate).toISOString(),
        endTime: new Date(values.endDate).toISOString(),
        hoursRequested: Number(values.hoursRequested),
        notes: values.notes,
        deliverables: values.deliverables,
        initialMessage: values.initialMessage,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setServerError(payload.message ?? "Could not create booking.");
      return;
    }

    router.push(`/bookings/recommendations/${payload.request.id}`);
  });

  return (
    <div className="space-y-10 rounded-4xl border border-white/10 bg-white/5 p-10">
      <header className="space-y-2">
        <p className="chip w-fit">Booking brief</p>
        <h1 className="text-3xl font-semibold text-white">Create a project request</h1>
        <p className="text-sm text-slate-300">
          Provide your shoot details so we can match you with nearby photographers.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-8">
        <section className="grid gap-6 md:grid-cols-2">
          <Field label="Event / project name" error={errors.eventName?.message}>
            <input type="text" className="input" placeholder="Megha & Aarav Sangeet" {...register("eventName")} />
          </Field>
          <Field label="Shoot type" error={errors.eventType?.message}>
            <input
              type="text"
              className="input"
              placeholder="Wedding Sangeet | Stage coverage | After movie"
              {...register("eventType")}
            />
          </Field>
          <Field label="Location" error={errors.location?.message}>
            <input
              type="text"
              className="input"
              placeholder="The Tamarind Tree, Bengaluru"
              {...register("location")}
            />
          </Field>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Field label="Latitude" error={errors.latitude?.message}>
            <input type="text" className="input" {...register("latitude")} />
          </Field>
          <Field label="Longitude" error={errors.longitude?.message}>
            <input type="text" className="input" {...register("longitude")} />
          </Field>
          <div className="flex flex-col gap-2 text-sm text-slate-200 md:col-span-2">
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={geoLoading}
              className="w-full rounded-full border border-brand-300/60 px-4 py-3 text-sm font-semibold text-brand-100 transition hover:bg-brand-500/10 disabled:opacity-60 sm:w-auto"
            >
              {geoLoading ? "Detecting current location..." : "Use my current location"}
            </button>
            {geoError ? <span className="text-xs text-rose-400">{geoError}</span> : null}
            <span className="text-xs text-slate-500">
              If the shoot is elsewhere, drop a pin on Google Maps and paste those coordinates here.
            </span>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Field label="Start time" error={errors.startDate?.message}>
            <input type="datetime-local" className="input" {...register("startDate")} />
          </Field>
          <Field label="End time" error={errors.endDate?.message}>
            <input type="datetime-local" className="input" {...register("endDate")} />
          </Field>
        </section>

        <section className="grid gap-6 md:grid-cols-1">
          <Field label="Hours requested" error={errors.hoursRequested?.message}>
            <input type="number" className="input" {...register("hoursRequested")} />
          </Field>
        </section>

        <Field label="Notes for the photographer" error={errors.notes?.message}>
          <textarea
            rows={4}
            className="input resize-none"
            placeholder="Share moodboards, references, or important instructions..."
            {...register("notes")}
          />
        </Field>

        <Field label="Expected deliverables" error={errors.deliverables?.message}>
          <textarea
            rows={3}
            className="input resize-none"
            placeholder="Number of photos, reels, albums, editing requirements..."
            {...register("deliverables")}
          />
        </Field>

        <Field label="Intro message" error={errors.initialMessage?.message}>
          <textarea
            rows={3}
            className="input resize-none"
            placeholder="Let the photographer know why you chose them and key requirements."
            {...register("initialMessage")}
          />
        </Field>

        {serverError ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
            {serverError}
          </div>
        ) : (
          <div className="rounded-2xl border border-brand-400/30 bg-brand-500/10 p-4 text-xs uppercase tracking-[0.2em] text-brand-100">
            Attach moodboards and references once the chat opens.
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-soft-glow transition hover:from-brand-300 hover:to-brand-500 disabled:opacity-60"
        >
          {isSubmitting ? "Submitting brief..." : "Find photographers"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-200">
      <span className="font-medium text-white">{label}</span>
      {children}
      {error ? <span className="text-xs text-rose-400">{error}</span> : null}
      {hint && !error ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

