"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { DevnetMarketProofPage } from "@/components/devnet-market-proof-page";

export default function MarketProofPage() {
  const params = useParams();
  const router = useRouter();
  const marketId = params?.marketId as string | undefined;

  useEffect(() => {
    if (!marketId || marketId.length < 32) {
      router.replace("/app/devnet");
    }
  }, [marketId, router]);

  if (!marketId || marketId.length < 32) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-sm text-zinc-500">Redirecting to Devnet…</p>
      </div>
    );
  }

  return <DevnetMarketProofPage marketId={marketId} />;
}
