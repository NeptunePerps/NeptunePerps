"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface StockInfoProps {
  symbol?: string;
  name?: string;
  price?: string;
  change?: string;
  changePercent?: string;
  lastUpdate?: string;
  newsHeadline?: string;
  newsTime?: string;
  /** Coin logo URL (e.g. from CoinGecko) for the selected market */
  logo?: string;
  /** Market selector in header (replaces eyes/copy/settings) */
  marketOptions?: string[];
  selectedMarket?: string;
  onMarketSelect?: (market: string) => void;
}

export function StockInfo({
  symbol = "SOL",
  name = "Solana Perpetual",
  price = "0.00",
  change = "0.00",
  changePercent = "0.00%",
  lastUpdate = "—",
  newsHeadline = "Solana ecosystem updates and perp volume.",
  newsTime = "15m ago",
  logo,
  marketOptions,
  selectedMarket,
  onMarketSelect,
}: StockInfoProps) {
  const [open, setOpen] = useState(false);
  const displaySymbol = (selectedMarket ?? symbol).replace("-PERP", "");
  const isGain = !changePercent.startsWith("-");

  return (
    <div className="p-3 sm:p-4">
      <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface border border-border flex items-center justify-center overflow-hidden shrink-0">
            {logo ? (
              <img src={logo} alt={symbol} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-muted-foreground">{displaySymbol.slice(0, 2)}</span>
            )}
          </div>
          <span className="text-base sm:text-lg font-bold text-foreground">{displaySymbol}</span>
        </div>
        {marketOptions?.length && onMarketSelect && (
          <div className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-surface border border-border text-xs sm:text-sm font-mono text-foreground hover:bg-surface-hover transition-colors"
            >
              <span className="max-w-[64px] sm:max-w-[72px] truncate">{displaySymbol}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            </button>
            {open && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
                <div className="absolute right-0 top-full mt-1 z-50 w-44 max-h-64 overflow-y-auto bg-card border border-border rounded-lg shadow-xl py-1">
                  {marketOptions.map((m) => (
                    <button
                      key={m}
                      onClick={() => { onMarketSelect(m); setOpen(false); }}
                      className={`w-full px-3 py-2 text-left text-sm font-mono transition-colors ${selectedMarket === m ? "bg-surface text-foreground" : "text-muted-foreground hover:bg-surface hover:text-foreground"}`}
                    >
                      {m.replace("-PERP", "")}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div className="mb-2">
        <div className="text-xs text-muted-foreground">{name} <span className="text-foreground/50">·</span> PERP</div>
        <div className="text-xs text-muted-foreground">Perpetual <span className="text-foreground/50">·</span> Drift</div>
      </div>
      <div className="mb-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold text-foreground font-mono">{price}</span>
          <span className="text-sm text-muted-foreground">USD</span>
        </div>
        <div className={`text-xs sm:text-sm font-mono ${isGain ? "text-gain" : "text-loss"}`}>
          {change.startsWith("-") ? "" : "+"}{change} ({changePercent})
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5">Last update {lastUpdate}</div>
      </div>
    </div>
  );
}
