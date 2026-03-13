import type { Metadata, Viewport } from "next";
import AppLayoutClient from "@/components/app-layout-client";
import { SITE_URL, OG_IMAGE, OG_IMAGE_DIMS } from "@/lib/site";

const APP_PATH = "/app";
const APP_URL = `${SITE_URL}${APP_PATH}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: "Neptune | Trading Terminal & Devnet Lab",
  description:
    "Gasless perps trading and free devnet market launches. Trade with $0 network fees, launch Percolator markets for free. Proof Pages and PropAMM.",

  applicationName: "Neptune",

  alternates: {
    canonical: APP_PATH,
  },

  openGraph: {
    title: "Neptune | Trading Terminal & Devnet Lab",
    description:
      "Gasless perps trading and free devnet market launches. Trade with $0 network fees, launch Percolator markets for free. Proof Pages and PropAMM.",
    url: APP_URL,
    siteName: "Neptune",
    images: [
      {
        url: OG_IMAGE,
        ...OG_IMAGE_DIMS,
        alt: "Neptune — Trading Terminal & Devnet Lab",
        type: "image/png",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Neptune | Trading Terminal & Devnet Lab",
    description:
      "Gasless perps trading and free devnet market launches. Trade with $0 network fees, launch Percolator markets for free. Proof Pages and PropAMM.",
    site: "@NeptunePerps",
    creator: "@NeptunePerps",
    images: [
      { url: OG_IMAGE, ...OG_IMAGE_DIMS, alt: "Neptune — Trading Terminal & Devnet Lab" },
    ],
  },

  keywords: [
    "Neptune",
    "perps",
    "perpetual futures",
    "Solana",
    "trading terminal",
    "perp terminal",
    "devnet lab",
    "permissionless markets",
    "Percolator",
    "launch perps markets",
    "on-chain receipts",
    "proof",
    "keeper crank",
    "vAMM",
    "DeFi",
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
  themeColor: "#030407", // Neptune deep background
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppLayoutClient>{children}</AppLayoutClient>;
}