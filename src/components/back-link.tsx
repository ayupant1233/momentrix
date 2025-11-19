'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

type BackLinkProps = {
  href?: string;
  label?: string;
  className?: string;
};

export function BackLink({ href, label = 'Back', className }: BackLinkProps) {
  const router = useRouter();

  if (href) {
    return (
      <Link
        href={href}
        className={`inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-brand-400/60 hover:text-brand-100 ${className ?? ''}`}
      >
        ← {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={`inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-brand-400/60 hover:text-brand-100 ${className ?? ''}`}
    >
      ← {label}
    </button>
  );
}

