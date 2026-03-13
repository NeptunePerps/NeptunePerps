/**
 * Client-safe proof types and explorer helpers.
 * Use this in client components instead of @sov/proof to avoid bundling @solana/web3.js.
 */

export type Cluster = "mainnet-beta" | "devnet";

export type Venue = "percolator" | "jupiter-perps" | "perps" | "spl-token";

export interface ProgramInfo {
  programId: string;
  upgradeable: boolean;
  upgradeAuthority: string | null;
  explorerLink: string;
  verificationStatus: "verified" | "unverified" | "unknown";
}

export interface PricingContext {
  spreadBpsAtFill?: number;
  skewBefore?: number;
  skewAfter?: number;
  oracleFreshnessSlots?: number;
  oracleDivergenceBps?: number;
  crankFreshnessSlots?: number;
  guardTriggered?: "none" | "widened" | "throttled" | "halted";
}

export interface Receipt {
  id: string;
  timestamp: string;
  mode: "mainnet" | "devnet";
  venue: Venue;
  action: string;
  marketId?: string;
  marketLabel?: string;
  txSignatures: string[];
  explorerLinks: string[];
  invokedPrograms: ProgramInfo[];
  wallet?: string;
  cluster: Cluster;
  pricingContext?: PricingContext;
}

export function explorerTxUrl(signature: string, cluster: Cluster): string {
  const base = "https://explorer.solana.com";
  const query = cluster === "devnet" ? "?cluster=devnet" : "";
  return `${base}/tx/${signature}${query}`;
}

export function explorerAccountUrl(address: string, cluster: Cluster): string {
  const base = "https://explorer.solana.com";
  const query = cluster === "devnet" ? "?cluster=devnet" : "";
  return `${base}/address/${address}${query}`;
}
