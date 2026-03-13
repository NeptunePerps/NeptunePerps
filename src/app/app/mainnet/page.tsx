"use client";

import { useEffect, useState } from "react";
import { useCluster } from "@/components/cluster-provider";
import { DriftProvider, useDrift } from "@/components/drift-provider";
import { useMarketData } from "@/components/market-data-provider";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { RightSidebar } from "@/components/dashboard/right-sidebar";
import { StockScreener } from "@/components/dashboard/stock-screener";
import { TradingViewChart } from "@/components/tradingview-chart";
import { ConnectWalletDrawer } from "@/components/dashboard/connect-wallet-drawer";
import { OrderBookAndTrades } from "@/components/dashboard/order-book-trades";
import { MarketStatsSection } from "@/components/dashboard/market-stats-section";

/** Map market labels to CoinGecko IDs and TradingView symbols */
const MARKET_MAP: Record<
  string,
  { coingeckoId: string; tvSymbol: string; baseSymbol: string }
> = {
  "SOL-PERP": {
    coingeckoId: "solana",
    tvSymbol: "PYTH:SOLUSD",
    baseSymbol: "SOL",
  },
  "BTC-PERP": {
    coingeckoId: "bitcoin",
    tvSymbol: "PYTH:BTCUSD",
    baseSymbol: "BTC",
  },
  "ETH-PERP": {
    coingeckoId: "ethereum",
    tvSymbol: "PYTH:ETHUSD",
    baseSymbol: "ETH",
  },
  "APT-PERP": {
    coingeckoId: "aptos",
    tvSymbol: "PYTH:APTUSD",
    baseSymbol: "APT",
  },
  "BONK-PERP": {
    coingeckoId: "bonk",
    tvSymbol: "PYTH:BONKUSD",
    baseSymbol: "BONK",
  },
  "MATIC-PERP": {
    coingeckoId: "matic-network",
    tvSymbol: "PYTH:MATICUSD",
    baseSymbol: "MATIC",
  },
  "ARB-PERP": {
    coingeckoId: "arbitrum",
    tvSymbol: "PYTH:ARBUSD",
    baseSymbol: "ARB",
  },
  "DOGE-PERP": {
    coingeckoId: "dogecoin",
    tvSymbol: "PYTH:DOGEUSD",
    baseSymbol: "DOGE",
  },
  "BNB-PERP": {
    coingeckoId: "binancecoin",
    tvSymbol: "PYTH:BNBUSD",
    baseSymbol: "BNB",
  },
  "SUI-PERP": {
    coingeckoId: "sui",
    tvSymbol: "PYTH:SUIUSD",
    baseSymbol: "SUI",
  },
  "PEPE-PERP": {
    coingeckoId: "pepe",
    tvSymbol: "PYTH:PEPEUSD",
    baseSymbol: "PEPE",
  },
  "WIF-PERP": {
    coingeckoId: "dogwifcoin",
    tvSymbol: "PYTH:WIFUSD",
    baseSymbol: "WIF",
  },
  "JUP-PERP": {
    coingeckoId: "jupiter-exchange-solana",
    tvSymbol: "PYTH:JUPUSD",
    baseSymbol: "JUP",
  },
  "RNDR-PERP": {
    coingeckoId: "render-token",
    tvSymbol: "PYTH:RNDRUSD",
    baseSymbol: "RNDR",
  },
  "PYTH-PERP": {
    coingeckoId: "pyth-network",
    tvSymbol: "PYTH:PYTHUSD",
    baseSymbol: "PYTH",
  },
  "JTO-PERP": {
    coingeckoId: "jito-governance-token",
    tvSymbol: "PYTH:JTOUSD",
    baseSymbol: "JTO",
  },
};

export default function MainnetPage() {
  return <MainnetContent />;
}

