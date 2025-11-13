"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";

const schema = z.object({
  headline: z.string().min(4).max(120),
  bio: z.string().min(20).max(1500),
  city: z.string().min(2).max(120),
  latitude: z
    .string()
    .refine((value) => !Number.isNaN(Number(value)) && Math.abs(Number(value)) <= 90, {
      message: "Latitude must be between -90 and 90",
    }),
  longitude: z
    .string()
    .refine((value) => !Number.isNaN(Number(value)) && Math.abs(Number(value)) <= 180, {
      message: "Longitude must be between -180 and 180",
    }),
  travelRadiusKm: z.string().refine((value) => {
    const num = Number(value);
    return !Number.isNaN(num) && num >= 1 && num <= 500;
  }, "Enter a travel radius between 1 and 500 km"),
  hourlyRate: z.string().refine((value) => {
    const num = Number(value);
    return !Number.isNaN(num) && num >= 500;
  }, "Set an hourly rate (₹500 minimum)"),
  halfDayRate: z.string().refine((value) => {
    const num = Number(value);
    return !Number.isNaN(num) && num >= 500;
  }, "Set a half-day rate"),
  fullDayRate: z.string().refine((value) => {
    const num = Number(value);
    return !Number.isNaN(num) && num >= 500;
  }, "Set a full-day rate"),
  instagramHandle: z.string().optional(),
  websiteUrl: z.string().optional(),
  services: z.string().min(3, "List at least one service"),
  tags: z.string().min(3, "Add at least one tag"),
  phone: z
    .string()
    .min(8, "Add a phone number clients can call")
    .max(20, "Phone number looks too long")
    .optional(),
});

type FormValues = z.infer<typeof schema>;

