import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-face",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://paliibo.github.io/mark-map";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mark Map — plan a route, share it as a link",
    template: "%s · Mark Map",
  },
  description:
    "A keyless, local-first map and trip planner. Drop pins, let it order your stops into the shortest route, and share the whole thing as a single URL. No account, no API keys, no backend.",
  applicationName: "Mark Map",
  keywords: [
    "map",
    "trip planner",
    "route optimiser",
    "MapLibre",
    "OpenStreetMap",
    "GPX",
    "GeoJSON",
    "local-first",
  ],
  authors: [{ name: "paliibo", url: "https://github.com/paliibo" }],
  openGraph: {
    type: "website",
    title: "Mark Map — plan a route, share it as a link",
    description: "Drop pins, optimise the order, export GPX. Local-first, no API keys, no backend.",
    siteName: "Mark Map",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mark Map",
    description: "Plan a route, optimise it, share it as a link. No keys, no backend.",
  },
};

export const viewport: Viewport = {
  themeColor: "#060911",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="bg-canvas text-ink min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
