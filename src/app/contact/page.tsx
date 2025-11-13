import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Momentrix | Chat, Email, WhatsApp",
  description:
    "Reach the Momentrix team for bookings, support, partnerships, or press. We respond within one business day.",
};

const CHANNELS = [
  {
    title: "WhatsApp & phone",
    description: "Ideal for urgent booking requests, date checks, or concierge assistance.",
    actions: [
      { label: "Chat on WhatsApp", href: "https://wa.me/919876543210" },
      { label: "Call us", href: "tel:+919876543210" },
    ],
  },
  {
    title: "Email",
    description: "We typically reply within 24 hours. Attach briefs, moodboards, or contracts.",
    actions: [{ label: "hello@momentrix.in", href: "mailto:hello@momentrix.in" }],
  },
  {
    title: "Creator support",
    description: "Need help with verification, portfolio setup, or availability? We’ve got you.",
    actions: [{ label: "Message the creator desk", href: "mailto:creators@momentrix.in" }],
  },
] as const;

const FAQ = [
  {
    question: "How fast will I hear back?",
    answer:
      "Most messages receive a response within a business day. For urgent shoots, WhatsApp is fastest—someone is on-call 7am–11pm IST.",
  },
  {
    question: "Do you help shortlist photographers?",
    answer:
      "Yes. Share your brief via the quote builder or email. We’ll handpick verified creators that match your style, budget, and timeline.",
  },
  {
    question: "Where is Momentrix available?",
    answer:
      "We’re currently live across major Indian cities with destination coverage available on request. International shoots launch soon.",
  },
  {
    question: "How do creators get verified?",
    answer:
      "Every photographer completes email OTP, social follower verification, and manual checks for portfolio quality and reliability.",
  },
] as const;

export default function ContactPage() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl px-6 py-16 text-slate-100">
      <header className="mb-12 space-y-3 text-center">
        <p className="chip mx-auto w-fit">Contact</p>
        <h1 className="text-4xl font-semibold text-white">Let’s get your shoot moving</h1>
        <p className="mx-auto max-w-2xl text-sm text-slate-300">
          Whether you’re planning a wedding, launching a product, or building your creator business, we’re here to help.
          Reach out via chat, email, or phone—whatever works best for you.
        </p>
      </header>

      <section className="grid gap-6">
        {CHANNELS.map((channel) => (
          <article key={channel.title} className="rounded-4xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-white">{channel.title}</h2>
            <p className="mt-2 text-sm text-slate-300">{channel.description}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              {channel.actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="rounded-full border border-white/15 px-5 py-2 font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="mt-16 rounded-4xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-lg font-semibold text-white">Booking concierge</h2>
        <p className="mt-3 text-sm text-slate-300">
          Already know your dates and budget? Share your brief below and the team will coordinate recommendations,
          availability checks, and introductions.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <Link
            href="/bookings/new"
            className="rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-5 py-2 font-semibold text-white shadow-soft-glow transition hover:from-brand-300 hover:to-brand-500"
          >
            Submit a brief
          </Link>
          <Link
            href="mailto:concierge@momentrix.in"
            className="rounded-full border border-white/15 px-5 py-2 font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
          >
            concierge@momentrix.in
          </Link>
        </div>
      </section>

      <section className="mt-16 space-y-6">
        <h2 className="text-lg font-semibold text-white">FAQs</h2>
        <div className="space-y-4">
          {FAQ.map((item) => (
            <article key={item.question} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-sm font-semibold text-white">{item.question}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

