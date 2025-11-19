import { getLocale } from "next-intl/server";
import { defaultLocale, type Locale } from "@/i18n/config";

/**
 * Get the current locale, falling back to default
 */
export async function getCurrentLocale(): Promise<Locale> {
  try {
    const locale = await getLocale();
    return (locale as Locale) || defaultLocale;
  } catch {
    return defaultLocale;
  }
}

/**
 * Load messages for a given locale
 */
export async function loadMessages(locale: Locale) {
  try {
    return (await import(`../../messages/${locale}.json`)).default;
  } catch {
    // Fallback to English if locale file doesn't exist
    return (await import(`../../messages/${defaultLocale}.json`)).default;
  }
}

