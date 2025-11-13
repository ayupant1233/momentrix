import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
