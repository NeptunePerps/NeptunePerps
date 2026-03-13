import { NextRequest, NextResponse } from "next/server";

const BINANCE = "https://api.binance.com";
const KRAKEN = "https://api.kraken.com/0/public/Trades";

const KRAKEN_PAIR: Record<string, string> = {
  SOL: "SOLUSD", BTC: "XXBTZUSD", ETH: "XETHZUSD", DOGE: "XDGUSD",
  MATIC: "MATICUSD", ARB: "ARBUSD", BNB: "BNBUSD", SUI: "SUIUSD",
  PEPE: "PEPEUSD", WIF: "WIFUSD", JUP: "JUPUSD", APT: "APTUSD",
  RNDR: "RNDRUSD", PYTH: "PYTHUSD", JTO: "JTOUSD",
};

/** Recent trades: Binance first, Kraken fallback. No cache. */
export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol")?.toUpperCase() || "SOL";
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 25, 100);
  const binanceSymbol = `${symbol}USDT`;

  try {
    const res = await fetch(
      `${BINANCE}/api/v3/trades?symbol=${binanceSymbol}&limit=${limit}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      const trades = (data || []).map((t: { price: string; qty: string; time: number; isBuyerMaker: boolean }) => ({
        price: Number(t.price),
        size: Number(t.qty),
        side: t.isBuyerMaker ? "sell" as const : "buy" as const,
        time: new Date(t.time).toLocaleTimeString("en-GB", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      }));
      return NextResponse.json({ trades });
    }
  } catch {
    // fall through
  }

  const krakenPair = KRAKEN_PAIR[symbol] || `${symbol}USD`;
  try {
    const res = await fetch(`${KRAKEN}?pair=${krakenPair}&count=${limit}`, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ error: "Trades unavailable" }, { status: 502 });
    const data = await res.json();
    const pairKey = data.result && typeof data.result === "object"
      ? Object.keys(data.result).find((k) => Array.isArray(data.result[k])) ?? krakenPair
      : krakenPair;
    const raw = data.result?.[pairKey] ?? [];
    const trades = (Array.isArray(raw) ? raw : []).slice(0, limit).map((t: [string, string, number, string]) => ({
      price: Number(t[0]),
      size: Number(t[1]),
      side: (t[3] === "b" ? "buy" : "sell") as "buy" | "sell",
      time: new Date((t[2] as number) * 1000).toLocaleTimeString("en-GB", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    }));
    return NextResponse.json({ trades });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch trades" }, { status: 500 });
  }
}
