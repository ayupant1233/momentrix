import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Momentrix",
  description: "Understand how Momentrix collects, uses, and protects your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <article className="mx-auto min-h-screen w-full max-w-4xl px-6 py-16 text-slate-100">
      <header className="mb-12 space-y-3">
        <p className="chip w-fit">Legal</p>
        <h1 className="text-4xl font-semibold text-white">Privacy Policy</h1>
        <p className="max-w-2xl text-sm text-slate-300">
          Last updated: {new Date().toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </header>

      <section className="space-y-6 text-sm text-slate-300 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h2]:tracking-wide [&_section]:space-y-3">
        <section>
          <h2>1. Overview</h2>
          <p>
            Momentrix Pvt. Ltd. (&quot;Momentrix&quot;, &quot;we&quot;, &quot;us&quot;) operates a marketplace connecting
            photographers and clients. This policy explains how we collect, use, store, and share personal data across
            our website, applications, and services.
          </p>
        </section>

        <section>
          <h2>2. Information we collect</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <span className="font-semibold text-white">Account information:</span> name, email, phone, social handles,
              business details provided during registration or verification.
            </li>
            <li>
              <span className="font-semibold text-white">Profile &amp; portfolio content:</span> images, reels, stories,
              rates, services, and availability you publish on the platform.
            </li>
            <li>
              <span className="font-semibold text-white">Booking &amp; chat data:</span> briefs, messages, files, and
              transaction metadata exchanged with other users.
            </li>
            <li>
              <span className="font-semibold text-white">Usage information:</span> device identifiers, IP address, log
              files, and product analytics to improve the experience.
            </li>
          </ul>
        </section>

        <section>
          <h2>3. How we use your data</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Deliver core services including discovery, bookings, messaging, and payments.</li>
            <li>Perform identity and follower verification to maintain marketplace trust.</li>
            <li>Send service-related communications, alerts, and marketing updates (with opt-out controls).</li>
            <li>Monitor usage to maintain security, prevent fraud, and improve product performance.</li>
          </ul>
        </section>

        <section>
          <h2>4. Sharing with third parties</h2>
          <p>We work with trusted processors under strict agreements:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Email delivery via Resend for verification codes and notifications.</li>
            <li>Database hosting on Neon/PostgreSQL for secure data storage.</li>
            <li>Authentication services (NextAuth), analytics, and logging to detect issues.</li>
          </ul>
          <p>We never sell personal data. Limited profile info is shared with clients or photographers to fulfill bookings.</p>
        </section>

        <section>
          <h2>5. Data retention &amp; deletion</h2>
          <p>
            We retain account data while your profile is active. You can request deletion via{" "}
            <a className="text-brand-200" href="mailto:privacy@momentrix.in">
              privacy@momentrix.in
            </a>
            . Certain records (e.g., invoices, audit logs) may be preserved for legal or compliance reasons.
          </p>
        </section>

        <section>
          <h2>6. Your rights</h2>
          <p>Depending on your jurisdiction, you may request:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Access to the personal data we hold about you.</li>
            <li>Corrections or updates to inaccurate information.</li>
            <li>Restriction of processing or objection to certain uses.</li>
            <li>Portability of data you have provided in a structured format.</li>
          </ul>
        </section>

        <section>
          <h2>7. Security</h2>
          <p>
            We use industry standards (encryption in transit, role-based access, monitoring) to protect data. No system is
            fully immune; we notify affected users and authorities if a breach occurs.
          </p>
        </section>

        <section>
          <h2>8. Updates</h2>
          <p>
            This policy may change as we add new features or comply with regulations. We’ll announce updates via email or
            in-app notices. Continued use signifies acceptance of the revised policy.
          </p>
        </section>

        <section>
          <h2>9. Contact</h2>
          <p>
            For questions or requests, email{" "}
            <a className="text-brand-200" href="mailto:privacy@momentrix.in">
              privacy@momentrix.in
            </a>{" "}
            or write to: Momentrix Pvt. Ltd., Koramangala, Bengaluru, India.
          </p>
        </section>
      </section>
    </article>
  );
}

