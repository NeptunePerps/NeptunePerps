"use client";

import { useCluster } from "@/components/cluster-provider";
import { useEffect } from "react";
import { DevnetMarketDirectory } from "@/components/devnet-market-directory";

export default function DevnetPage() {
  const { setMode } = useCluster();

  useEffect(() => {
    setMode("devnet");
  }, [setMode]);

  return (
    <div className="flex-1 overflow-auto w-full min-w-0">
      <div className="w-full flex justify-center">
        <div className="w-full max-w-[1440px] px-4 py-4 lg:px-6 lg:py-5 flex flex-col items-center">
          <div className="mb-6 text-center w-full">
            <h2 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight mb-2">Devnet Lab</h2>
            <p className="text-sm lg:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Permissionless market creation and proof-native trading. Launch markets, run the full cycle, verify every action.
            </p>
          </div>

          <div className="w-full">
            <DevnetMarketDirectory />
          </div>
        </div>
      </div>
    </div>
  );
}
