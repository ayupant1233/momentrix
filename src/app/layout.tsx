import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/providers";
import { defaultLocale, type Locale } from "@/i18n/config";
import { loadMessages } from "@/lib/i18n";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Momentrix | Find Photographers Around You",
  description:
    "Discover verified photographers, explore immersive portfolios, and book creatives near you on Momentrix.",
  metadataBase: new URL("https://momentrix.vercel.app"),
  openGraph: {
    title: "Momentrix",
    description:
      "Location-aware marketplace for photographers and clients with immersive portfolios and instant booking.",
    url: "https://momentrix.vercel.app",
    siteName: "Momentrix",
    images: [
      {
        url: "https://momentrix.vercel.app/og-cover.png",
        width: 1200,
        height: 630,
        alt: "Momentrix hero preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Momentrix",
    description:
      "Discover verified photographers, explore portfolios, and book creatives near you.",
    creator: "@momentrix",
    images: ["https://momentrix.vercel.app/og-cover.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get locale from cookie or use default
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || defaultLocale;
  const messages = await loadMessages(locale);

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
