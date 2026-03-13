"use client";

import { ClusterProvider } from "@/components/cluster-provider";
import { ReceiptsProvider } from "@/components/receipts-provider";
import { MarketDataProvider } from "@/components/market-data-provider";
import { AppShell } from "@/components/app-shell";

export default function AppLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="font-sans">
    <ClusterProvider>
      <ReceiptsProvider>
        <MarketDataProvider>
          <AppShell>{children}</AppShell>
        </MarketDataProvider>
      </ReceiptsProvider>
    </ClusterProvider>
    </div>
  );
}
