import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { SITE_URL, OG_IMAGE, OG_IMAGE_DIMS } from "@/lib/site";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  title: {
    default: "Neptune | 100% Gasless Permissionless Perps on Solana",
    template: "%s | Neptune",
  },
  description:
    "Trade permissionless perpetuals on Solana with Neptune. Launch zero-cost Percolator perps with 100% gasless trading and 100% free market creation.",
  applicationName: "Neptune",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Neptune | 100% Gasless Permissionless Perps on Solana",
    description:
      "Trade permissionless perpetuals on Solana. Launch zero-cost Percolator perps with 100% gasless trading and 100% free market creation.",
    url: SITE_URL,
    siteName: "Neptune",
    images: [
      {
        url: OG_IMAGE,
        ...OG_IMAGE_DIMS,
        alt: "Neptune — 100% Gasless Permissionless Perps on Solana",
        type: "image/png",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Neptune | 100% Gasless Permissionless Perps on Solana",
    description:
      "Trade permissionless perpetuals on Solana. Launch zero-cost Percolator perps with 100% gasless trading and 100% free market creation.",
    site: "@NeptunePerps",
    creator: "@NeptunePerps",
    images: [
      {
        url: OG_IMAGE,
        ...OG_IMAGE_DIMS,
        alt: "Neptune — 100% Gasless Permissionless Perps on Solana",
      },
    ],
  },
  keywords: [
    "Neptune",
    "permissionless perps",
    "gasless perps",
    "Solana perps",
    "perpetuals trading",
    "perps trading terminal",
    "Percolator",
    "zero-cost perps",
    "free market launch",
    "gasless trading",
    "onchain perpetuals",
    "DeFi trading",
    "permissionless trading",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#030407",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}