import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import PortfolioGallery from "./portfolio-gallery";

export const metadata: Metadata = {
  title: "Portfolio Showcase | Momentrix",
  description:
    "Discover signature shoots from Momentrix photographers across weddings, fashion, product, events, and travel.",
};

const CATEGORIES = ["All", "Weddings", "Fashion", "Product", "Events", "Travel"] as const;

type Category = (typeof CATEGORIES)[number];

const KEYWORDS: Record<Category, string[]> = {
  All: [],
  Weddings: ["wedding", "bridal", "sangeet", "mehendi", "shaadi", "engagement", "couple"],
  Fashion: ["fashion", "editorial", "lookbook", "runway", "model"],
  Product: ["product", "catalogue", "packshot", "food", "flatlay", "commercial"],
  Events: ["event", "conference", "corporate", "festival", "concert", "party"],
  Travel: ["travel", "destination", "landscape", "tourism", "adventure"],
};

export default async function PortfolioPage() {
  const items = await prisma.portfolioItem.findMany({
    take: 60,
    orderBy: { createdAt: "desc" },
    include: {
      photographer: {
        select: {
          id: true,
          headline: true,
          city: true,
          tags: true,
          services: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const galleryItems = items.map((item) => {
    const tagList = Array.isArray(item.photographer.tags) ? (item.photographer.tags as string[]) : [];
    const serviceList = Array.isArray(item.photographer.services) ? (item.photographer.services as string[]) : [];
    const text = `${item.title ?? ""} ${item.description ?? ""} ${tagList.join(" ")} ${serviceList.join(" ")}`.toLowerCase();

    const categories = new Set<Category>();
    (Object.keys(KEYWORDS) as Category[]).forEach((category) => {
      if (category === "All") return;
      const keywords = KEYWORDS[category];
      if (keywords.some((keyword) => text.includes(keyword))) {
        categories.add(category);
      }
    });

    const assigned = categories.size ? Array.from(categories) : (["All"] as Category[]);
    if (!assigned.includes("All")) assigned.push("All");

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      mediaUrl: item.mediaUrl,
      mediaType: item.mediaType,
      featured: item.featured,
      capturedAt: item.capturedAt ? item.capturedAt.toISOString() : null,
      location: item.location,
      createdAt: item.createdAt.toISOString(),
      photographer: {
        id: item.photographer.id,
        name: item.photographer.user?.name ?? item.photographer.headline ?? "Momentrix photographer",
        city: item.photographer.city,
      },
      categories: assigned,
      tags: tagList,
      services: serviceList,
    };
  });

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-6 py-16 text-slate-100">
      <header className="mb-10 space-y-3 text-center">
        <p className="chip mx-auto w-fit">Portfolio</p>
        <h1 className="text-4xl font-semibold text-white">Immersive work from Momentrix creators</h1>
        <p className="mx-auto max-w-3xl text-sm text-slate-300">
          Browse curated projects across popular categories. Save references, share them with your team, and request the
          photographer that fits your brief.
        </p>
      </header>

      <PortfolioGallery categories={CATEGORIES} items={galleryItems} />
    </div>
  );
}

