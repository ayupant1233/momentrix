'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import clsx from 'clsx';
import { LanguageSwitcher } from './language-switcher';

type NavItem = {
  label: string;
  href: string;
  match?: (path: string) => boolean;
};

function buildNavItems(role?: string): { items: NavItem[]; primaryCta: { label: string; href: string } | null } {
  if (role === 'PHOTOGRAPHER') {
    return {
      items: [
        { label: 'Dashboard', href: '/photographer/dashboard' },
        { label: 'Portfolio', href: '/studio/portfolio' },
        { label: 'Posts', href: '/studio/posts' },
        { label: 'Availability', href: '/studio/availability' },
        { label: 'Analytics', href: '/studio/analytics' },
        { label: 'Bookings', href: '/bookings' },
        { label: 'Messages', href: '/messages' },
      ],
      primaryCta: { label: 'Update availability', href: '/studio/availability' },
    };
  }

  return {
    items: [
      { label: 'Dashboard', href: '/client/dashboard' },
      { label: 'Discover', href: '/discover' },
      { label: 'Shortlist', href: '/shortlist' },
      { label: 'Bookings', href: '/bookings' },
      { label: 'Messages', href: '/messages' },
      { label: 'Verification', href: '/settings/verification' },
    ],
    primaryCta: { label: 'Create brief', href: '/bookings/new' },
  };
}

export default function DashboardNav() {
  const { data, status } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (status === "loading" || !data?.user) {
    return null;
  }

  // Ensure role is correctly typed and handle case sensitivity
  const userRole = data.user.role?.toUpperCase();
  const { items, primaryCta } = buildNavItems(userRole);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-midnight-950/80 backdrop-blur-md">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white shadow-soft-glow">
              Momentrix
            </span>
          </Link>
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-slate-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-400 sm:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
          >
            Menu
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="fill-current">
              <path d="M2 4h12v1.5H2zM2 7.25h12v1.5H2zM2 10.5h12V12H2z" />
            </svg>
          </button>
        </div>

        <div className="hidden items-center gap-6 text-sm font-medium text-slate-200 sm:flex">
          {items.map((item) => {
            const active = item.match ? item.match(pathname) : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'rounded-full px-4 py-2 transition',
                  active ? 'bg-white/10 text-white' : 'hover:text-brand-200'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <LanguageSwitcher />
          {primaryCta ? (
            <Link
              href={primaryCta.href}
              className="rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-soft-glow transition hover:from-brand-300 hover:to-brand-500"
            >
              {primaryCta.label}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-brand-400/60 hover:text-brand-100"
          >
            Log out
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <div className="border-t border-white/5 bg-midnight-950/95 px-4 pb-4 sm:hidden">
          <div className="flex flex-col gap-2 text-sm font-medium text-slate-200">
            {items.map((item) => {
              const active = item.match ? item.match(pathname) : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'rounded-full px-4 py-2 transition',
                    active ? 'bg-white/10 text-white' : 'hover:text-brand-200'
                  )}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            {primaryCta ? (
              <Link
                href={primaryCta.href}
                className="rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-soft-glow transition hover:from-brand-300 hover:to-brand-500"
                onClick={() => setMenuOpen(false)}
              >
                {primaryCta.label}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                signOut({ callbackUrl: '/' });
              }}
              className="rounded-full border border-white/15 px-4 py-2 text-left text-sm font-medium text-slate-200 transition hover:border-brand-400/60 hover:text-brand-100"
            >
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

