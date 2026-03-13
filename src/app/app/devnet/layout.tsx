import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE, OG_IMAGE_DIMS } from "@/lib/site";

const DEVNET_PATH = "/app/devnet";
const DEVNET_URL = `${SITE_URL}${DEVNET_PATH}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Neptune | 100% Gasless Permissionless Perps on Solana",
  description:
    "Trade permissionless perpetuals on Solana with Neptune. Launch zero-cost Percolator perps with 100% gasless trading and 100% free market creation.",
  applicationName: "Neptune",
  alternates: {
    canonical: DEVNET_PATH,
  },
  openGraph: {
    title: "Neptune | 100% Gasless Permissionless Perps on Solana",
    description:
      "Trade permissionless perpetuals on Solana. Launch zero-cost Percolator perps with 100% gasless trading and 100% free market creation.",
    url: DEVNET_URL,
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

export default function DevnetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="devnet-layout font-sans text-base min-h-full w-full flex flex-col items-center mt-5">
      {children}
    </div>
  );
}
