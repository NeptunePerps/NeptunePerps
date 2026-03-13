"use client";

import { useEffect, useState } from "react";

/**
 * Advanced market stats below Positions & history. Data from Binance 24h ticker.
 */

function formatVol(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  return v.toFixed(2);
}

function formatPrice(p: string | number): string {
  const n = Number(p);
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
}

function formatCount(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

export function MarketStatsSection({
  symbol = "SOL-PERP",
  baseSymbol = "SOL",
}: {
  symbol?: string;
  baseSymbol?: string;
}) {
  const [data, setData] = useState<{
    lastPrice?: string;
    volume?: string;
    quoteVolume?: string;
    priceChange?: string;
    priceChangePercent?: string;
    highPrice?: string;
    lowPrice?: string;
    weightedAvgPrice?: string;
    count?: string;
    bidPrice?: string;
    askPrice?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const base = baseSymbol || symbol.replace(/-PERP$/i, "");

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetch(`/api/binance/ticker24h?symbol=${base}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.error) {
          setError(d.error);
          setData(null);
        } else {
          setData({
            lastPrice: formatPrice(d.lastPrice),
            volume: formatVol(Number(d.volume || 0)),
            quoteVolume: formatVol(Number(d.quoteVolume || 0)),
            priceChange: d.priceChange != null ? formatPrice(d.priceChange) : undefined,
            priceChangePercent: d.priceChangePercent != null ? `${Number(d.priceChangePercent).toFixed(2)}%` : undefined,
            highPrice: formatPrice(d.highPrice || 0),
            lowPrice: formatPrice(d.lowPrice || 0),
            weightedAvgPrice: d.weightedAvgPrice != null ? formatPrice(d.weightedAvgPrice) : undefined,
            count: d.count != null ? formatCount(Number(d.count)) : undefined,
            bidPrice: d.bidPrice != null ? formatPrice(d.bidPrice) : undefined,
            askPrice: d.askPrice != null ? formatPrice(d.askPrice) : undefined,
          });
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load");
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [base, baseSymbol, symbol]);

  const isPositive = data?.priceChangePercent != null && !data.priceChangePercent.startsWith("-");

  const StatCell = ({
    label,
    value,
    valueClass,
  }: {
    label: string;
    value: string | undefined;
    valueClass?: string;
  }) => (
    <div className="bg-card px-3 py-2.5 flex flex-col justify-center border-r border-b border-border">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
        {label}
      </span>
      <span className={`text-sm font-mono font-semibold mt-0.5 tabular-nums ${valueClass ?? "text-foreground"}`}>
        {loading ? "—" : (value ?? "—")}
      </span>
    </div>
  );

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-2 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Market stats</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">{symbol}</p>
        </div>
        {error && (
          <span className="text-[10px] sm:text-xs text-amber-500/90 max-w-[200px] sm:max-w-none truncate sm:whitespace-normal" title={error}>
            {error.length > 50 ? `${error.slice(0, 48)}…` : error}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 [&>div:nth-child(2n)]:border-r-0 sm:[&>div:nth-child(2n)]:border-r sm:[&>div:nth-child(4n)]:border-r-0 lg:[&>div:nth-child(4n)]:border-r lg:[&>div:nth-child(5n)]:border-r-0">
        <StatCell label="24h Volume" value={data?.quoteVolume} />
        <StatCell label="24h High" value={data?.highPrice} />
        <StatCell label="24h Low" value={data?.lowPrice} />
        <StatCell
          label="24h Change"
          value={data?.priceChangePercent ?? data?.priceChange}
          valueClass={data?.priceChangePercent ? (isPositive ? "text-gain" : "text-loss") : undefined}
        />
        <StatCell label="Last" value={data?.lastPrice} />
        <StatCell label="24h Trades" value={data?.count} />
        <StatCell label="W. Avg" value={data?.weightedAvgPrice} />
        <StatCell label="Bid" value={data?.bidPrice} valueClass="text-gain" />
        <StatCell label="Ask" value={data?.askPrice} valueClass="text-loss" />
      </div>
    </div>
  );
}
