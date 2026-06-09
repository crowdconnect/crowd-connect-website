import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crowd.Connect · Mach deine Bar interaktiv.",
  description:
    "Crowd.Connect ist das Betreiber-System für interaktive Bars: digitale Speisekarte, Drink-to-Table, TV-Games, Music Voting und GEMA-Dokumentation.",
  metadataBase: new URL("https://crowd-connect.de"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Crowd.Connect · Mach deine Bar interaktiv.",
    description:
      "Das Betreiber-System für moderne Bars und Venues. Mehr Umsatz, mehr Stammkunden, weniger Ärger mit GEMA.",
    type: "website",
    url: "https://crowd-connect.de/",
    images: [{ url: "/hero-poster.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/hero-poster.jpg"],
  },
  icons: {
    icon: "/CrowdConnect-icon.png",
    apple: "/CrowdConnect-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0E18",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Chathura:wght@700;800&family=Oswald:wght@400;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/classic.css" />
        <style>{`
          .hero:has(+ .product-choice + .product-scroll-section) {
            align-items: flex-end;
            min-height: auto;
            padding-top: 140px;
            padding-bottom: 1.25rem;
          }
          .product-scroll-section {
            margin-top: 0;
            padding-top: 0;
          }
          .product-scroll-section .kicker-mono {
            margin-bottom: 0.75rem;
          }
          @media (min-width: 768px) {
            .hero:has(+ .product-choice + .product-scroll-section) {
              padding-top: 160px;
              padding-bottom: 1.5rem;
            }
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
