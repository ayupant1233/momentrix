import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stories & Inspiration | Momentrix",
  description:
    "Behind-the-scenes posts, reels, and inspiration from Momentrix photographers. Follow their latest work and learn how they craft each shoot.",
};

const STORY_TAGS = ["Behind the scenes", "Lighting tips", "Gear talk", "Client stories", "Reels & social"] as const;

type StoryTag = (typeof STORY_TAGS)[number];

const TAG_KEYWORDS: Record<StoryTag, string[]> = {
  "Behind the scenes": ["behind", "bts", "workflow", "making", "setup"],
  "Lighting tips": ["lighting", "flash", "ambient", "strobes", "softbox"],
  "Gear talk": ["gear", "camera", "lens", "equipment", "rig"],
  "Client stories": ["client", "testimonial", "impact", "relationship", "review"],
  "Reels & social": ["reel", "instagram", "viral", "tiktok", "social"],
};

export default async function StoriesPage() {
  const stories = await prisma.post.findMany({
    take: 30,
    orderBy: { createdAt: "desc" },
    include: {
      photographer: {
        select: {
          id: true,
          headline: true,
          city: true,
          tags: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const formattedStories = stories.map((story) => {
    const tagList = Array.isArray(story.photographer.tags) ? (story.photographer.tags as string[]) : [];
    const text = `${story.title ?? ""} ${story.content ?? ""} ${tagList.join(" ")}`.toLowerCase();
    const grouped = new Set<StoryTag>();

    (Object.keys(TAG_KEYWORDS) as StoryTag[]).forEach((tag) => {
      const keywords = TAG_KEYWORDS[tag];
      if (keywords.some((keyword) => text.includes(keyword))) {
        grouped.add(tag);
      }
    });

    if (grouped.size === 0) grouped.add("Client stories");

    return {
      id: story.id,
      title: story.title,
      content: story.content,
      mediaUrls: (story.mediaUrls as string[] | null) ?? [],
      likes: story.likes,
      saves: story.saves,
      enquiries: story.enquiries,
      createdAt: story.createdAt.toISOString(),
      photographer: {
        id: story.photographer.id,
        name: story.photographer.user?.name ?? story.photographer.headline ?? "Momentrix photographer",
        city: story.photographer.city,
      },
      tags: Array.from(grouped),
    };
  });

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-6 py-16 text-slate-100">
      <header className="mb-12 space-y-3 text-center">
        <p className="chip mx-auto w-fit">Stories & inspiration</p>
        <h1 className="text-4xl font-semibold text-white">Peek into the craft of Momentrix creators</h1>
        <p className="mx-auto max-w-3xl text-sm text-slate-300">
          From lighting breakdowns to viral reels, see how leading photographers plan, shoot, and deliver unforgettable
          work. Follow their stories to inspire your next brief.
        </p>
      </header>

      {formattedStories.length === 0 ? (
        <section className="rounded-4xl border border-white/10 bg-white/5 p-10 text-center text-sm text-slate-300">
          We&apos;re curating fresh stories from Momentrix creators. Check back soon or follow photographers directly
          from their profiles.
        </section>
      ) : (
        <section className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {formattedStories.map((story) => (
              <article key={story.id} className="flex flex-col gap-4 rounded-4xl border border-white/10 bg-white/5 p-5">
                {story.mediaUrls.length ? (
                  <div className="overflow-hidden rounded-3xl border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={story.mediaUrls[0]} alt={story.title} className="h-48 w-full object-cover" />
                  </div>
                ) : null}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{story.title}</p>
                    <p className="text-xs text-slate-400">
                      {story.photographer.name} • {story.photographer.city ?? "Location TBD"}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-400">
                    {new Date(story.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {story.content ? (
                  <p className="line-clamp-4 text-xs text-slate-300">{story.content}</p>
                ) : (
                  <p className="text-xs text-slate-400">This photographer shared a visual story.</p>
                )}

                <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-brand-200">
                  {story.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-brand-400/40 px-3 py-1">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>❤️ {story.likes}</span>
                  <span>💾 {story.saves}</span>
                  <span>✉️ {story.enquiries}</span>
                </div>

                <div className="mt-auto flex flex-wrap gap-2 text-xs">
                  <Link
                    href={`/photographers/${story.photographer.id}`}
                    className="rounded-full border border-white/15 px-3 py-1 font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                  >
                    View profile
                  </Link>
                  <Link
                    href={`/bookings/new?story=${story.id}`}
                    className="rounded-full border border-white/15 px-3 py-1 font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                  >
                    Book this creator
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

