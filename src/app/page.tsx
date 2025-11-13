import Link from "next/link";
import Image from "next/image";
import { RadiusSelector } from "@/components/radius-selector";

const features = [
  {
    title: "Identity verification",
    description:
      "Email OTP and social profile checks keep every enquiry trusted while avoiding paper-heavy onboarding.",
    icon: "🔐",
  },
  {
    title: "Immersive portfolios",
    description:
      "Upload stories, reels, and curated galleries to showcase the craft beyond a static photo grid.",
    icon: "🎞️",
  },
  {
    title: "Direct contact",
    description:
      "Surface phone and email instantly so clients can call or mail photographers without waiting.",
    icon: "📞",
  },
  {
    title: "Chat & collaborate",
    description:
      "Message creatives, share briefs, exchange files, and align on deliverables in a focused inbox.",
    icon: "💬",
  },
];

const photographers = [
  {
    name: "Aarav Shah",
    handle: "@aaravframes",
    speciality: "Wedding & Candid",
    distance: "3.2 km away",
    price: "₹5,500 / hr",
    rating: 4.9,
    sessions: 128,
    phone: "+91 90876 55221",
    email: "aarav@momentrix.pro",
  },
  {
    name: "Mira Fernandes",
    handle: "@miralens",
    speciality: "Fashion & Editorial",
    distance: "6.5 km away",
    price: "₹8,200 / hr",
    rating: 4.8,
    sessions: 94,
    phone: "+91 91752 00443",
    email: "mira@momentrix.pro",
  },
  {
    name: "Kabir Kapoor",
    handle: "@kabircaptures",
    speciality: "Real Estate & Interiors",
    distance: "9.7 km away",
    price: "₹4,200 / hr",
    rating: 4.7,
    sessions: 75,
    phone: "+91 98112 44552",
    email: "kabir@momentrix.pro",
  },
  {
    name: "Sarah Menon",
    handle: "@sarahstories",
    speciality: "Maternity & Lifestyle",
    distance: "12 km away",
    price: "₹6,000 / hr",
    rating: 5,
    sessions: 102,
    phone: "+91 99671 20994",
    email: "sarah@momentrix.pro",
  },
];

const workflow = [
  {
    title: "Verify in minutes",
    copy: "Confirm your email, link your social handles, and set rates in a guided onboarding.",
  },
  {
    title: "Showcase your best",
    copy: "Publish reels, carousels, and testimonials, then tag categories for smarter discovery.",
  },
  {
    title: "Get booked",
    copy: "Clients filter by distance and package, start a chat, and confirm details with a call or message.",
  },
];

