"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Category = "All" | "Weddings" | "Fashion" | "Product" | "Events" | "Travel";

type GalleryItem = {
  id: string;
  title: string;
  description: string | null;
  mediaUrl: string;
  mediaType: string;
  featured: boolean;
  capturedAt: string | null;
  location: string | null;
  createdAt: string;
  categories: Category[];
  tags: string[];
  services: string[];
  photographer: {
    id: string;
    name: string;
    city: string | null;
  };
};

type Props = {
  categories: readonly Category[];
  items: GalleryItem[];
};

export default function PortfolioGallery({ categories, items }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.categories.includes(activeCategory);
      const searchText = search.trim().toLowerCase();
      if (!searchText) return matchesCategory;

      const haystack = [
        item.title,
        item.description ?? "",
        item.photographer.name,
        item.photographer.city ?? "",
        item.tags.join(" "),
        item.services.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return matchesCategory && haystack.includes(searchText);
    });
  }, [activeCategory, items, search]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                activeCategory === category
                  ? "border-brand-400/60 bg-brand-500/10 text-white"
                  : "border-white/10 text-slate-300 hover:border-brand-300/50 hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by photographer, tag, or location"
            className="input min-w-[240px]"
          />
          <Link
            href="/bookings/new"
            className="rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:from-brand-300 hover:to-brand-500"
          >
            Request this style
          </Link>
        </div>
      </div>

  {filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-slate-300">
          No projects matched your filters. Try a different category or submit a brief for concierge support.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <article key={item.id} className="flex flex-col gap-4 rounded-4xl border border-white/10 bg-white/5 p-5">
              <div className="overflow-hidden rounded-3xl border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.mediaUrl} alt={item.title} className="h-52 w-full object-cover transition duration-500 hover:scale-105" />
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-slate-400">
                    {item.photographer.name} • {item.photographer.city ?? "Location TBD"}
                  </p>
                </div>
                {item.featured ? (
                  <span className="rounded-full border border-brand-400/40 px-3 py-1 text-[11px] uppercase tracking-wide text-brand-200">
                    Featured
                  </span>
                ) : null}
              </div>
              {item.description ? (
                <p className="text-xs text-slate-400">{item.description}</p>
              ) : null}
              <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-brand-200">
                {item.categories
                  .filter((category) => category !== "All")
                  .slice(0, 3)
                  .map((category) => (
                    <span key={category} className="rounded-full border border-brand-400/40 px-3 py-1">
                      {category}
                    </span>
                  ))}
              </div>
              <div className="mt-auto flex flex-wrap gap-2 text-xs">
                <Link
                  href={`/photographers/${item.photographer.id}`}
                  className="rounded-full border border-white/15 px-3 py-1 font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                >
                  View photographer
                </Link>
                <Link
                  href={`/bookings/new?reference=${item.id}`}
                  className="rounded-full border border-white/15 px-3 py-1 font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                >
                  Request similar shoot
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

