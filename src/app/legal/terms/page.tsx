import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Momentrix",
  description: "Review the Momentrix terms governing usage, bookings, and marketplace policies.",
};

export default function TermsOfServicePage() {
  return (
    <article className="mx-auto min-h-screen w-full max-w-4xl px-6 py-16 text-slate-100">
      <header className="mb-12 space-y-3">
        <p className="chip w-fit">Legal</p>
        <h1 className="text-4xl font-semibold text-white">Terms of Service</h1>
        <p className="max-w-2xl text-sm text-slate-300">
          Last updated: {new Date().toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </header>

      <section className="space-y-6 text-sm text-slate-300 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h2]:tracking-wide [&_section]:space-y-3">
        <section>
          <h2>1. Acceptance of terms</h2>
          <p>
            By accessing or using Momentrix, you agree to these Terms of Service (&quot;Terms&quot;). If you are using
            the platform on behalf of a company, you represent that you have authority to bind that entity to these Terms.
          </p>
        </section>

        <section>
          <h2>2. Account responsibilities</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>You must provide accurate information and keep your contact details up to date.</li>
            <li>Account-sharing is prohibited; credentials are personal to each user.</li>
            <li>You are responsible for all activity occurring under your account.</li>
          </ul>
        </section>

        <section>
          <h2>3. Marketplace rules</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Photographers agree to honor confirmed bookings and maintain high-quality deliverables.</li>
            <li>Clients agree to provide accurate briefs and compensate creators per the agreed scope.</li>
            <li>All communication should remain professional and respectful. Harassment or discrimination is prohibited.</li>
          </ul>
        </section>

        <section>
          <h2>4. Fees &amp; payments</h2>
          <p>
            We may charge platform fees for premium services, concierge placement, or payment processing. All fees will be
            disclosed upfront before you commit. Taxes, if applicable, are your responsibility.
          </p>
        </section>

        <section>
          <h2>5. Cancellations &amp; refunds</h2>
          <p>
            Cancellation terms are defined in our Cancellation Policy. Momentrix is not responsible for direct disputes
            between clients and photographers but will provide mediation where possible.
          </p>
        </section>

        <section>
          <h2>6. Intellectual property</h2>
          <p>
            Users retain rights to the content they upload. By publishing portfolios or posts, you grant Momentrix a
            limited license to display and promote that content within the platform and marketing materials.
          </p>
        </section>

        <section>
          <h2>7. Verification &amp; compliance</h2>
          <p>
            We reserve the right to request additional documents, conduct social follower verification, or pause accounts
            that do not meet marketplace standards. Fraudulent activity may result in suspension or termination.
          </p>
        </section>

        <section>
          <h2>8. Limitation of liability</h2>
          <p>
            Momentrix provides the marketplace &quot;as is&quot; and disclaims liability for indirect or consequential
            damages. Our aggregate liability shall not exceed the fees paid to us in the 6 months preceding the claim.
          </p>
        </section>

        <section>
          <h2>9. Governing law</h2>
          <p>
            These Terms are governed by the laws of India. Disputes will be subject to the exclusive jurisdiction of the
            courts in Bengaluru, Karnataka.
          </p>
        </section>

        <section>
          <h2>10. Changes to the Terms</h2>
          <p>
            We may modify these Terms. Continued use after changes signifies acceptance. We will notify users via email or
            in-app notices when updates are significant.
          </p>
        </section>

        <section>
          <h2>11. Contact</h2>
          <p>
            Questions? Email{" "}
            <a className="text-brand-200" href="mailto:legal@momentrix.in">
              legal@momentrix.in
            </a>{" "}
            or write to: Momentrix Pvt. Ltd., Koramangala, Bengaluru, India.
          </p>
        </section>
      </section>
    </article>
  );
}

