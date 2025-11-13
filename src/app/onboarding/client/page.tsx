"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";

const schema = z.object({
  companyName: z.string().max(120).optional(),
  useCase: z.string().max(240).optional(),
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
  budgetMin: z.string().optional(),
  budgetMax: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ClientOnboardingPage() {
  const router = useRouter();
  const { status, data } = useSession();
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/onboarding/client");
    }
    if (data?.user?.role && data.user.role !== "CLIENT") {
      router.push("/onboarding/photographer");
    }
  }, [status, router, data]);

  const { register, handleSubmit, reset, formState, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: "",
      useCase: "",
      city: "",
      latitude: "",
      longitude: "",
      budgetMin: "",
      budgetMax: "",
    },
  });

  const cityValue = watch("city");

  useQuery({
    queryKey: ["client-profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile/client");
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json() as Promise<{
        profile: {
          companyName: string | null;
          useCase: string | null;
          city: string | null;
          latitude: number | null;
          longitude: number | null;
          budgetMin: number | null;
          budgetMax: number | null;
        } | null;
      }>;
    },
    enabled: status === "authenticated",
    onSuccess: (data) => {
      if (data.profile) {
        reset({
          companyName: data.profile.companyName ?? "",
          useCase: data.profile.useCase ?? "",
          city: data.profile.city ?? "",
          latitude: data.profile.latitude?.toString() ?? "",
          longitude: data.profile.longitude?.toString() ?? "",
          budgetMin: data.profile.budgetMin?.toString() ?? "",
          budgetMax: data.profile.budgetMax?.toString() ?? "",
        });
      }
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await fetch("/api/profile/client", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          latitude: Number(values.latitude),
          longitude: Number(values.longitude),
          budgetMin: values.budgetMin ? Number(values.budgetMin) : undefined,
          budgetMax: values.budgetMax ? Number(values.budgetMax) : undefined,
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
      { enableHighAccuracy: true, timeout: 10000 },
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
          headers: { Accept: "application/json" },
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
      setGeoError("Lookup failed. Try again or paste coordinates manually.");
    } finally {
      setGeoLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-16">
      <div className="mb-10">
        <p className="chip w-fit">Client onboarding</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Let’s tailor photographers to your brief</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          We’ll use this to surface talent in your radius, match your budget, and even pre-fill booking details.
        </p>
      </div>

      <form onSubmit={onSubmit} className="glass space-y-8 rounded-4xl p-10">
        <section className="grid gap-6 md:grid-cols-2">
          <Field label="Company or event brand" error={formState.errors.companyName?.message}>
            <input
              type="text"
              placeholder="Nyra Events"
              className="input"
              {...register("companyName")}
            />
          </Field>
          <Field label="Primary use case" error={formState.errors.useCase?.message}>
            <input
              type="text"
              placeholder="Corporate offsite, Lifestyle shoot..."
              className="input"
              {...register("useCase")}
            />
          </Field>
          <Field label="City" error={formState.errors.city?.message}>
            <input type="text" placeholder="Pune" className="input" {...register("city")} />
          </Field>
          <Field label="Latitude" error={formState.errors.latitude?.message}>
            <input type="text" placeholder="18.5204" className="input" {...register("latitude")} />
          </Field>
          <Field label="Longitude" error={formState.errors.longitude?.message}>
            <input type="text" placeholder="73.8567" className="input" {...register("longitude")} />
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
              You can also paste coordinates from Google Maps to set the service radius centre.
            </span>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Field label="Budget minimum (₹)" error={formState.errors.budgetMin?.message}>
            <input type="number" className="input" {...register("budgetMin")} />
          </Field>
          <Field label="Budget maximum (₹)" error={formState.errors.budgetMax?.message}>
            <input type="number" className="input" {...register("budgetMax")} />
          </Field>
        </section>

        {mutation.isError ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
            {(mutation.error as Error).message}
          </div>
        ) : (
          <div className="rounded-2xl border border-brand-400/30 bg-brand-500/10 p-4 text-xs uppercase tracking-[0.2em] text-brand-100">
            You can update these settings anytime from settings &gt; discovery preferences.
          </div>
        )}

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
            {mutation.isPending || formState.isSubmitting ? "Saving preferences..." : "Continue to dashboard"}
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
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-200">
      <span className="font-medium text-white">{label}</span>
      {children}
      {error ? <span className="text-xs text-rose-400">{error}</span> : null}
    </label>
  );
}

