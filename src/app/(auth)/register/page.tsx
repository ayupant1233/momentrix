"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const registerSchema = z
  .object({
    name: z.string().min(2).max(80),
    email: z.string().email("Provide a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase character")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string(),
    role: z.enum(["CLIENT", "PHOTOGRAPHER"], {
      required_error: "Select how you plan to use Momentrix",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "CLIENT",
    },
  });

  async function onSubmit(values: RegisterValues) {
    setServerMessage(null);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: values.email,
        password: values.password,
        name: values.name,
        role: values.role,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setServerMessage(payload.message ?? "Unable to create account. Try again.");
      return;
    }

    await signIn("credentials", {
      redirect: false,
      email: values.email,
      password: values.password,
      callbackUrl: values.role === "PHOTOGRAPHER" ? "/onboarding/photographer" : "/onboarding/client",
    });

    router.push(values.role === "PHOTOGRAPHER" ? "/onboarding/photographer" : "/onboarding/client");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
      <div className="glass rounded-4xl p-10">
        <div className="mb-10 text-center">
          <p className="chip mx-auto w-fit">Join Momentrix Beta</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">Create your account</h1>
          <p className="mt-2 text-sm text-slate-300">
            Choose how you’ll use Momentrix and get instant access to collaborative tools.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-200">
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                {...register("name")}
              />
              {errors.name ? <p className="text-xs text-rose-400">{errors.name.message}</p> : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-200">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                {...register("email")}
              />
              {errors.email ? <p className="text-xs text-rose-400">{errors.email.message}</p> : null}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-200">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                {...register("password")}
              />
              {errors.password ? (
                <p className="text-xs text-rose-400">{errors.password.message}</p>
              ) : (
                <p className="text-xs text-slate-500">
                  Use 8+ characters with an uppercase letter and a number.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-200">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword ? (
                <p className="text-xs text-rose-400">{errors.confirmPassword.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium text-slate-200">How will you use Momentrix?</p>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex cursor-pointer flex-col gap-2 rounded-3xl border border-white/15 bg-white/5 p-5 transition hover:border-brand-300/60">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">I’m hiring a photographer</span>
                  <input
                    type="radio"
                    value="CLIENT"
                    className="h-4 w-4 accent-brand-400"
                    {...register("role")}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Discover nearby talent, compare packages, and manage bookings in one place.
                </p>
              </label>

              <label className="flex cursor-pointer flex-col gap-2 rounded-3xl border border-white/15 bg-white/5 p-5 transition hover:border-brand-300/60">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">I’m a photographer</span>
                  <input
                    type="radio"
                    value="PHOTOGRAPHER"
                    className="h-4 w-4 accent-brand-400"
                    {...register("role")}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Showcase your work, publish reels, and get paid securely for every shoot.
                </p>
              </label>
            </div>
            {errors.role ? <p className="text-xs text-rose-400">{errors.role.message}</p> : null}
          </div>

          {serverMessage ? (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
              {serverMessage}
            </div>
          ) : (
            <div className="rounded-2xl border border-brand-400/30 bg-brand-500/10 p-4 text-xs uppercase tracking-[0.2em] text-brand-100">
              Email OTP and optional social verification will be requested after onboarding.
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-soft-glow transition hover:from-brand-300 hover:to-brand-500 disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already part of Momentrix?{" "}
          <Link href="/login" className="font-semibold text-brand-200">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