export default function PhotographerOnboardingPage() {
  const router = useRouter();
  const { status, data } = useSession();
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/onboarding/photographer");
    }
    if (data?.user?.role && data.user.role !== "PHOTOGRAPHER") {
      router.push("/onboarding/client");
    }
  }, [status, router, data]);

  const { register, handleSubmit, reset, formState, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      headline: "",
      bio: "",
      city: "",
      latitude: "",
      longitude: "",
      travelRadiusKm: "15",
      hourlyRate: "5000",
      halfDayRate: "15000",
      fullDayRate: "28000",
      instagramHandle: "",
      websiteUrl: "",
      services: "Wedding coverage, Pre-wedding shoots",
      tags: "wedding, portrait, candid",
      phone: "",
    },
  });

  const cityValue = watch("city");

  useQuery({
    queryKey: ["photographer-profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile/photographer");
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json() as Promise<{
        profile:
          | {
              headline: string | null;
              bio: string | null;
              city: string | null;
              latitude: number | null;
              longitude: number | null;
              travelRadiusKm: number;
              hourlyRate: number | null;
              halfDayRate: number | null;
              fullDayRate: number | null;
              instagramHandle: string | null;
              websiteUrl: string | null;
              services: string[] | null;
              tags: string[] | null;
              user: {
                phone: string | null;
                email: string;
              } | null;
            }
          | null;
      }>;
    },
    enabled: status === "authenticated",
    onSuccess: (data) => {
      if (data.profile) {
        reset({
          headline: data.profile.headline ?? "",
          bio: data.profile.bio ?? "",
          city: data.profile.city ?? "",
          latitude: data.profile.latitude?.toString() ?? "",
          longitude: data.profile.longitude?.toString() ?? "",
          travelRadiusKm: data.profile.travelRadiusKm?.toString() ?? "15",
          hourlyRate: data.profile.hourlyRate?.toString() ?? "5000",
          halfDayRate: data.profile.halfDayRate?.toString() ?? "15000",
          fullDayRate: data.profile.fullDayRate?.toString() ?? "28000",
          instagramHandle: data.profile.instagramHandle ?? "",
          websiteUrl: data.profile.websiteUrl ?? "",
          services: data.profile.services?.join(", ") ?? "",
          tags: data.profile.tags?.join(", ") ?? "",
          phone: data.profile.user?.phone ?? "",
        });
      }
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await fetch("/api/profile/photographer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          latitude: Number(values.latitude),
          longitude: Number(values.longitude),
          travelRadiusKm: Number(values.travelRadiusKm),
          hourlyRate: Number(values.hourlyRate),
          halfDayRate: Number(values.halfDayRate),
          fullDayRate: Number(values.fullDayRate),
          tags: values.tags.split(",").map((item) => item.trim()).filter(Boolean),
          services: values.services.split(",").map((item) => item.trim()).filter(Boolean),
          phone: values.phone,
        }),
      });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.message ?? "Failed to save profile");
      }
      return res.json();
    },
    onSuccess: () => {
      router.push("/app");
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await mutation.mutateAsync(values);
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
        reset((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setGeoLoading(false);
      },
      () => {
        setGeoError("Unable to fetch location. Allow access and try again.");
        setGeoLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  }

  async function handleLookupLocation() {
    if (!cityValue || cityValue.trim().length < 2) {
      setGeoError("Enter a city or venue name first.");
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(cityValue)}`,
        {
          headers: {
            "Accept": "application/json",
          },
        },
      );
      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        setGeoError("Could not find coordinates for that location.");
        setGeoLoading(false);
        return;
      }

      const match = data[0];

      reset((current) => ({
        ...current,
        latitude: Number(match.lat).toFixed(6),
        longitude: Number(match.lon).toFixed(6),
      }));
    } catch (error) {
      console.error(error);
      setGeoError("Lookup failed. Try again or enter coordinates manually.");
    } finally {
      setGeoLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-16">
      <div className="mb-10">
        <p className="chip w-fit">Creator onboarding</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Tell clients what makes you unique</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Complete your profile so we can rank you in hyperlocal searches and feature your work across
          Momentrix.
        </p>
      </div>

      <form onSubmit={onSubmit} className="glass space-y-8 rounded-4xl p-10">
        <section className="grid gap-6 md:grid-cols-2">
          <Field label="Headline" error={formState.errors.headline?.message}>
            <input
              type="text"
              placeholder="Destination wedding specialist"
              className="input"
              {...register("headline")}
            />
          </Field>
          <Field label="City" error={formState.errors.city?.message}>
            <input type="text" placeholder="Bengaluru" className="input" {...register("city")} />
          </Field>
          <Field
            label="Contact phone"
            hint="Visible to clients for calls (include country code)"
            error={formState.errors.phone?.message}
          >
            <input type="tel" placeholder="+91 90000 00000" className="input" {...register("phone")} />
          </Field>
          <Field label="Latitude" error={formState.errors.latitude?.message}>
            <input type="text" placeholder="12.9716" className="input" {...register("latitude")} />
          </Field>
          <Field label="Longitude" error={formState.errors.longitude?.message}>
            <input type="text" placeholder="77.5946" className="input" {...register("longitude")} />
          </Field>
          <Field label="Travel radius (km)" error={formState.errors.travelRadiusKm?.message}>
            <input type="number" className="input" {...register("travelRadiusKm")} />
          </Field>
          <div className="flex flex-col gap-2 text-sm text-slate-200 md:col-span-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={geoLoading}
                className="w-full rounded-full border border-brand-300/60 px-4 py-3 text-sm font-semibold text-brand-100 transition hover:bg-brand-500/10 disabled:opacity-60 sm:w-auto"
              >
                {geoLoading ? "Detecting current location..." : "Use my current location"}
              </button>
              <button
                type="button"
                onClick={handleLookupLocation}
                disabled={geoLoading}
                className="w-full rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100 disabled:opacity-60 sm:w-auto"
              >
                {geoLoading ? "Searching..." : "Lookup coordinates"}
              </button>
            </div>
            {geoError ? <span className="text-xs text-rose-400">{geoError}</span> : null}
            <span className="text-xs text-slate-500">
              Paste coordinates from Google Maps if the shoot base differs from where you are right now.
            </span>
          </div>
        </section>

        <section>
          <Field label="Bio" error={formState.errors.bio?.message}>
            <textarea
              rows={5}
              placeholder="Share your story, approach, and what clients can expect..."
              className="input resize-none"
              {...register("bio")}
            />
          </Field>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <Field label="Hourly rate (₹)" error={formState.errors.hourlyRate?.message}>
            <input type="number" className="input" {...register("hourlyRate")} />
          </Field>
          <Field label="Half-day rate (₹)" error={formState.errors.halfDayRate?.message}>
            <input type="number" className="input" {...register("halfDayRate")} />
          </Field>
          <Field label="Full-day rate (₹)" error={formState.errors.fullDayRate?.message}>
            <input type="number" className="input" {...register("fullDayRate")} />
          </Field>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Field label="Instagram handle" error={formState.errors.instagramHandle?.message}>
            <input type="text" placeholder="@momentrix" className="input" {...register("instagramHandle")} />
          </Field>
          <Field label="Website" error={formState.errors.websiteUrl?.message}>
            <input type="url" placeholder="https://yourstudio.com" className="input" {...register("websiteUrl")} />
          </Field>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Field
            label="Services offered"
            hint="Separate with commas (e.g. Wedding photography, Reel edits)"
            error={formState.errors.services?.message}
          >
            <textarea rows={3} className="input resize-none" {...register("services")} />
          </Field>
          <Field
            label="Discovery tags"
            hint="Comma separated keywords used for search ranking"
            error={formState.errors.tags?.message}
          >
            <textarea rows={3} className="input resize-none" {...register("tags")} />
          </Field>
        </section>

        {mutation.isError ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
            {(mutation.error as Error).message}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
            onClick={() => reset()}
          >
            Reset form
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || formState.isSubmitting}
            className="rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-soft-glow transition hover:from-brand-300 hover:to-brand-500 disabled:opacity-60"
          >
            {mutation.isPending || formState.isSubmitting ? "Saving profile..." : "Complete onboarding"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
  error,
  hint,
}: {
  label: string;
  children: ReactNode;
  error?: string;
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

