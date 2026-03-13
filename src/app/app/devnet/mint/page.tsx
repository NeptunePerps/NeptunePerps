"use client";

import { useCluster } from "@/components/cluster-provider";
import { useEffect } from "react";
import { TokenFactory } from "@/components/token-factory";

export default function TokenFactoryPage() {
  const { setMode } = useCluster();

  useEffect(() => {
    setMode("devnet");
  }, [setMode]);

  return (
    <div className="flex-1 overflow-auto w-full flex flex-col items-center">
      <div className="w-full max-w-[1200px] mx-auto p-2 lg:p-3 flex flex-col items-center">
        <div className="mb-6 text-center">
          <h2 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight mb-2">Token Mint</h2>
          <p className="text-sm lg:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Create SPL tokens for testing. Use your mint as collateral in the Launch Wizard or for custom markets.
          </p>
        </div>

        <div className="w-full rounded-xl border border-border overflow-hidden bg-card">
          <TokenFactory showHeader={false} />
        </div>
      </div>
    </div>
  );
}
