import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Momentrix | Capture. Connect. Collaborate.",
  description:
    "Learn about the Momentrix team, our mission to empower photographers, and how we’re building India’s most trusted creative marketplace.",
};

const TEAM = [
  {
    name: "Ayush Pant",
    title: "Founder & Product Lead",
    bio: "Drives product vision and founder relationships, ensuring every feature helps creators sell faster.",
  },
  {
    name: "Aditi Rao",
    title: "Ops & Creator Success",
    bio: "Supports onboarding, verification, and concierge briefs for high-stakes shoots and campaigns.",
  },
  {
    name: "Rohan Iyer",
    title: "Engineering Lead",
    bio: "Leads platform reliability, security, and integrations so photographers can focus on their craft.",
  },
] as const;

const VALUES = [
  {
    title: "Creators first",
    description: "We design workflows that give photographers more time behind the lens—less time chasing leads.",
  },
  {
    title: "Trust by default",
    description: "Verified identities, transparent pricing, and secure communications protect both sides of every project.",
  },
  {
    title: "Local to global",
    description: "Rooted in India’s creative energy, built to support collaborations worldwide.",
  },
] as const;

const IMPACT = [
  { metric: "2,800+", label: "Bookings secured in beta" },
  { metric: "72 hrs", label: "Average turnaround saved" },
  { metric: "4.85★", label: "Average creator rating" },
  { metric: "18", label: "Cities covered (and growing)" },
] as const;

export default function AboutPage() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-6 py-16 text-slate-100">
      <header className="mb-16 grid gap-10 lg:grid-cols-[3fr_2fr] lg:items-center">
        <div className="space-y-4">
          <p className="chip w-fit">About Momentrix</p>
          <h1 className="text-4xl font-semibold text-white">Capture. Connect. Collaborate.</h1>
          <p className="text-sm text-slate-300">
            Momentrix helps photographers showcase immersive portfolios, stay fully verified, and win bookings faster.
            Clients get instant access to nearby talent, transparent pricing, and concierge support when it matters.
          </p>
          <div className="flex flex-wrap gap-3 text-xs">
            <Link
              href="/bookings/new"
              className="rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-soft-glow transition hover:from-brand-300 hover:to-brand-500"
            >
              Submit a brief
            </Link>
            <Link
              href="/services"
              className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
            >
              Explore pricing
            </Link>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-4xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-100">Our mission</p>
          <p className="mt-4 text-base text-white">
            Build the most trusted creative marketplace for India—one that turns world-class photographers into thriving
            businesses and gives clients clarity from the first conversation.
          </p>
          <p className="mt-6 text-xs text-slate-400">
            From weddings and fashion to product launches and travel films, we help teams capture every moment with the
            right crew, at the right time.
          </p>
        </div>
      </header>

      <section className="mb-16 grid gap-6 text-center sm:grid-cols-2 md:grid-cols-4">
        {IMPACT.map((item) => (
          <div
            key={item.metric}
            className="rounded-4xl border border-white/10 bg-white/5 p-6 shadow-soft-glow"
          >
            <p className="text-2xl font-semibold text-white">{item.metric}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
          </div>
        ))}
      </section>

      <section className="mb-16 space-y-6">
        <h2 className="text-2xl font-semibold text-white">Values that guide every build</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {VALUES.map((value) => (
            <article key={value.title} className="rounded-4xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-white">{value.title}</h3>
              <p className="mt-3 text-sm text-slate-300">{value.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Meet the team</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {TEAM.map((member) => (
            <article key={member.name} className="flex flex-col gap-4 rounded-4xl border border-white/10 bg-white/5 p-6">
              <div className="flex h-40 w-full items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-brand-500/20 to-midnight-900/40 text-4xl font-semibold text-white">
                {member.name
                  .split(" ")
                  .map((part) => part[0]?.toUpperCase())
                  .join("")}
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{member.name}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-brand-200">{member.title}</p>
              </div>
              <p className="text-sm text-slate-300">{member.bio}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-10 rounded-4xl border border-white/10 bg-white/5 p-8 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">We’re hiring collaborators</h2>
          <p className="text-sm text-slate-300">
            From trusted editors and colorists to partner studios and agencies—we love teaming up with people who push
            the craft forward. Drop us a line with your pitch or partnership idea.
          </p>
          <Link
            href="mailto:hello@momentrix.in?subject=Partnership%20enquiry"
            className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
          >
            hello@momentrix.in
          </Link>
        </div>
        <div className="space-y-4 rounded-4xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-100">Need support?</h3>
          <p>
            The concierge team responds within 24 hours. For urgent event coverage, call or WhatsApp us at{" "}
            <a className="text-brand-200" href="tel:+919876543210">
              +91 98765 43210
            </a>
            .
          </p>
          <p>
            Media kit, brand assets, and press enquiries:{" "}
            <a className="text-brand-200" href="mailto:press@momentrix.in">
              press@momentrix.in
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}

