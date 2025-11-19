"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

const schema = z.object({
  eventName: z.string().min(3, "Name your project"),
  eventType: z.string().min(3, "Describe the type of shoot"),
  shootVibe: z.string().optional(),
  collaborators: z.string().optional(),
  location: z.string().min(3, "Share the shoot location"),
  latitude: z.string().min(1, "Latitude required"),
  longitude: z.string().min(1, "Longitude required"),
  startDate: z.string().min(1, "Pick a start time"),
  endDate: z.string().min(1, "Pick an end time"),
  hoursRequested: z.string().min(1, "Specify duration"),
  attendeeCount: z.string().optional(),
  budgetMin: z.string().optional(),
  budgetMax: z.string().optional(),
  notes: z.string().optional(),
  deliverables: z.string().optional(),
  preferredDelivery: z.string().optional(),
  references: z.string().optional(),
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
  const [step, setStep] = useState(0);
  const [defaultDates] = useState(() => ({
    start: new Date().toISOString().slice(0, 16),
    end: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
  }));
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    trigger,
    control,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      latitude: defaultLatitude?.toString() ?? "",
      longitude: defaultLongitude?.toString() ?? "",
      startDate: defaultDates.start,
      endDate: defaultDates.end,
      hoursRequested: "4",
      collaborators: "",
      shootVibe: "",
      attendeeCount: "",
      budgetMin: "",
      budgetMax: "",
      preferredDelivery: "",
      references: "",
    },
  });

  const watchedValues = useWatch({ control });

  const steps = useMemo(
    () => [
      {
        id: "project",
        title: "Project details",
        description: "Tell us what you’re planning so we can tee up the right creators.",
        fields: ["eventName", "eventType", "shootVibe", "collaborators"] as (keyof FormValues)[],
      },
      {
        id: "location",
        title: "Location & schedule",
        description: "Where and when will the shoot happen? Add precise coordinates for better matches.",
        fields: [
          "location",
          "latitude",
          "longitude",
          "startDate",
          "endDate",
          "hoursRequested",
        ] as (keyof FormValues)[],
      },
      {
        id: "requirements",
        title: "Logistics & deliverables",
        description: "Share budgets, deliverables, and any special requirements.",
        fields: [
          "attendeeCount",
          "budgetMin",
          "budgetMax",
          "deliverables",
          "preferredDelivery",
          "references",
          "notes",
        ] as (keyof FormValues)[],
      },
      {
        id: "introduction",
        title: "Introduce yourself",
        description: "Add a warm message. This helps photographers respond faster.",
        fields: ["initialMessage"] as (keyof FormValues)[],
      },
      {
        id: "review",
        title: "Review & submit",
        description: "Double-check the summary before sending your brief.",
        fields: [] as (keyof FormValues)[],
      },
    ],
    [],
  );

  const totalSteps = steps.length;
  const progressPercent = Math.round(((step + 1) / totalSteps) * 100);

  async function handleNext() {
    const currentFields = steps[step].fields;
    if (!currentFields.length || (await trigger(currentFields))) {
      setStep((prev) => Math.min(prev + 1, totalSteps - 1));
    }
  }

  function handleBack() {
    setStep((prev) => Math.max(prev - 1, 0));
  }

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
        notes: buildCombinedNotes(values),
        deliverables: buildDeliverables(values),
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

  const currentStep = steps[step];
  const summary = buildSummary(watchedValues);

  return (
    <div className="space-y-8 rounded-4xl border border-white/10 bg-white/5 p-8">
      <header className="space-y-4">
        <p className="chip w-fit">Booking brief</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Create a project request</h1>
            <p className="text-sm text-slate-300">
              A thoughtful brief helps us shortlist photographers who already align with your story.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={onSubmit} className="space-y-8">
          <div className="rounded-4xl border border-white/10 bg-white/5 p-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-200">Step {step + 1} of {totalSteps}</p>
              <h2 className="text-xl font-semibold text-white">{currentStep.title}</h2>
              <p className="text-sm text-slate-300">{currentStep.description}</p>
            </div>

            <div className="mt-6 space-y-6">
              {currentStep.id === "project" ? (
                <>
                  <Field label="Event / project name" error={errors.eventName?.message}>
                    <input type="text" className="input" placeholder="Megha & Aarav Sangeet" {...register("eventName")} />
                  </Field>
                  <Field label="Shoot type" hint="e.g. Wedding Sangeet | Stage coverage | After movie" error={errors.eventType?.message}>
                    <input type="text" className="input" placeholder="Wedding Sangeet | Stage coverage | After movie" {...register("eventType")} />
                  </Field>
                  <Field label="Vibe or story" hint="Share the mood, theme, colour palette, or any creative direction" error={errors.shootVibe?.message}>
                    <textarea rows={3} className="input resize-none" {...register("shootVibe")} placeholder="Warm, candid storytelling with cinematic highlights." />
                  </Field>
                  <Field label="Collaborators" hint="Add planners, stylists, or partners who should be looped in" error={errors.collaborators?.message}>
                    <input type="text" className="input" placeholder="Planner: Nyra Events, Stylist: Sana Kapoor" {...register("collaborators")} />
                  </Field>
                </>
              ) : null}

              {currentStep.id === "location" ? (
                <>
                  <Field label="Shoot location" error={errors.location?.message}>
                    <input type="text" className="input" placeholder="The Tamarind Tree, Bengaluru" {...register("location")} />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Latitude" error={errors.latitude?.message}>
                      <input type="text" className="input" {...register("latitude")} />
                    </Field>
                    <Field label="Longitude" error={errors.longitude?.message}>
                      <input type="text" className="input" {...register("longitude")} />
                    </Field>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={geoLoading}
                    className="inline-flex items-center justify-center rounded-full border border-brand-300/60 px-4 py-2 text-xs font-semibold text-brand-100 transition hover:bg-brand-500/10 disabled:opacity-60"
                  >
                    {geoLoading ? "Detecting current location..." : "Use my current location"}
                  </button>
                  {geoError ? <p className="text-xs text-rose-400">{geoError}</p> : null}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Start time" error={errors.startDate?.message}>
                      <input type="datetime-local" className="input" {...register("startDate")} />
                    </Field>
                    <Field label="End time" error={errors.endDate?.message}>
                      <input type="datetime-local" className="input" {...register("endDate")} />
                    </Field>
                  </div>
                  <Field label="Hours requested" hint="Estimate total coverage you might need" error={errors.hoursRequested?.message}>
                    <input type="number" min={1} className="input" {...register("hoursRequested")} />
                  </Field>
                </>
              ) : null}

              {currentStep.id === "requirements" ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Expected guests/attendees" error={errors.attendeeCount?.message}>
                      <input type="number" min={0} className="input" placeholder="e.g. 200" {...register("attendeeCount")} />
                    </Field>
                    <div className="flex items-center gap-4">
                      <Field label="Budget min (₹)" error={errors.budgetMin?.message}>
                        <input type="number" min={0} className="input" placeholder="₹" {...register("budgetMin")} />
                      </Field>
                      <Field label="Budget max (₹)" error={errors.budgetMax?.message}>
                        <input type="number" min={0} className="input" placeholder="₹" {...register("budgetMax")} />
                      </Field>
                    </div>
                  </div>
                  <Field label="Deliverables" hint="Number of photos, reels, albums, editing requirements..." error={errors.deliverables?.message}>
                    <textarea rows={2} className="input resize-none" {...register("deliverables")} />
                  </Field>
                  <Field label="Preferred delivery" hint="Online gallery, raw footage, teaser reel, albums, etc." error={errors.preferredDelivery?.message}>
                    <input type="text" className="input" {...register("preferredDelivery")} />
                  </Field>
                  <Field label="References or moodboards" hint="Paste any links to Pinterest, Drive folders, or inspiration" error={errors.references?.message}>
                    <textarea rows={2} className="input resize-none" {...register("references")} />
                  </Field>
                  <Field label="Notes for the photographer" hint="Logistics, venue rules, travel, dress code, etc." error={errors.notes?.message}>
                    <textarea rows={3} className="input resize-none" {...register("notes")} />
                  </Field>
                </>
              ) : null}

              {currentStep.id === "introduction" ? (
                <Field label="Intro message" error={errors.initialMessage?.message}>
                  <textarea
                    rows={6}
                    className="input resize-none"
                    placeholder="Let the photographer know why you chose them and key requirements."
                    {...register("initialMessage")}
                  />
                </Field>
              ) : null}

              {currentStep.id === "review" ? (
                <div className="space-y-4 text-sm text-slate-300">
                  <p>Review the summary below. You can step back to make edits before submitting.</p>
                  <ReviewCard summary={summary} />
                </div>
              ) : null}
            </div>
          </div>

          {serverError ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">{serverError}</div>
          ) : (
            <div className="rounded-2xl border border-brand-400/30 bg-brand-500/10 p-4 text-xs uppercase tracking-[0.2em] text-brand-100">
              Attach moodboards and references once the chat opens.
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 0}
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100 disabled:opacity-40"
            >
              Back
            </button>
            {step < totalSteps - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-6 py-2 text-sm font-semibold text-white shadow-soft-glow transition hover:from-brand-300 hover:to-brand-500"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-6 py-2 text-sm font-semibold text-white shadow-soft-glow transition hover:from-brand-300 hover:to-brand-500 disabled:opacity-60"
              >
                {isSubmitting ? "Submitting brief..." : "Send brief"}
              </button>
            )}
          </div>
        </form>

        <aside className="space-y-4 rounded-4xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">Live summary</h3>
          <ReviewCard summary={summary} compact />
        </aside>
      </div>
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

