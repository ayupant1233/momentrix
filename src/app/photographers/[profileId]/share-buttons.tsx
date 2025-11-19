"use client";

type ShareButtonsProps = {
  photographerName: string | null;
};

export function ShareButtons({ photographerName }: ShareButtonsProps) {
  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Profile link copied to clipboard.");
    } catch {
      alert("Copy failed. Use your browser menu instead.");
    }
  }

  const emailSubject = `Check out ${photographerName ?? "this photographer"}`;
  const emailBody = window.location.href;
  const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  return (
    <div className="mt-4 flex flex-wrap gap-2 text-xs">
      <button
        type="button"
        onClick={handleCopyLink}
        className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
      >
        Copy link
      </button>
      <a
        href={mailtoLink}
        className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-brand-300/60 hover:text-brand-100"
      >
        Email
      </a>
    </div>
  );
}

