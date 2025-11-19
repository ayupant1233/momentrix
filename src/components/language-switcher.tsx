"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { locales, localeNames, defaultLocale, type Locale } from "@/i18n/config";
import clsx from "clsx";

export function LanguageSwitcher() {
  const router = useRouter();
  
  // Get locale from cookie on client side using lazy initializer
  const [currentLocale, setCurrentLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return defaultLocale;
    const cookieLocale = document.cookie
      .split("; ")
      .find((row) => row.startsWith("NEXT_LOCALE="))
      ?.split("=")[1] as Locale | undefined;
    return (cookieLocale && locales.includes(cookieLocale)) ? cookieLocale : defaultLocale;
  });

  async function switchLocale(newLocale: Locale) {
    try {
      const res = await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: newLocale }),
      });

      if (res.ok) {
        setCurrentLocale(newLocale);
        router.refresh();
      }
    } catch (error) {
      console.error("[LanguageSwitcher]", error);
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-2 py-1">
      {locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => switchLocale(loc)}
          className={clsx(
            "rounded-full px-3 py-1 text-xs font-semibold transition",
            currentLocale === loc
              ? "bg-brand-500/20 text-brand-100"
              : "text-slate-300 hover:text-white",
          )}
        >
          {localeNames[loc]}
        </button>
      ))}
    </div>
  );
}

