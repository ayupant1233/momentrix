import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy | Momentrix",
  description: "Understand how cancellations, reschedules, and refunds are handled on Momentrix.",
};

export default function CancellationPolicyPage() {
  return (
    <article className="mx-auto min-h-screen w-full max-w-4xl px-6 py-16 text-slate-100">
      <header className="mb-12 space-y-3">
        <p className="chip w-fit">Legal</p>
        <h1 className="text-4xl font-semibold text-white">Cancellation &amp; Refund Policy</h1>
        <p className="max-w-2xl text-sm text-slate-300">
          Last updated: {new Date().toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </header>

      <section className="space-y-6 text-sm text-slate-300 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h2]:tracking-wide [&_section]:space-y-3">
        <section>
          <h2>1. General approach</h2>
          <p>
            Momentrix facilitates bookings between clients and photographers. We encourage both parties to maintain clear
            communication ahead of each project. This policy outlines how cancellations, reschedules, and refunds are
            managed.
          </p>
        </section>

        <section>
          <h2>2. Client cancellations</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <span className="font-semibold text-white">7+ days before the shoot:</span> eligible for full refund of
              platform fees (if applicable). Photographers may retain a portion of any deposit per their own terms.
            </li>
            <li>
              <span className="font-semibold text-white">Within 3-7 days:</span> 50% of platform fees refundable.
              Photographers may charge up to 50% of the project fee to cover lost opportunities.
            </li>
            <li>
              <span className="font-semibold text-white">Within 72 hours:</span> non-refundable platform fees. Photographer
              retains agreed deposit and may charge up to 75% if rebooking is not possible.
            </li>
          </ul>
        </section>

        <section>
          <h2>3. Photographer cancellations</h2>
          <p>If a photographer cancels, Momentrix will:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Provide a full platform fee refund to the client.</li>
            <li>
              Attempt to place an alternative verified photographer with similar expertise. If a replacement is not
              possible, the client may request a full refund of any advance paid through Momentrix.
            </li>
            <li>Evaluate the creator’s reliability score. Multiple cancellations may result in account review or suspension.</li>
          </ul>
        </section>

        <section>
          <h2>4. Rescheduling</h2>
          <p>
            Both parties should agree on a new date within 14 days of the original shoot. Existing deposits will roll over.
            If no new date is confirmed, the cancellation rules above apply.
          </p>
        </section>

        <section>
          <h2>5. Force majeure</h2>
          <p>
            In the event of natural disasters, public emergencies, or other uncontrollable events, Momentrix will assist in
            rescheduling without additional platform fees. Any direct costs already incurred (travel, production rentals)
            are settled between the client and photographer.
          </p>
        </section>

        <section>
          <h2>6. How to request a cancellation</h2>
          <p>
            Email{" "}
            <a className="text-brand-200" href="mailto:support@momentrix.in">
              support@momentrix.in
            </a>{" "}
            with your booking ID, reason for cancellation, and supporting documentation. Our team will respond within one
            business day with next steps.
          </p>
        </section>

        <section>
          <h2>7. Dispute resolution</h2>
          <p>
            For disagreements about refunds or service delivery, Momentrix may mediate based on chat transcripts,
            contracts, and deliverables. We aim for fair outcomes but do not guarantee arbitration beyond platform fees.
          </p>
        </section>
      </section>
    </article>
  );
}

