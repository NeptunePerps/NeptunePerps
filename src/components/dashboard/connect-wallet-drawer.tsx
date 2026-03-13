"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export function ConnectWalletDrawer() {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

  if (connected) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm safe-area-bottom"
      role="banner"
      aria-label="Connect wallet to trade"
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 max-w-[1920px] mx-auto">
        <p className="text-sm text-muted-foreground">
          Connect your wallet to start trading on Neptune.
        </p>
        <button
          type="button"
          onClick={() => setVisible(true)}
          className="shrink-0 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Connect Wallet
        </button>
      </div>
    </div>
  );
}