const spotlightPosts = [
  {
    title: "Destination wedding in Jaipur",
    creator: "Aarav Shah",
    stats: "238 saves • 41 enquiries",
  },
  {
    title: "Lookbook for Nyra Studios",
    creator: "Mira Fernandes",
    stats: "172 saves • 33 enquiries",
  },
  {
    title: "Modern home walkthrough tour",
    creator: "Kabir Kapoor",
    stats: "119 saves • 22 enquiries",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden pb-24 text-slate-100">
      <div className="absolute inset-0 bg-radial-glow opacity-80" />
      <header className="relative z-10 border-b border-white/10">
        <nav className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/momentrix-logo.png"
              alt="Momentrix"
              width={48}
              height={48}
              priority
              className="h-12 w-12 rounded-xl border border-white/10 bg-white/10 p-1 shadow-soft-glow"
            />
            <div>
              <p className="text-lg font-semibold tracking-wide">Momentrix</p>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
                Capture • Connect • Collaborate
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-6 text-sm font-medium text-slate-200 md:flex">
            <Link href="#features" className="hover:text-brand-200 transition-colors">
              Features
            </Link>
            <Link href="#marketplace" className="hover:text-brand-200 transition-colors">
              Marketplace
            </Link>
            <Link href="#workflow" className="hover:text-brand-200 transition-colors">
              How it works
            </Link>
            <Link href="#cta" className="hover:text-brand-200 transition-colors">
              Join beta
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-brand-400/60 hover:text-brand-100 md:block"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-4 py-2 text-sm font-medium text-white shadow-soft-glow transition hover:from-brand-300 hover:to-brand-500"
            >
              Join Momentrix
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-24 px-6 pt-16">
        <section id="hero" className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-8">
            <span className="chip">NEW • CREATOR MARKETPLACE</span>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Hire photographers who are verified, nearby, and ready when you are.
            </h1>
            <p className="max-w-xl text-lg text-slate-300">
              Momentrix merges location-aware discovery with immersive portfolios so you can review
              the latest shoots, connect instantly, and align on every detail without friction.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="#marketplace"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 font-medium text-midnight-900 shadow-soft-glow transition hover:bg-brand-100"
              >
                Explore nearby talent →
              </Link>
              <Link
                href="#cta"
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 font-medium text-white transition hover:border-brand-400/70 hover:text-brand-100"
              >
                Become a creator
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-slate-300">
              <div>
                <p className="text-2xl font-semibold text-white">2,800+</p>
                <p>Bookings secured in beta</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">4.85★</p>
                <p>Average creator rating</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">72 hrs</p>
                <p>Average turnaround saved</p>
              </div>
            </div>
          </div>

          <div className="glass relative overflow-hidden rounded-4xl p-8">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-radial-orange blur-3xl" />
            <RadiusSelector />
            <div className="mt-6 space-y-4 text-sm text-slate-200">
              <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-4">
                <span className="mt-1 text-lg">📍</span>
                <div>
                  <p className="font-semibold text-white">Tap into hyperlocal discovery</p>
                  <p className="text-slate-300">We prioritise creators who match your brief within the radius you define.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-4">
                <span className="mt-1 text-lg">⚡</span>
                <div>
                  <p className="font-semibold text-white">Realtime availability sync</p>
                  <p className="text-slate-300">Check availability and align on logistics instantly.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="space-y-10">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="chip">Why Momentrix</span>
              <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
                Built for creators and clients who demand more than a booking form.
              </h2>
            </div>
            <p className="max-w-md text-slate-300">
              Every touchpoint—from onboarding to handoff—is crafted to reduce friction and elevate
              the storytelling behind each photo shoot.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="glass flex h-full flex-col gap-4 rounded-3xl p-6 transition hover:-translate-y-1 hover:border-brand-300/60"
              >
                <span className="text-2xl">{feature.icon}</span>
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-slate-300">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="marketplace" className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <span className="chip">Trending nearby</span>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              Meet the photographers your city is already booking.
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {photographers.map((photographer) => (
                <article
                  key={photographer.handle}
                  className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-card-border transition hover:border-brand-300/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500/20 text-sm font-semibold text-brand-100">
                      {photographer.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{photographer.name}</p>
                      <p className="text-xs uppercase tracking-wide text-brand-200">
                        {photographer.speciality}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-300">
                    <span className="rounded-full border border-white/10 px-3 py-1">
                      {photographer.price}
                    </span>
                    <span className="rounded-full border border-white/10 px-3 py-1">
                      {photographer.distance}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>{photographer.handle}</span>
                    <span>
                      ⭐ {photographer.rating} • {photographer.sessions} shoots
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-slate-300">
                    <span>📞 {photographer.phone}</span>
                    <span>✉️ {photographer.email}</span>
                  </div>
                  <Link
                    href="#"
                    className="mt-2 inline-flex items-center justify-center rounded-full bg-brand-500/20 px-4 py-2 text-sm font-semibold text-brand-100 transition hover:bg-brand-400/30"
                  >
                    View profile
                  </Link>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={`tel:${photographer.phone.replace(/[^+0-9]/g, "")}`}
                      className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                    >
                      Call
                    </a>
                    <a
                      href={`mailto:${photographer.email}`}
                      className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                    >
                      Email
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="glass relative flex flex-col gap-6 rounded-4xl p-8">
            <div>
              <span className="chip">Creator spotlight</span>
              <p className="mt-4 text-sm text-slate-300">
                Daily posts auto-sync to your profile feed, keeping clients inspired while you work.
              </p>
            </div>
            <div className="space-y-4">
              {spotlightPosts.map((post) => (
                <article
                  key={post.title}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-brand-300/60"
                >
                  <p className="text-sm font-semibold text-white">{post.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-brand-200">
                    {post.creator}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">{post.stats}</p>
                </article>
              ))}
            </div>
            <div className="rounded-3xl border border-dashed border-brand-400/50 p-5 text-sm text-slate-200">
              Upload up to 4K video reels, audio notes, and behind-the-scenes albums to enrich every
              enquiry.
            </div>
          </aside>
        </section>

        <section id="workflow" className="space-y-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="chip">How it works</span>
              <h2 className="mt-4 max-w-xl text-3xl font-semibold text-white sm:text-4xl">
                Three steps to unlock trusted collaborations and faster shoots.
              </h2>
            </div>
            <Link
              href="#cta"
              className="inline-flex items-center justify-center rounded-full border border-brand-300/50 px-6 py-3 text-sm font-medium text-brand-100 transition hover:bg-brand-500/10"
            >
              Request early access
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {workflow.map((stage, index) => (
              <article
                key={stage.title}
                className="flex h-full flex-col gap-4 rounded-4xl border border-white/10 bg-white/5 p-6"
              >
                <span className="text-sm font-semibold text-brand-200">0{index + 1}</span>
                <h3 className="text-lg font-semibold text-white">{stage.title}</h3>
                <p className="text-sm text-slate-300">{stage.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="cta"
          className="glass relative overflow-hidden rounded-4xl border border-brand-400/40 p-12 text-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/30 via-transparent to-accent/20" />
          <div className="relative space-y-6">
            <span className="chip mx-auto w-fit">Launch city: Bengaluru • Pune waitlist open</span>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              Be part of the beta cohort shaping the future of creative collaborations.
            </h2>
            <p className="mx-auto max-w-2xl text-base text-slate-200">
              Photographers get early access to audience insights, instant matches, and a curated
              feed. Clients receive concierge onboarding and a dedicated success manager.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="#"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 font-semibold text-midnight-900 shadow-soft-glow transition hover:bg-brand-100"
              >
                Apply as photographer
              </Link>
              <Link
                href="#"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-3 font-semibold text-white transition hover:border-brand-400/60 hover:text-brand-100"
              >
                Try client experience
              </Link>
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Early access • zero platform fee • limited slots
            </p>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mt-24 border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Momentrix Labs. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="#">Privacy</Link>
            <Link href="#">Terms</Link>
            <Link href="#">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
