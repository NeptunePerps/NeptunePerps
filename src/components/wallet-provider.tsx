"use client";

import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

function getRpcUrl(cluster: "mainnet-beta" | "devnet"): string {
  if (typeof window === "undefined") {
    return cluster === "devnet" ? "https://api.devnet.solana.com" : "https://api.mainnet.solana.com";
  }
  // Explicit RPC URLs take precedence
  const explicit =
    cluster === "devnet"
      ? process.env.NEXT_PUBLIC_DEVNET_RPC_URL
      : process.env.NEXT_PUBLIC_MAINNET_RPC_URL;
  if (explicit?.trim()) return explicit.trim();

  // Helius: one API key for both networks (avoids 403 from public RPC)
  const heliusKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY?.trim();
  if (heliusKey) {
    return cluster === "devnet"
      ? `https://devnet.helius-rpc.com/?api-key=${heliusKey}`
      : `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`;
  }

  return cluster === "devnet" ? "https://api.devnet.solana.com" : "https://api.mainnet.solana.com";
}

export function WalletProvider({
  children,
  cluster,
}: {
  children: React.ReactNode;
  cluster: "mainnet-beta" | "devnet";
}) {
  const endpoint = useMemo(() => getRpcUrl(cluster), [cluster]);

  // Use standard wallets only (Phantom etc. register themselves). No explicit PhantomWalletAdapter.
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint} key={cluster}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
