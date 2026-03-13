import { NextRequest, NextResponse } from "next/server";

const BINANCE = "https://api.binance.com";

const COINGECKO_IDS: Record<string, string> = {
  SOL: "solana", BTC: "bitcoin", ETH: "ethereum", APT: "aptos", BONK: "bonk",
  MATIC: "matic-network", ARB: "arbitrum", DOGE: "dogecoin", BNB: "binancecoin",
  SUI: "sui", PEPE: "pepe", WIF: "dogwifcoin", JUP: "jupiter-exchange-solana",
  RNDR: "render-token", PYTH: "pyth-network", JTO: "jito-governance-token",
};

/** Binance 24h ticker (volume, high, low, change). Public, no API key. Falls back to CoinGecko when Binance is geo-restricted. */
export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol")?.toUpperCase() || "SOL";
  const binanceSymbol = `${symbol}USDT`;
  try {
    const res = await fetch(
      `${BINANCE}/api/v3/ticker/24hr?symbol=${binanceSymbol}`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = String(err.msg || err.message || "").toLowerCase();
      const isGeoRestriction = msg.includes("restricted") || msg.includes("service unavailable") || msg.includes("eligibility");

      if (isGeoRestriction) {
        const cgId = COINGECKO_IDS[symbol] || "solana";
        try {
          const cgRes = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd&include_24hr_change=true`,
            { cache: "no-store" }
          );
          if (cgRes.ok) {
            const cg = await cgRes.json();
            const token = cg[cgId];
            if (token?.usd != null) {
              const lastPrice = String(token.usd);
              const pct = token.usd_24h_change ?? 0;
              return NextResponse.json({
                symbol: binanceSymbol,
                lastPrice,
                priceChangePercent: String(pct),
                volume: "0", quoteVolume: "0", priceChange: "0",
                highPrice: lastPrice, lowPrice: lastPrice, weightedAvgPrice: lastPrice,
                count: "0", bidPrice: lastPrice, askPrice: lastPrice,
                _source: "coingecko",
              });
            }
          }
        } catch {
          // fall through to friendly error
        }
        return NextResponse.json(
          { error: "Market data unavailable in your region. Trading and prices from Drift remain available.", code: 451 },
          { status: 451 }
        );
      }

      return NextResponse.json(
        { error: err.msg || err.message || "Binance ticker error", code: res.status },
        { status: res.status }
      );
    }
    const d = await res.json();
    return NextResponse.json({
      symbol: d.symbol,
      lastPrice: d.lastPrice,
      volume: d.volume,
      quoteVolume: d.quoteVolume,
      priceChange: d.priceChange,
      priceChangePercent: d.priceChangePercent,
      highPrice: d.highPrice,
      lowPrice: d.lowPrice,
      weightedAvgPrice: d.weightedAvgPrice,
      count: d.count,
      bidPrice: d.bidPrice,
      askPrice: d.askPrice,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch 24h ticker" },
      { status: 500 }
    );
  }
}
