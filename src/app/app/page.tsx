"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { useCluster } from "@/components/cluster-provider";
import Link from "next/link";
import { NeptuneLogo } from "@/components/neptune-logo";

function AppHomeContent() {
  const searchParams = useSearchParams();
  const { setMode } = useCluster();

  useEffect(() => {
    const m = searchParams.get("mode");
    if (m === "devnet") setMode("devnet");
    else setMode("mainnet");
  }, [searchParams, setMode]);

  return (
    <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 overflow-auto">
      <div className="w-full max-w-4xl">
        <header className="mb-10 text-center sm:text-left">
          <div className="mb-6">
            <NeptuneLogo size="lg" className="h-[132px] w-[132px] sm:h-[152px] sm:w-[152px]" />
          </div>
          <h1 className="text-2xl sm:text-[26px] font-semibold text-foreground tracking-tight mb-2">
            Select your environment
          </h1>
          <p className="text-sm text-muted-foreground max-w-md">
            Same protocol, same proof system. Choose production or development.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            href="/app/mainnet"
            className="group relative block text-left rounded-2xl border border-border bg-card overflow-hidden p-6 sm:p-7 transition-colors hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background"
          >
            <span className="inline-flex items-center px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground mb-5">
              Mainnet
            </span>
            <h3 className="text-[16px] font-semibold text-foreground mb-2">Trading Terminal</h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-5">
              Gasless trading — $0 network fees. Real markets, real liquidity, up to 50x leverage.
            </p>
            <ul className="space-y-2.5 text-[12px] text-muted-foreground">
              {["$0 network fees (gasless)", "SOL, ETH, BTC perpetuals", "TradingView charts", "Position management"].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
            <span className="inline-flex items-center gap-2 mt-6 text-[12px] font-semibold text-primary group-hover:underline">
              Continue <span aria-hidden>→</span>
            </span>
          </Link>

          <Link
            href="/app/devnet"
            className="group relative block text-left rounded-2xl border border-border bg-card overflow-hidden p-6 sm:p-7 transition-colors hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background"
          >
            <span className="inline-flex items-center px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground mb-5">
              Devnet
            </span>
            <h3 className="text-[16px] font-semibold text-foreground mb-2">Devnet Lab</h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-5">
              Build and test. Launch markets, mint tokens — every action verified with proof.
            </p>
            <ul className="space-y-2.5 text-[12px] text-muted-foreground">
              {["Permissionless market creation", "Token Factory", "Proof-native receipts"].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
            <span className="inline-flex items-center gap-2 mt-6 text-[12px] font-semibold text-primary group-hover:underline">
              Continue <span aria-hidden>→</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AppHomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-600 text-sm">Loading…</div>}>
      <AppHomeContent />
    </Suspense>
  );
}
