"use client";

import { useState, memo } from "react";
import { useMarketData, TOKENS, type TokenMeta } from "./market-data-provider";
import { usePriceHistoryFor } from "@/hooks/use-price-history";
import { Sparkline } from "./sparkline";
import { cn } from "@/lib/utils";

const formatPrice = (p: number) => {
  if (p >= 10000) return `$${p.toFixed(0)}`;
  if (p >= 100) return `$${p.toFixed(1)}`;
  if (p >= 1) return `$${p.toFixed(2)}`;
  if (p >= 0.01) return `$${p.toFixed(4)}`;
  return `$${p.toFixed(6)}`;
};

const MarketRow = memo(function MarketRow({
  token,
  selected,
  onSelect,
  price,
}: {
  token: TokenMeta;
  selected: boolean;
  onSelect: () => void;
  price: number;
}) {
  const sparkData = usePriceHistoryFor(token.id);

  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between px-3 py-2 text-left transition-all",
        "bg-white/[0.01] hover:bg-white/[0.03]",
        "border border-transparent rounded-xl",
        selected && "border-primary/40 bg-primary/5 shadow-[0_0_0_1px_rgba(0,229,255,0.25)]"
      )}
    >
      <div className="flex items-center gap-2.5">
        <img
          src={token.logo}
          alt={token.symbol}
          className="w-[22px] h-[22px] rounded-full shrink-0"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="text-xs font-semibold text-foreground font-mono leading-tight tracking-wide">
          {token.symbol}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Sparkline data={sparkData} width={40} height={14} />
        <div className="text-right min-w-[52px]">
          <span className="text-[11px] font-mono text-foreground font-semibold tabular-nums">
            {price > 0 ? formatPrice(price) : "--"}
          </span>
        </div>
      </div>
    </button>
  );
});

export function MarketSidebar({
  selectedMarket,
  onSelect,
}: {
  selectedMarket: string;
  onSelect: (label: string, coingeckoId: string) => void;
}) {
  const { prices, loaded } = useMarketData();
  const [search, setSearch] = useState("");

  const filtered = search
    ? TOKENS.filter(
        (m) =>
          m.label.toLowerCase().includes(search.toLowerCase()) ||
          m.symbol.toLowerCase().includes(search.toLowerCase())
      )
    : TOKENS;

  return (
    <div className="w-[210px] xl:w-[250px] border-r border-border/60 flex flex-col bg-card/80 backdrop-blur-xl shrink-0">
      <div className="border-b border-border/60 px-3 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Markets
          </span>
          <span className="text-[9px] font-mono text-muted-foreground/60">
            {TOKENS.length} pairs
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface/80 px-2.5 py-1.5">
          <svg
            className="w-3 h-3 text-muted-foreground/60 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search markets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-xs text-foreground font-mono outline-none placeholder:text-muted-foreground/50 min-w-0"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-1.5">
        {!loaded ? (
          <div className="flex flex-col gap-1 p-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded bg-muted/30 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((m) => (
              <MarketRow
                key={m.id}
                token={m}
                selected={selectedMarket === m.label}
                onSelect={() => onSelect(m.label, m.id)}
                price={prices[m.id]?.price ?? 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
