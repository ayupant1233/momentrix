"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";

const MEDIA_TYPES = ["IMAGE", "VIDEO", "AUDIO"] as const;
type MediaType = (typeof MEDIA_TYPES)[number];

type PortfolioItem = {
  id: string;
  title: string;
  description: string | null;
  mediaUrl: string;
  mediaType: MediaType;
  featured: boolean;
  capturedAt: string | null;
  location: string | null;
  createdAt: string;
};

type Props = {
  profileId: string;
  initialItems: PortfolioItem[];
};

type FormState = {
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: MediaType;
  location: string;
  capturedAt: string;
  featured: boolean;
};

const defaultFormState: FormState = {
  title: "",
  description: "",
  mediaUrl: "",
  mediaType: "IMAGE",
  location: "",
  capturedAt: "",
  featured: false,
};

export default function PortfolioManager({ initialItems }: Props) {
  const [items, setItems] = useState<PortfolioItem[]>(initialItems);
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setFormState(defaultFormState);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/studio/portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formState.title.trim(),
            description: formState.description.trim() || undefined,
            mediaUrl: formState.mediaUrl.trim(),
            mediaType: formState.mediaType,
            location: formState.location.trim() || undefined,
            capturedAt: formState.capturedAt ? new Date(formState.capturedAt).toISOString() : undefined,
            featured: formState.featured,
          }),
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message ?? "Unable to save portfolio item");
        }

        setItems((prev) => [payload.item as PortfolioItem, ...prev]);
        resetForm();
        setMessage("Portfolio item published.");
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unable to save portfolio item");
      }
    });
  }

  function handleDelete(id: string) {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/studio/portfolio/${id}`, {
          method: "DELETE",
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.message ?? "Unable to delete portfolio item");
        }

        setItems((prev) => prev.filter((item) => item.id !== id));
        setMessage("Portfolio item removed.");
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unable to delete portfolio item");
      }
    });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-4xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-white">Add new work</h2>
        <p className="mb-4 text-sm text-slate-300">
          Paste a hosted image or video URL. If you need file hosting, connect to storage or upload to your CDN first.
        </p>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-1 space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-slate-200">
              Title
            </label>
            <input
              id="title"
              required
              value={formState.title}
              onChange={(event) => handleChange("title", event.target.value)}
              className="input"
              placeholder="Nyra Studios bridal shoot"
            />
          </div>
          <div className="md:col-span-1 space-y-2">
            <label htmlFor="mediaUrl" className="text-sm font-medium text-slate-200">
              Media URL
            </label>
            <input
              id="mediaUrl"
              required
              value={formState.mediaUrl}
              onChange={(event) => handleChange("mediaUrl", event.target.value)}
              className="input"
              placeholder="https://cdn.momentrix.com/portfolio/bridal.jpg"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-slate-200">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={formState.description}
              onChange={(event) => handleChange("description", event.target.value)}
              className="input resize-none"
              placeholder="Describe the brief, lighting, or the story behind this work."
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="mediaType" className="text-sm font-medium text-slate-200">
              Media type
            </label>
            <select
              id="mediaType"
              value={formState.mediaType}
              onChange={(event) => handleChange("mediaType", event.target.value as MediaType)}
              className="input"
            >
              {MEDIA_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium text-slate-200">
              Location
            </label>
            <input
              id="location"
              value={formState.location}
              onChange={(event) => handleChange("location", event.target.value)}
              className="input"
              placeholder="Udaipur, Rajasthan"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="capturedAt" className="text-sm font-medium text-slate-200">
              Captured date
            </label>
            <input
              id="capturedAt"
              type="date"
              value={formState.capturedAt}
              onChange={(event) => handleChange("capturedAt", event.target.value)}
              className="input"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="featured"
              type="checkbox"
              checked={formState.featured}
              onChange={(event) => handleChange("featured", event.target.checked)}
              className="h-4 w-4 accent-brand-400"
            />
            <label htmlFor="featured" className="text-sm text-slate-200">
              Feature this project on my profile
            </label>
          </div>
          <div className="md:col-span-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-soft-glow transition hover:from-brand-300 hover:to-brand-500 disabled:opacity-60"
            >
              {isPending ? "Publishing..." : "Publish work"}
            </button>
            {message ? <span className="text-xs text-emerald-300">{message}</span> : null}
            {error ? <span className="text-xs text-rose-300">{error}</span> : null}
          </div>
        </form>
      </section>

      <section className="rounded-4xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-white">Your portfolio ({items.length})</h2>
        {items.length === 0 ? (
          <p className="mt-4 text-sm text-slate-300">
            Nothing here yet. Share a few hero projects so clients can evaluate your craft quickly.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <article
                key={item.id}
                className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-white">{item.title}</p>
                    {item.location ? <p className="text-xs text-slate-400">{item.location}</p> : null}
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs">
                    {item.mediaType.toLowerCase()}
                  </span>
                </div>
                {item.description ? (
                  <p className="line-clamp-3 text-xs text-slate-400">{item.description}</p>
                ) : null}
                <a
                  href={item.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-xs text-brand-200"
                >
                  View media →
                </a>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  <span>{item.featured ? "Featured" : "Visible"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className={clsx(
                    "self-start rounded-full border border-rose-400/40 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:border-rose-400 hover:text-rose-100",
                    { "opacity-60": isPending },
                  )}
                  disabled={isPending}
                >
                  Remove
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

