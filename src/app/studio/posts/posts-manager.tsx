"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";

type Post = {
  id: string;
  title: string;
  content: string | null;
  mediaUrls: string[];
  likes: number;
  saves: number;
  enquiries: number;
  createdAt: string;
};

type Props = {
  profileId: string;
  initialPosts: Post[];
};

type FormState = {
  title: string;
  content: string;
  mediaUrls: string;
};

const defaultFormState: FormState = {
  title: "",
  content: "",
  mediaUrls: "",
};

export default function PostsManager({ initialPosts }: Props) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setFormState(defaultFormState);
  }

  function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }

  function parseMediaUrls(value: string) {
    return value
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const urls = parseMediaUrls(formState.mediaUrls);
    if (urls.length === 0) {
      setError("Add at least one media URL");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/studio/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formState.title.trim(),
            content: formState.content.trim() || undefined,
            mediaUrls: urls,
          }),
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message ?? "Unable to publish post");
        }

        setPosts((prev) => [payload.post as Post, ...prev]);
        resetForm();
        setMessage("Post published successfully.");
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unable to publish post");
      }
    });
  }

  function handleDelete(id: string) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/studio/posts/${id}`, {
          method: "DELETE",
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.message ?? "Unable to delete post");
        }
        setPosts((prev) => prev.filter((post) => post.id !== id));
        setMessage("Post removed.");
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unable to delete post");
      }
    });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-4xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-white">Share a new story</h2>
        <p className="mb-4 text-sm text-slate-300">
          Enter one or more hosted media URLs (comma separated) to showcase reels, carousels, or BTS clips.
        </p>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-slate-200">
              Title
            </label>
            <input
              id="title"
              required
              value={formState.title}
              onChange={(event) => handleChange("title", event.target.value)}
              className="input"
              placeholder="Behind the scenes at Sumi & Aarav’s sangeet"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="mediaUrls" className="text-sm font-medium text-slate-200">
              Media URLs
            </label>
            <input
              id="mediaUrls"
              required
              value={formState.mediaUrls}
              onChange={(event) => handleChange("mediaUrls", event.target.value)}
              className="input"
              placeholder="https://cdn.momentrix.com/reels/clip.mp4, https://cdn.momentrix.com/gallery/frame.jpg"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label htmlFor="content" className="text-sm font-medium text-slate-200">
              Caption
            </label>
            <textarea
              id="content"
              rows={4}
              value={formState.content}
              onChange={(event) => handleChange("content", event.target.value)}
              className="input resize-none"
              placeholder="Share the story, mood, or lighting setup behind this post."
            />
          </div>
          <div className="md:col-span-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-soft-glow transition hover:from-brand-300 hover:to-brand-500 disabled:opacity-60"
            >
              {isPending ? "Publishing..." : "Publish post"}
            </button>
            {message ? <span className="text-xs text-emerald-300">{message}</span> : null}
            {error ? <span className="text-xs text-rose-300">{error}</span> : null}
          </div>
        </form>
      </section>

      <section className="rounded-4xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-white">Recent posts ({posts.length})</h2>
        {posts.length === 0 ? (
          <p className="mt-4 text-sm text-slate-300">
            Your social feed is quiet. Share a carousel or a behind-the-scenes clip to stay in front of clients.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {posts.map((post) => (
              <article
                key={post.id}
                className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-white">{post.title}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(post.createdAt).toLocaleDateString()} • {post.mediaUrls.length} media
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 px-3 py-1 text-xs text-slate-400">
                    ❤️ {post.likes} • 💾 {post.saves} • ✉️ {post.enquiries}
                  </div>
                </div>
                {post.content ? <p className="line-clamp-3 text-xs text-slate-400">{post.content}</p> : null}
                <div className="flex flex-wrap gap-2 text-xs">
                  {post.mediaUrls.map((url, index) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/10 px-3 py-1 text-brand-200">
                      Media {index + 1}
                    </a>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(post.id)}
                  className={clsx(
                    "self-start rounded-full border border-rose-400/40 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:border-rose-400 hover:text-rose-100",
                    { "opacity-60": isPending },
                  )}
                  disabled={isPending}
                >
                  Delete
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

