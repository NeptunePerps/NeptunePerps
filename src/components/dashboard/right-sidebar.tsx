"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { StockInfo } from "./stock-info";
import { PerformancePanel } from "./performance-panel";
import { TechnicalsPanel } from "./technicals-panel";
import { Watchlist } from "./watchlist";
import { TradingPanel } from "@/components/trading-panel";
import { AccountPanel } from "@/components/account-panel";
import { useMarketData, TOKENS } from "@/components/market-data-provider";

interface RightSidebarProps {
  symbol?: string;
  name?: string;
  price?: string;
  change?: string;
  changePercent?: string;
  lastUpdate?: string;
  newsHeadline?: string;
  newsTime?: string;
  currentMarket?: string;
  markPrice?: number;
  marketOptions?: string[];
  onMarketSelect?: (market: string) => void;
  children?: React.ReactNode;
}

export function RightSidebar({
  symbol = "SOL",
  name = "Solana Perpetual",
  price = "0.00",
  change = "0.00",
  changePercent = "0.00%",
  lastUpdate = "—",
  newsHeadline,
  newsTime = "15m ago",
  currentMarket = "SOL-PERP",
  markPrice = 0,
  marketOptions,
  onMarketSelect,
  children,
}: RightSidebarProps) {
  const { prices } = useMarketData();
  const wallet = useWallet();
  const logo = TOKENS.find((t) => t.label === currentMarket)?.logo;

  return (
    <aside className="w-full lg:w-[300px] shrink-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-2">
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <StockInfo
          symbol={symbol}
          name={name}
          price={price}
          change={change}
          changePercent={changePercent}
          lastUpdate={lastUpdate}
          newsHeadline={newsHeadline}
          newsTime={newsTime}
          logo={logo}
          marketOptions={marketOptions}
          selectedMarket={currentMarket}
          onMarketSelect={onMarketSelect}
        />
      </div>
      {/* Buy/sell panel right under asset – primary action when connected */}
      {children ?? (
        <>
          <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col shrink-0">
            <TradingPanel currentMarket={currentMarket} markPrice={markPrice} />
          </div>
        </>
      )}
      <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden">
        <PerformancePanel />
      </div>
      <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden">
        <TechnicalsPanel />
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden md:col-span-2 lg:col-span-1">
        <Watchlist
          selectedMarket={currentMarket}
          onMarketSelect={onMarketSelect}
          prices={prices}
        />
      </div>
      {!children && wallet.publicKey && (
        <div className="bg-card rounded-xl overflow-hidden md:col-span-2 lg:col-span-1">
          <AccountPanel />
        </div>
      )}
    </aside>
  );
}
