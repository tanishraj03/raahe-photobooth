import type { Metadata, Viewport } from "next";
import { League_Spartan } from "next/font/google";
import { EVENT } from "@/lib/config/event";
import "./globals.css";

/**
 * League Spartan is the Raahe brand typeface. Next downloads and
 * self-hosts it at build time, so there is no request to Google when
 * someone opens the app — it loads fast even on venue wifi.
 */
const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  variable: "--font-league-spartan",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${EVENT.name} · Photobooth`,
  description: EVENT.tagline,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Raahe Photobooth",
  },
  openGraph: {
    title: `${EVENT.name} · Photobooth`,
    description: EVENT.tagline,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#212121",
  // Lets the app paint behind the notch and the home indicator.
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  // Stops iOS zooming in when someone double-taps a button mid-shoot.
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={leagueSpartan.variable}>
      <body className="bg-ink text-paper antialiased">{children}</body>
    </html>
  );
}