function buildCombinedNotes(values: FormValues) {
  const sections: string[] = [];
  if (values.shootVibe) sections.push(`Shoot vibe: ${values.shootVibe}`);
  if (values.collaborators) sections.push(`Collaborators: ${values.collaborators}`);
  if (values.attendeeCount) sections.push(`Expected guests: ${values.attendeeCount}`);
  const budgetParts: string[] = [];
  if (values.budgetMin) budgetParts.push(`₹${values.budgetMin}`);
  if (values.budgetMax) budgetParts.push(`₹${values.budgetMax}`);
  if (budgetParts.length) sections.push(`Budget range: ${budgetParts.join(" - ")}`);
  if (values.references) sections.push(`References: ${values.references}`);

  const baseNotes = values.notes ?? "";
  const extras = sections.length ? `Additional context:\n${sections.join("\n")}` : "";
  return [baseNotes, extras].filter(Boolean).join("\n\n");
}

function buildDeliverables(values: FormValues) {
  const parts = [values.deliverables];
  if (values.preferredDelivery) {
    parts.push(`Preferred delivery: ${values.preferredDelivery}`);
  }
  return parts.filter(Boolean).join("\n");
}

function buildSummary(values: Partial<FormValues>) {
  return [
    {
      title: "Project",
      rows: [
        ["Event name", values.eventName],
        ["Shoot type", values.eventType],
        ["Vibe", values.shootVibe],
        ["Collaborators", values.collaborators],
      ],
    },
    {
      title: "Location & schedule",
      rows: [
        ["Venue", values.location],
        ["Latitude / Longitude", values.latitude && values.longitude ? `${values.latitude}, ${values.longitude}` : undefined],
        ["Start", values.startDate ? new Date(values.startDate).toLocaleString() : undefined],
        ["End", values.endDate ? new Date(values.endDate).toLocaleString() : undefined],
        ["Hours requested", values.hoursRequested],
      ],
    },
    {
      title: "Logistics",
      rows: [
        ["Guests", values.attendeeCount],
        [
          "Budget range",
          values.budgetMin || values.budgetMax
            ? [values.budgetMin ? `₹${values.budgetMin}` : "", values.budgetMax ? `₹${values.budgetMax}` : ""]
                .filter(Boolean)
                .join(" – ")
            : undefined,
        ],
        ["Deliverables", values.deliverables],
        ["Preferred delivery", values.preferredDelivery],
        ["References", values.references],
      ],
    },
    {
      title: "Introduction",
      rows: [["Intro message", values.initialMessage]],
    },
  ];
}

function ReviewCard({ summary, compact }: { summary: ReturnType<typeof buildSummary>; compact?: boolean }) {
  return (
    <div className={clsx("space-y-4", compact ? "text-xs" : "text-sm")}>
      {summary.map((section) => (
        <div key={section.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className={clsx("font-semibold text-white", compact ? "text-sm" : "text-base")}>{section.title}</p>
          <ul className="mt-2 space-y-1">
            {section.rows.map(([label, value]) =>
              value ? (
                <li key={label} className="flex justify-between gap-3">
                  <span className="text-slate-400">{label}</span>
                  <span className="text-right text-white">{value}</span>
                </li>
              ) : null,
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}

