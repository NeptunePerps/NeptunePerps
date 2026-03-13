"use client";

import Link from "next/link";
import { WalletHeader } from "@/components/wallet-header";
import { NeptuneLogo } from "@/components/neptune-logo";

interface TopNavbarProps {
  symbol?: string;
  unifiedBalance?: string;
  unifiedChangePercent?: string;
  fundingBalance?: string;
  fundingChangePercent?: string;
  marketOptions?: string[];
  selectedMarket?: string;
  onMarketSelect?: (market: string) => void;
  onSymbolClick?: () => void;
  /** When true, show DEVNET pill and "perps · devnet" (used on devnet/launch/mint). */
  isDevnet?: boolean;
}

export function TopNavbar({
  symbol = "SOL-PERP",
  unifiedBalance = "$0.00",
  unifiedChangePercent = "0%",
  fundingBalance = "$0.00",
  fundingChangePercent = "0%",
  isDevnet = false,
}: TopNavbarProps) {
  return (
    <header className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center h-14 sm:h-16 md:h-20 px-2.5 sm:px-4 bg-background shrink-0 gap-2">
      <nav className="hidden md:flex items-center gap-0.5">
        <Link href="/app/mainnet" className={`px-2.5 py-1 rounded text-[12px] font-medium transition ${!isDevnet ? "text-foreground bg-surface" : "text-muted-foreground hover:text-foreground hover:bg-surface"}`}>Trade</Link>
        <Link href="/app/devnet" className={`px-2.5 py-1 rounded text-[12px] font-medium transition ${isDevnet ? "text-foreground bg-surface" : "text-muted-foreground hover:text-foreground hover:bg-surface"}`}>Devnet</Link>
        <Link href="/app/devnet/launch" className="px-2.5 py-1 rounded text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition">Launch</Link>
        <Link href="/app/devnet/mint" className="px-2.5 py-1 rounded text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition">Mint</Link>
      </nav>
      <Link href="/" className="flex items-center justify-center shrink-0" aria-label="Neptune home">
        <NeptuneLogo size="lg" className="h-10 w-10 sm:h-14 sm:w-14 md:h-[72px] md:w-[72px] lg:h-24 lg:w-24" />
      </Link>
      <div className="flex items-center justify-end gap-1.5 sm:gap-2 md:gap-3 min-w-0">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-primary text-primary-foreground">
          {isDevnet ? "DEVNET" : "MAINNET"}
        </span>
        <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-medium bg-primary text-primary-foreground" title="Network fees are $0 on Neptune">
          Network fee: $0
        </span>
        <div className="hidden md:block w-px h-4 bg-border" />
        <WalletHeader />
      </div>
    </header>
  );
}
