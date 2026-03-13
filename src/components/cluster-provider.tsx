"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { WalletProvider } from "./wallet-provider";

export type Cluster = "mainnet-beta" | "devnet";

type ClusterContextValue = {
  mode: "mainnet" | "devnet";
  cluster: Cluster;
  setMode: (m: "mainnet" | "devnet") => void;
};

const ClusterContext = createContext<ClusterContextValue | null>(null);

export function useCluster() {
  const ctx = useContext(ClusterContext);
  if (!ctx) throw new Error("useCluster must be used within ClusterProvider");
  return ctx;
}

function getInitialMode(pathname: string | null): "mainnet" | "devnet" {
  if (typeof window !== "undefined" && window.location?.pathname?.startsWith("/app/devnet")) return "devnet";
  if (typeof window !== "undefined" && window.location?.pathname?.startsWith("/app/mainnet")) return "mainnet";
  if (pathname?.startsWith("/app/devnet")) return "devnet";
  if (pathname?.startsWith("/app/mainnet")) return "mainnet";
  return "mainnet";
}

export function ClusterProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mode, setModeState] = useState<"mainnet" | "devnet">(() => getInitialMode(pathname));

  // Keep cluster in sync with route (e.g. user navigates to /app/devnet/launch)
  useEffect(() => {
    if (pathname?.startsWith("/app/devnet")) setModeState("devnet");
    else if (pathname?.startsWith("/app/mainnet")) setModeState("mainnet");
  }, [pathname]);

  const cluster: Cluster = mode === "mainnet" ? "mainnet-beta" : "devnet";

  const setMode = useCallback((m: "mainnet" | "devnet") => {
    setModeState(m);
  }, []);

  return (
    <ClusterContext.Provider value={{ mode, cluster, setMode }}>
      <WalletProvider cluster={cluster}>{children}</WalletProvider>
    </ClusterContext.Provider>
  );
}
