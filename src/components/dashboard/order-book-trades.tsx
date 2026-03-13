"use client";

import { useEffect, useState, useCallback } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

/**
 * Order book + depth chart + trades. Live-updating via polling.
 * Buy/Sell volume as Performance-style widgets (sparkline + label).
 */

const POLL_MS = 3000;
const BID_ASK_ROWS = 4;
const TRADE_ROWS = 16;
const TRADES_FETCH_LIMIT = 40;
const DEPTH_LEVELS = 12;
const VOL_CHART_BUCKETS = 10;
const FALLBACK_BIDS: [number, number][] = [[86.15, 12.5], [86.12, 8.2], [86.08, 25], [86.05, 5.1]];
const FALLBACK_ASKS: [number, number][] = [[86.18, 6.2], [86.22, 14], [86.25, 9.5], [86.3, 11]];
const FALLBACK_TRADES: { price: number; size: number; side: "buy" | "sell"; time: string }[] = [
  { price: 86.17, size: 1.2, side: "buy", time: "14:32:01" },
  { price: 86.15, size: 0.5, side: "sell", time: "14:32:00" },
  { price: 86.18, size: 2, side: "buy", time: "14:31:59" },
  { price: 86.14, size: 3.1, side: "sell", time: "14:31:58" },
];

function formatPrice(n: number): string {
  if (n >= 1000) return n.toFixed(1);
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
}

function formatSize(n: number): string {
  if (n >= 1000) return n.toFixed(1);
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
}

