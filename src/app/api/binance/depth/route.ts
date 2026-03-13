import { NextRequest, NextResponse } from "next/server";

const BINANCE = "https://api.binance.com";
const KRAKEN = "https://api.kraken.com/0/public/Depth";

/** Kraken pair names (spot). */
const KRAKEN_PAIR: Record<string, string> = {
  SOL: "SOLUSD",
  BTC: "XXBTZUSD",
  ETH: "XETHZUSD",
  DOGE: "XDGUSD",
  MATIC: "MATICUSD",
  ARB: "ARBUSD",
  BNB: "BNBUSD",
  SUI: "SUIUSD",
  PEPE: "PEPEUSD",
  WIF: "WIFUSD",
  JUP: "JUPUSD",
  APT: "APTUSD",
  RNDR: "RNDRUSD",
  PYTH: "PYTHUSD",
  JTO: "JTOUSD",
};

/** Order book: Binance first, Kraken fallback. No cache for live data. */
export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol")?.toUpperCase() || "SOL";
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 10, 100);
  const binanceSymbol = `${symbol}USDT`;

  try {
    const res = await fetch(
      `${BINANCE}/api/v3/depth?symbol=${binanceSymbol}&limit=${limit}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        bids: (data.bids || []).map(([p, q]: string[]) => [Number(p), Number(q)]),
        asks: (data.asks || []).map(([p, q]: string[]) => [Number(p), Number(q)]),
      });
    }
  } catch {
    // fall through to Kraken
  }

  const krakenPair = KRAKEN_PAIR[symbol] || `${symbol}USD`;
  try {
    const res = await fetch(
      `${KRAKEN}?pair=${krakenPair}&count=${Math.min(limit, 25)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return NextResponse.json({ error: "Depth unavailable" }, { status: 502 });
    const data = await res.json();
    const pairKey = data.result && typeof data.result === "object" && !Array.isArray(data.result)
      ? Object.keys(data.result).find((k) => k !== "last") ?? krakenPair
      : krakenPair;
    const book = data.result?.[pairKey];
    if (!book) return NextResponse.json({ error: "Kraken pair not found" }, { status: 404 });
    const bids = (book.bids || []).map(([p, q]: string[]) => [Number(p), Number(q)]).slice(0, limit);
    const asks = (book.asks || []).map(([p, q]: string[]) => [Number(p), Number(q)]).slice(0, limit);
    return NextResponse.json({ bids, asks });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch order book" },
      { status: 500 }
    );
  }
}
