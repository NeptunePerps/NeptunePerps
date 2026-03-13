"use client";

import { TOKENS, type MarketPriceData } from "@/components/market-data-provider";

export interface WatchlistItem {
  symbol: string;
  label?: string;
  color: string;
  price: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
  logo?: string;
  coingeckoId?: string;
}

function formatPrice(price: number): string {
  if (price >= 10000) return price.toFixed(0);
  if (price >= 100) return price.toFixed(1);
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  if (price > 0) return price.toFixed(6);
  return "—";
}

function buildPerpsFromTokens(
  prices: Record<string, MarketPriceData>
): WatchlistItem[] {
  return TOKENS.slice(0, 12).map((token) => {
    const data = prices[token.id];
    const price = data?.price ?? 0;
    const change24h = data?.change24h ?? 0;
    const isPositive = change24h >= 0;
    const changeAbs = Math.abs(change24h);
    const changeVal = price && change24h !== 0 ? (price * changeAbs) / 100 : 0;
    return {
      symbol: token.symbol,
      label: token.label,
      color: "transparent",
      logo: token.logo,
      coingeckoId: token.id,
      price: formatPrice(price),
      change: price ? (isPositive ? "+" : "") + changeVal.toFixed(2) : "—",
      changePercent: price ? (isPositive ? "+" : "") + change24h.toFixed(2) + "%" : "—",
      isPositive,
    };
  });
}

function WatchlistSection({
  title,
  items,
  selectedMarket,
  onSelect,
}: {
  title: string;
  items: WatchlistItem[];
  selectedMarket?: string;
  onSelect?: (label: string) => void;
}) {
  return (
    <div className="mb-3">
      <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 px-1">
        {title}
      </div>
      <div className="flex flex-col">
        {items.map((item, idx) => {
          const isSelected = item.label === selectedMarket;
          return (
            <button
              type="button"
              key={`${item.label ?? item.symbol}-${idx}`}
              onClick={() => item.label && onSelect?.(item.label)}
              className={`w-full flex items-center justify-between px-2 py-2 rounded-lg transition-colors text-left ${
                isSelected
                  ? "bg-surface border border-border"
                  : "hover:bg-surface-hover border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center overflow-hidden shrink-0 bg-surface border border-border">
                  {item.logo ? (
                    <img
                      src={item.logo}
                      alt={item.symbol}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (e.currentTarget as HTMLElement).parentElement
                          ?.querySelector(".watchlist-fallback")
                          ?.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  <span
                    className={`text-[7px] font-bold text-foreground ${
                      item.logo ? "hidden watchlist-fallback" : ""
                    }`}
                  >
                    {item.symbol.slice(0, 2)}
                  </span>
                </div>
                <span className="text-xs text-foreground font-mono">
                  {item.label ?? item.symbol}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-foreground font-mono tabular-nums">
                  ${item.price}
                </span>
                <span
                  className={`text-[11px] font-mono w-14 text-right tabular-nums ${
                    item.changePercent.startsWith("-")
                      ? "text-loss"
                      : "text-gain"
                  }`}
                >
                  {item.changePercent}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface WatchlistProps {
  selectedMarket?: string;
  onMarketSelect?: (market: string) => void;
  prices?: Record<string, MarketPriceData>;
  indices?: WatchlistItem[];
  perps?: WatchlistItem[];
}

export function Watchlist({
  selectedMarket,
  onMarketSelect,
  prices = {},
  indices,
  perps,
}: WatchlistProps) {
  const perpsList = perps ?? buildPerpsFromTokens(prices);

  return (
    <div className="p-4 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h3 className="text-sm font-semibold text-foreground">Watchlist</h3>
        <div className="flex items-center gap-1">
          <button
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface"
            aria-label="Add"
          >
            <span className="text-xs font-mono">+</span>
          </button>
          <button
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface"
            aria-label="Grid"
          >
            <span className="text-xs">⊞</span>
          </button>
          <button
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface"
            aria-label="Settings"
          >
            <span className="text-xs">⚙</span>
          </button>
        </div>
      </div>

      <div className="max-h-[200px] overflow-y-auto min-h-0">
        <WatchlistSection
          title="PERPS"
          items={perpsList}
          selectedMarket={selectedMarket}
          onSelect={onMarketSelect}
        />
        {indices && indices.length > 0 && (
          <WatchlistSection
            title="INDICES"
            items={indices}
            selectedMarket={selectedMarket}
            onSelect={onMarketSelect}
          />
        )}
      </div>
    </div>
  );
}