export function OrderBookAndTrades({
  symbol = "SOL-PERP",
  baseSymbol = "SOL",
}: {
  symbol?: string;
  baseSymbol?: string;
}) {
  const [bids, setBids] = useState<[number, number][]>(FALLBACK_BIDS);
  const [asks, setAsks] = useState<[number, number][]>(FALLBACK_ASKS);
  const [trades, setTrades] = useState<{ price: number; size: number; side: "buy" | "sell"; time: string }[]>(FALLBACK_TRADES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const base = baseSymbol || symbol.replace(/-PERP$/i, "");

  const fetchData = useCallback(() => {
    Promise.all([
      fetch(`/api/binance/depth?symbol=${base}&limit=${DEPTH_LEVELS}`).then((r) => r.json()),
      fetch(`/api/binance/trades?symbol=${base}&limit=${TRADES_FETCH_LIMIT}`).then((r) => r.json()),
    ]).then(([depthRes, tradesRes]) => {
      if (depthRes.bids?.length && depthRes.asks?.length) {
        setBids(depthRes.bids);
        setAsks(depthRes.asks);
        setError(null);
      } else if (depthRes.error) setError(depthRes.error);
      if (tradesRes.trades?.length) setTrades(tradesRes.trades);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [base]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  const displayBids = bids.slice(0, BID_ASK_ROWS);
  const displayAsks = asks.slice(0, BID_ASK_ROWS);
  const displayTrades = trades.slice(0, TRADE_ROWS);

  // Depth chart: cumulative size for bars (use same levels as table + a few more)
  const bidTotal = bids.reduce((s, [, q]) => s + q, 0) || 1;
  const askTotal = asks.reduce((s, [, q]) => s + q, 0) || 1;
  const maxTotal = Math.max(bidTotal, askTotal);

  // Buy/sell volume chart: use same trade list as Trades (with fallback), bucket by side
  const tradesForChart = loading && trades.length <= FALLBACK_TRADES.length ? FALLBACK_TRADES : trades;
  const volBuckets = (() => {
    const list = tradesForChart.slice(0, TRADES_FETCH_LIMIT);
    if (list.length === 0) return [];
    const bucketSize = Math.max(1, Math.floor(list.length / VOL_CHART_BUCKETS));
    const out: { buy: number; sell: number }[] = [];
    for (let i = 0; i < VOL_CHART_BUCKETS && i * bucketSize < list.length; i++) {
      const chunk = list.slice(i * bucketSize, (i + 1) * bucketSize);
      const side = (s: string) => String(s).toLowerCase();
      out.push({
        buy: chunk.filter((t) => side(t.side) === "buy").reduce((s, t) => s + (Number(t.size) || 0), 0),
        sell: chunk.filter((t) => side(t.side) === "sell").reduce((s, t) => s + (Number(t.size) || 0), 0),
      });
    }
    return out;
  })();
  const maxVol = Math.max(1, ...volBuckets.flatMap((b) => [b.buy, b.sell]));
  const maxBuy = Math.max(1, ...volBuckets.map((b) => b.buy));
  const maxSell = Math.max(1, ...volBuckets.map((b) => b.sell));
  // Data for Performance-style AreaCharts
  const buySparkData = volBuckets.map((b) => ({ v: maxBuy > 0 ? (b.buy / maxBuy) * 100 : 0 }));
  const sellSparkData = volBuckets.map((b) => ({ v: maxSell > 0 ? (b.sell / maxSell) * 100 : 0 }));
  const combinedSparkData = volBuckets.map((b) => ({ v: maxVol > 0 ? ((b.buy + b.sell) / maxVol) * 50 : 0 }));
  const totalBuy = volBuckets.reduce((s, b) => s + b.buy, 0);
  const totalSell = volBuckets.reduce((s, b) => s + b.sell, 0);

  return (
    <div className="w-full lg:w-[160px] xl:w-[180px] shrink-0 self-start border-b lg:border-b-0 lg:border-r border-border flex lg:flex-col bg-card/50 max-h-full overflow-x-auto lg:overflow-y-auto min-h-0">
      {/* Depth chart */}
      <div className="shrink-0 min-w-[150px] sm:min-w-[170px] lg:min-w-0 px-1.5 py-1.5 border-r lg:border-r-0 lg:border-b border-border/80">
        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
          Depth
        </span>
        <div className="mt-1 flex flex-col gap-0.5">
          {displayAsks.slice().reverse().map(([price, size], i) => {
            const pct = (size / maxTotal) * 100;
            return (
              <div key={`a-${i}`} className="flex items-center gap-1 h-2">
                <div
                  className="h-1.5 rounded-r bg-loss/40 min-w-[2px] transition-all duration-300"
                  style={{ width: `${Math.min(pct * 2, 100)}%` }}
                />
                <span className="text-[7px] font-mono text-loss tabular-nums shrink-0 w-8 text-right">{formatPrice(price)}</span>
              </div>
            );
          })}
          <div className="h-0.5 border-t border-border/50 my-0.5" />
          {displayBids.map(([price, size], i) => {
            const pct = (size / maxTotal) * 100;
            return (
              <div key={`b-${i}`} className="flex items-center gap-1 h-2">
                <div
                  className="h-1.5 rounded-r bg-gain/40 min-w-[2px] transition-all duration-300"
                  style={{ width: `${Math.min(pct * 2, 100)}%` }}
                />
                <span className="text-[7px] font-mono text-gain tabular-nums shrink-0 w-8 text-right">{formatPrice(price)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order book table */}
      <div className="shrink-0 min-w-[150px] sm:min-w-[170px] lg:min-w-0 border-r lg:border-r-0">
        <div className="px-1.5 py-1 border-b border-border/80 flex items-center justify-between">
          <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
            Book
          </span>
          {error && <span className="text-[8px] text-destructive" title={error}>!</span>}
        </div>
        <div className="grid grid-cols-2 text-[8px] font-mono">
          <div className="border-r border-border/50">
            {displayBids.map(([price, size], i) => (
              <div
                key={i}
                className="flex justify-between px-1.5 py-0.5 border-b border-border/30 text-gain"
              >
                <span className="tabular-nums truncate">{formatPrice(price)}</span>
                <span className="tabular-nums text-foreground ml-0.5">{formatSize(size)}</span>
              </div>
            ))}
          </div>
          <div>
            {displayAsks.map(([price, size], i) => (
              <div
                key={i}
                className="flex justify-between px-1.5 py-0.5 border-b border-border/30 text-loss"
              >
                <span className="tabular-nums truncate">{formatPrice(price)}</span>
                <span className="tabular-nums text-foreground ml-0.5">{formatSize(size)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trades */}
      <div className="shrink-0 min-w-[150px] sm:min-w-[170px] lg:min-w-0 border-r lg:border-r-0 lg:border-t border-border/80 flex-1 min-h-0">
        <div className="px-1.5 py-0.5 border-b border-border/50">
          <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
            Trades
          </span>
        </div>
        <div className="max-h-[180px] lg:max-h-[220px] overflow-y-auto min-h-[120px]">
          {(loading && trades.length === FALLBACK_TRADES.length ? FALLBACK_TRADES : displayTrades).map((t, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-1.5 py-0.5 border-b border-border/20 text-[8px] font-mono"
            >
              <span className={`tabular-nums truncate ${t.side === "buy" ? "text-gain" : "text-loss"}`}>
                {formatPrice(t.price)}
              </span>
              <span className="tabular-nums text-muted-foreground shrink-0 ml-0.5">{t.time.slice(-8)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Buy / Sell — flex-col, no card bg, gradient inside charts */}
      <div className="shrink-0 min-w-[150px] sm:min-w-[170px] lg:min-w-0 lg:border-t border-border/80 px-1.5 py-1.5 max-h-[180px] lg:max-h-[200px] overflow-y-auto min-h-0">
        <h3 className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          Volume
        </h3>
        <div className="flex flex-col gap-1.5">
          {/* Buys */}
          <div className="group relative flex flex-col overflow-hidden">
            <div className="h-8 w-full">
              {buySparkData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[7px] text-muted-foreground">—</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={buySparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`vol-buys-${base}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.7} />
                        <stop offset="50%" stopColor="#22c55e" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke="#22c55e" strokeWidth={1.5} fill={`url(#vol-buys-${base})`} dot={false} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex items-center justify-between px-1 pb-0.5 pt-0.5">
              <span className="text-[9px] text-muted-foreground font-medium">Buys</span>
              <span className="text-[9px] font-mono font-bold text-gain">{totalBuy > 0 ? totalBuy.toFixed(1) : "—"}</span>
            </div>
          </div>
          {/* Sells */}
          <div className="group relative flex flex-col overflow-hidden">
            <div className="h-8 w-full">
              {sellSparkData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[7px] text-muted-foreground">—</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sellSparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`vol-sells-${base}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.7} />
                        <stop offset="50%" stopColor="#ef4444" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke="#ef4444" strokeWidth={1.5} fill={`url(#vol-sells-${base})`} dot={false} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex items-center justify-between px-1 pb-0.5 pt-0.5">
              <span className="text-[9px] text-muted-foreground font-medium">Sells</span>
              <span className="text-[9px] font-mono font-bold text-loss">{totalSell > 0 ? totalSell.toFixed(1) : "—"}</span>
            </div>
          </div>
          {/* Vol (combined) */}
          <div className="group relative flex flex-col overflow-hidden">
            <div className="h-8 w-full">
              {combinedSparkData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[7px] text-muted-foreground">—</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={combinedSparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`vol-comb-${base}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.7} />
                        <stop offset="50%" stopColor="#94a3b8" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke="#94a3b8" strokeWidth={1.5} fill={`url(#vol-comb-${base})`} dot={false} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex items-center justify-between px-1 pb-0.5 pt-0.5">
              <span className="text-[9px] text-muted-foreground font-medium">Vol</span>
              <span className="text-[9px] font-mono font-bold text-foreground">{(totalBuy + totalSell) > 0 ? (totalBuy + totalSell).toFixed(1) : "—"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