function MainnetContent() {
  const { setMode } = useCluster();
  const [currentMarket, setCurrentMarket] = useState("SOL-PERP");
  const { prices } = useMarketData();

  useEffect(() => {
    setMode("mainnet");
  }, [setMode]);

  const marketInfo = MARKET_MAP[currentMarket] ?? MARKET_MAP["SOL-PERP"];
  const fallbackMarkPrice = prices[marketInfo.coingeckoId]?.price ?? 0;

  return (
    <DriftProvider>
      <MainnetContentInner
        currentMarket={currentMarket}
        setCurrentMarket={setCurrentMarket}
        marketInfo={marketInfo}
        fallbackMarkPrice={fallbackMarkPrice}
      />
    </DriftProvider>
  );
}

function MainnetContentInner({
  currentMarket,
  setCurrentMarket,
  marketInfo,
  fallbackMarkPrice,
}: {
  currentMarket: string;
  setCurrentMarket: (m: string) => void;
  marketInfo: (typeof MARKET_MAP)[keyof typeof MARKET_MAP];
  fallbackMarkPrice: number;
}) {
  const { markPricesByMarket } = useDrift();

  return (
    <div className="mainnet-dashboard flex flex-col min-h-screen bg-black text-foreground">
      <div className="flex-1 p-1.5 sm:p-2 lg:p-3">
        <div className="mainnet-content-card max-w-[1920px] mx-auto rounded-lg sm:rounded-xl border overflow-hidden flex flex-col min-h-0">
          <TopNavbar symbol={currentMarket} />
          <div className="flex flex-1 overflow-hidden p-1.5 sm:p-2 gap-1.5 sm:gap-2 flex-col lg:flex-row">
            <div className="flex flex-col flex-1 overflow-hidden gap-1.5 sm:gap-2 min-w-0">
              <div className="flex flex-col lg:flex-row flex-1 min-h-[400px] sm:min-h-[420px] lg:min-h-0 max-h-none lg:max-h-[620px] rounded-lg sm:rounded-xl border border-border overflow-hidden bg-card">
                <div className="order-1 lg:order-2 flex-1 h-[400px] sm:h-auto sm:min-h-[420px] lg:min-h-0 min-w-0 bg-transparent border-b lg:border-b-0">
                  <TradingViewChart
                    symbol={marketInfo.tvSymbol}
                    interval="15"
                  />
                </div>
                <div className="order-2 lg:order-1">
                  <OrderBookAndTrades symbol={currentMarket} baseSymbol={marketInfo.baseSymbol} />
                </div>
              </div>
              <div className="shrink-0 bg-card rounded-lg sm:rounded-xl border border-border overflow-hidden min-h-[260px] sm:min-h-[400px] lg:min-h-[550px] overflow-y-auto">
                <StockScreener title="Positions & history" />
              </div>
              <div className="shrink-0">
                <MarketStatsSection symbol={currentMarket} baseSymbol={marketInfo.baseSymbol} />
              </div>
            </div>

            <MainnetRightSidebar
              currentMarket={currentMarket}
              fallbackMarkPrice={fallbackMarkPrice}
              marketInfo={marketInfo}
              onMarketSelect={setCurrentMarket}
            />
          </div>
        </div>
      </div>

      <ConnectWalletDrawer />
    </div>
  );
}

function MainnetRightSidebar({
  currentMarket,
  fallbackMarkPrice,
  marketInfo,
  onMarketSelect,
}: {
  currentMarket: string;
  fallbackMarkPrice: number;
  marketInfo: (typeof MARKET_MAP)[keyof typeof MARKET_MAP];
  onMarketSelect: (market: string) => void;
}) {
  const { markPricesByMarket } = useDrift();
  const markPrice = markPricesByMarket[currentMarket] ?? fallbackMarkPrice;
  const priceStr = markPrice > 0 ? markPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : "0.00";

  return (
    <RightSidebar
      symbol={marketInfo.baseSymbol}
      name={`${marketInfo.baseSymbol} Perpetual`}
      price={priceStr}
      change="0.00"
      changePercent="0.00%"
      lastUpdate="Live"
      newsHeadline="Neptune perps · Drift mainnet."
      newsTime="Live"
      currentMarket={currentMarket}
      markPrice={markPrice}
      marketOptions={Object.keys(MARKET_MAP)}
      onMarketSelect={onMarketSelect}
    />
  );
}
