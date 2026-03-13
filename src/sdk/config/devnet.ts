/**
 * Devnet config - Percolator
 * User picks Small / Medium / Large and pays that tier's slab rent.
 * Each tier has its own program ID and slab size; deploy three programs (percolator-prog built with 256/1024/4096 max accounts).
 *
 * Program IDs: override via env so all three tiers use your deployed programs (run scripts/build-all-tiers.sh, deploy each .so, then set):
 *   NEXT_PUBLIC_PERCOLATOR_PROGRAM_ID_SMALL=<id>
 *   NEXT_PUBLIC_PERCOLATOR_PROGRAM_ID_MEDIUM=<id>
 *   NEXT_PUBLIC_PERCOLATOR_PROGRAM_ID_LARGE=<id>
 *
 * Slab sizes: override with env so they match your deployed binaries (run print-slab-len.sh to get values):
 *   NEXT_PUBLIC_SLAB_BYTES_SMALL=62856
 *   NEXT_PUBLIC_SLAB_BYTES_MEDIUM=248808
 *   NEXT_PUBLIC_SLAB_BYTES_LARGE=992616
 */

function slabBytes(tier: "small" | "medium" | "large", fallback: number): number {
  const key =
    tier === "small"
      ? "NEXT_PUBLIC_SLAB_BYTES_SMALL"
      : tier === "medium"
        ? "NEXT_PUBLIC_SLAB_BYTES_MEDIUM"
        : "NEXT_PUBLIC_SLAB_BYTES_LARGE";
  const v = typeof process !== "undefined" ? process.env[key] : undefined;
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function programId(tier: "small" | "medium" | "large", fallback: string): string {
  const key =
    tier === "small"
      ? "NEXT_PUBLIC_PERCOLATOR_PROGRAM_ID_SMALL"
      : tier === "medium"
        ? "NEXT_PUBLIC_PERCOLATOR_PROGRAM_ID_MEDIUM"
        : "NEXT_PUBLIC_PERCOLATOR_PROGRAM_ID_LARGE";
  const v = typeof process !== "undefined" ? process.env[key] : undefined;
  return (v && v.length > 0) ? v : fallback;
}

const DEFAULT_SMALL_ID = "99uLS74jtvw7os2iWY1Sc83RDYPQJtTsaUH4P1fuvq1U";
const DEFAULT_MEDIUM_ID = "H4gcuBnYnf6BchxGZvm7dGxEgrqttyRRaR4ErV4tNri3";
const DEFAULT_LARGE_ID = "Hq2af7TNUM95fnUqW4KjJRvy4HwQKTGwrSensjUEkpkU";

export const DEVNET = {
  /** Default (e.g. Large tier); uses same env as Large. */
  get percolatorProgramId() {
    return programId("large", DEFAULT_LARGE_ID);
  },

  /** Small = ~0.5 SOL slab rent, Medium = ~1.8 SOL, Large = ~6.9 SOL. Override program IDs via env (see above). */
  percolatorTiers: {
    small: {
      get programId() {
        return programId("small", DEFAULT_SMALL_ID);
      },
      maxAccounts: 256,
      get slabBytes() {
        return slabBytes("small", 62856);
      },
      label: "Small",
    },
    medium: {
      get programId() {
        return programId("medium", DEFAULT_MEDIUM_ID);
      },
      maxAccounts: 1024,
      get slabBytes() {
        return slabBytes("medium", 248808);
      },
      label: "Medium",
    },
    large: {
      get programId() {
        return programId("large", DEFAULT_LARGE_ID);
      },
      maxAccounts: 4096,
      get slabBytes() {
        return slabBytes("large", 992616);
      },
      label: "Large",
    },
  },

  /** vAMM Matcher (aeyakovenko/percolator-match devnet) */
  matcherProgramId: "4HcGCsyjAqnFua5ccuXyt8KRRQzKFbGTJkVChpS7Yfzy",

  /** Chainlink SOL/USD oracle on devnet */
  chainlinkSolUsd: "99B2bTijsU6f1GCT73HmdR7HCFFjGMBcPZY6jZ96ynrR",

  /** Upstream test market slab (percolator-prog README) */
  defaultMarketSlab: "AcF3Q3UMHqx2xZR2Ty6pNvfCaogFmsLEqyMACQ2c4UPK",

  /** Oracle program IDs for auto-detection */
  pythReceiverProgramId: "FsJ3A3u2vn5cTVofAjVy6KDNm2ERMx5Thrs2ac3opwZy",
  chainlinkOcr2ProgramId: "cjg3oHmg9uuPsP8D6g29NWvhySJkdYdAo9D25PRbKXJ",

  /** Well-known mints */
  wrappedSolMint: "So11111111111111111111111111111111111111112",

  /** Matcher modes */
  matcherModes: {
    passive: { kind: 0, label: "Passive (fixed spread)" },
    vamm: { kind: 1, label: "vAMM (spread + impact)" },
    propamm: { kind: 2, label: "PropAMM (vAMM + guardrails)" },
  },

  /** Default vAMM parameters */
  defaultVammParams: {
    tradingFeeBps: 5,
    baseSpreadBps: 10,
    impactKBps: 50,
    maxTotalBps: 200,
    liquidityNotionalE6: "10000000000", // 10k USD notional
  },

  /** Default passive matcher spread */
  defaultPassiveSpreadBps: 50,
} as const;
