"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
  buildInitUserIx,
  buildDepositIx,
  buildWithdrawIx,
  buildKeeperCrankIx,
  buildTradeCpiIx,
  buildTradeCpiIxDirect,
  buildTopUpInsuranceIx,
  buildSetOracleAuthorityIx,
  buildPushOraclePriceIx,
  buildUpdateAdminIx,
  addComputeBudget,
  fetchSlab,
  parseEngine,
  parseConfig,
  parseHeader,
  parseParams,
  parseUsedIndices,
  parseAccount,
  parseAllAccounts,
  AccountKind,
  deriveLpPda,
  type PercolatorParams,
  type EngineState,
  type MarketConfig,
  type SlabHeader,
  type RiskParams,
  type Account as SlabAccount,
} from "@sov/percolator-sdk";
import { DEVNET } from "@sov/config";
import { useReceipts } from "./receipts-provider";
import { useCluster } from "./cluster-provider";
import type { ProgramInfo } from "@/lib/proof-client";
import { explorerAccountUrl, explorerTxUrl } from "@/lib/proof-client";

/* ------------------------------------------------------------------ */
/*  Constants from config                                              */
/* ------------------------------------------------------------------ */

const FALLBACK_PROGRAM_ID = new PublicKey(DEVNET.percolatorProgramId);
const MATCHER_PROGRAM_ID = new PublicKey(DEVNET.matcherProgramId);
/** Burned admin = all zeros = no one can perform admin ops (market immutable) */
const BURNED_ADMIN = SystemProgram.programId;
const PYTH_RECEIVER = DEVNET.pythReceiverProgramId;
const CHAINLINK_OCR2 = DEVNET.chainlinkOcr2ProgramId;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function short(s: string, len = 6) {
  if (s.length <= len * 2 + 3) return s;
  return `${s.slice(0, len)}…${s.slice(-len)}`;
}

function bigToNum(b: bigint): number {
  return Number(b);
}

function lamportsToSol(lamports: bigint): string {
  return (Number(lamports) / LAMPORTS_PER_SOL).toFixed(4);
}

/** Map Percolator custom program error codes to human-readable names */
const PERCOLATOR_ERRORS: Record<number, string> = {
  0x0: "InvalidMagic",
  0x1: "InvalidVersion",
  0x2: "AlreadyInitialized",
  0x3: "NotInitialized",
  0x4: "InvalidSlabLen",
  0x5: "InvalidOracleKey",
  0x6: "OracleStale",
  0x7: "OracleConfTooWide",
  0x8: "InvalidVaultAta",
  0x9: "InvalidMint",
  0xa: "ExpectedSigner",
  0xb: "ExpectedWritable",
  0xc: "OracleInvalid",
  0xd: "InsufficientBalance",
  0xe: "Undercollateralized — LP or user lacks margin for this trade size. Try a smaller size.",
  0xf: "Unauthorized — crank may be stale, or sweep not recent enough",
  0x10: "InvalidMatchingEngine",
  0x11: "PnlNotWarmedUp",
  0x12: "Overflow",
  0x13: "AccountNotFound",
  0x14: "NotAnLPAccount",
  0x15: "PositionSizeMismatch",
  0x16: "RiskReductionOnlyMode",
  0x17: "InvalidTokenAccount",
  0x18: "InvalidTokenProgram",
  0x19: "InvalidConfigParam",
  0x1a: "TradeNoCpiDisabled",
};

function humanizeSimError(detail: string): string {
  // Match "custom program error: 0xHH"
  const m = detail.match(/custom program error:\s*0x([0-9a-fA-F]+)/);
  if (m) {
    const code = parseInt(m[1], 16);
    const name = PERCOLATOR_ERRORS[code];
    if (name) return `${detail} (${name})`;
  }
  // Match "instruction requires an uninitialized account" — means already initialized
  if (detail.includes("instruction requires an uninitialized account")) {
    return `${detail} — The account is already initialized. This is OK.`;
  }
  return detail;
}

/** Format raw token amount using actual decimals (not hardcoded 9) */
function formatTokenAmount(raw: bigint, decimals: number): string {
  const divisor = 10 ** decimals;
  return (Number(raw) / divisor).toFixed(Math.min(decimals, 6));
}

/** Parse user input amount to raw token units using actual decimals */
function parseTokenInput(input: string, decimals: number): bigint {
  const parsed = parseFloat(input);
  if (isNaN(parsed) || parsed <= 0) return 0n;
  return BigInt(Math.floor(parsed * 10 ** decimals));
}

function detectOracleType(ownerStr: string): "pyth" | "chainlink" | "authority" | "unknown" {
  if (ownerStr === "authority") return "authority";
  if (ownerStr === PYTH_RECEIVER) return "pyth";
  if (ownerStr === CHAINLINK_OCR2) return "chainlink";
  return "unknown";
}

/* ------------------------------------------------------------------ */
/*  Tier-aware slab parsing helpers                                     */
/*  The vendor parser hardcodes offsets for 4096-account (Large) slabs. */
/*  For Small (256) and Medium (1024) tiers, the bitmap, numUsed,       */
/*  next_free, and accounts arrays are at different offsets because      */
/*  they scale with MAX_ACCOUNTS.                                       */
/* ------------------------------------------------------------------ */

const ENGINE_OFF = 392;       // Fixed: header (72) + config (320)
const ENGINE_BITMAP_OFF = 408; // Fixed within engine: offset of bitmap start
const ACCOUNT_SIZE = 240;

function tierAwareNumUsed(data: Buffer, maxAccounts: number): number {
  const bitmapWords = maxAccounts / 64;
  const bitmapBytes = bitmapWords * 8;
  const numUsedOff = ENGINE_OFF + ENGINE_BITMAP_OFF + bitmapBytes;
  if (data.length < numUsedOff + 2) return -1;
  return data.readUInt16LE(numUsedOff);
}

function tierAwareAccountsOffset(maxAccounts: number): number {
  const bitmapBytes = (maxAccounts / 64) * 8;
  // After bitmap: num_used(2) + padding(6) + next_account_id(8) + free_head(2) + padding(6) + next_free(maxAccounts*2)
  const afterBitmap = 2 + 6 + 8 + 2 + 6 + maxAccounts * 2;
  const rawOff = ENGINE_OFF + ENGINE_BITMAP_OFF + bitmapBytes + afterBitmap;
  // SBF uses 8-byte alignment (not 16) for Account structs with u128 fields
  return Math.ceil(rawOff / 8) * 8;
}

function tierAwareBitmapScan(data: Buffer, maxAccounts: number): number[] {
  const bitmapWords = maxAccounts / 64;
  const base = ENGINE_OFF + ENGINE_BITMAP_OFF;
  if (data.length < base + bitmapWords * 8) return [];
  const used: number[] = [];
  for (let word = 0; word < bitmapWords; word++) {
    const bits = data.readBigUInt64LE(base + word * 8);
    if (bits === 0n) continue;
    for (let bit = 0; bit < 64; bit++) {
      if ((bits >> BigInt(bit)) & 1n) {
        used.push(word * 64 + bit);
      }
    }
  }
  return used;
}

function tierAwareParseAccount(data: Buffer, idx: number, maxAccounts: number): SlabAccount | null {
  const acctOff = tierAwareAccountsOffset(maxAccounts);
  const base = acctOff + idx * ACCOUNT_SIZE;
  if (data.length < base + ACCOUNT_SIZE) return null;
  try {
    // Account layout (from vendor slab.ts):
    // 0: accountId (u64, 8)
    // 8: capital (U128, 16) 
    // 24: kind (u8, 1 + 7 padding)
    // 32: pnl (I128, 16)
    // 80: position_size (I128, 16)
    // 96: entry_price (u64, 8)
    // 152: matcher_context (Pubkey, 32)
    // 184: owner (Pubkey, 32)
    const kind = data[base + 24]; // kind at offset 24
    // kind 0 = User, kind 1 = LP. Check if account is actually populated via accountId
    const accountId = data.readBigUInt64LE(base);
    if (accountId === 0n && kind === 0) {
      // Could be uninitialized — check owner for all-zero
      const ownerBytes = data.subarray(base + 184, base + 216);
      if (ownerBytes.every(b => b === 0)) return null; // Truly empty slot
    }
    const owner = new PublicKey(data.subarray(base + 184, base + 216));
    const capital = data.readBigUInt64LE(base + 8); // low 8 bytes of U128
    const pnl = data.readBigInt64LE(base + 32); // low 8 bytes of I128
    const positionSize = data.readBigInt64LE(base + 80); // low 8 bytes of I128
    const entryPrice = data.readBigUInt64LE(base + 96);
    const matcherContext = new PublicKey(data.subarray(base + 152, base + 184));
    return {
      kind: kind as number,
      owner,
      capital: BigInt(capital),
      pnl: BigInt(pnl),
      positionSize: BigInt(positionSize),
      entryPrice: BigInt(entryPrice),
      matcherContext,
    } as unknown as SlabAccount;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function DevnetMarketProofPage({ marketId }: { marketId: string }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { addReceipt, receipts } = useReceipts();
  const { cluster } = useCluster();

  // ---- State ----
  const [slabData, setSlabData] = useState<Buffer | null>(null);
  const [slabOwner, setSlabOwner] = useState<PublicKey>(FALLBACK_PROGRAM_ID);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // User / LP discovery
  const [userIdx, setUserIdx] = useState<number | null>(null);
  const [lpIdx, setLpIdx] = useState<number | null>(null);
  const [lpOwner, setLpOwner] = useState<PublicKey | null>(null);
  const [matcherCtx, setMatcherCtx] = useState<string | null>(null);
  const [matcherInitialized, setMatcherInitialized] = useState<boolean | null>(null);
  const [matcherCheckSeq, setMatcherCheckSeq] = useState(0); // bump to re-check matcher
  const [allAccounts, setAllAccounts] = useState<{ idx: number; account: SlabAccount }[]>([]);

  // Program truth
  const [programTruth, setProgramTruth] = useState<ProgramInfo[]>([]);

  // Oracle
  const [oracleOwner, setOracleOwner] = useState<string | null>(null);
  const [oracleLastSlot, setOracleLastSlot] = useState<number | null>(null);

  // Vault balances
  const [vaultBalance, setVaultBalance] = useState<bigint | null>(null);

  // User's collateral token balance (ATA)
  const [userTokenBalance, setUserTokenBalance] = useState<bigint | null>(null);

  // Collateral token decimals (fetched from mint)
  const [collateralDecimals, setCollateralDecimals] = useState<number>(9);

  // Trade form
  const [tradeSize, setTradeSize] = useState("");
  const [tradeLpIdx, setTradeLpIdx] = useState("");

  // Deposit / Withdraw form
  const [depositAmt, setDepositAmt] = useState("");
  const [withdrawAmt, setWithdrawAmt] = useState("");

  // Push oracle form
  const [pushPriceInput, setPushPriceInput] = useState("");

  // Update / burn admin
  const [newAdminInput, setNewAdminInput] = useState("");
  const [burnAdminConfirm, setBurnAdminConfirm] = useState(false);

  // Pricing Truth (real data from matcher context + engine)
  const [pricingTruth, setPricingTruth] = useState<{
    spreadBps: number | null;
    skewInventory: string | null;
    guardState: string | null;
    utilization: string | null;
    crankFreshnessSlots: number | null;
  }>({ spreadBps: null, skewInventory: null, guardState: null, utilization: null, crankFreshnessSlots: null });

  const slabPk = new PublicKey(marketId);

  /* ------------------------------------------------------------------ */
  /*  Load slab data                                                     */
  /* ------------------------------------------------------------------ */

  const loadSlab = useCallback(async () => {
    try {
      setError(null);
      // Fetch raw account info to get both data AND owner (program ID)
      const info = await connection.getAccountInfo(slabPk);
      if (!info) {
        setError("Market not found on devnet");
        return null;
      }
      const data = Buffer.from(info.data);
      setSlabData(data);
      setSlabOwner(info.owner);

      // Parse all accounts (try vendor parser first, fall back to tier-aware)
      try {
        const accts = parseAllAccounts(data);
        setAllAccounts(accts);
      } catch {
        // Vendor parser failed (likely Small/Medium tier) — don't set allAccounts
        setAllAccounts([]);
      }

      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load slab");
      return null;
    }
  }, [connection, marketId]);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadSlab().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [loadSlab]);

  // Discover user/LP accounts when slab data or wallet changes
  // Uses tier-aware parsing for Small/Medium tiers where vendor parser fails
  useEffect(() => {
    if (!slabData || !wallet.publicKey) {
      setUserIdx(null);
      setLpIdx(null);
      setLpOwner(null);
      setMatcherCtx(null);
      return;
    }

    const ma = riskParams ? Number(riskParams.maxAccounts) : 4096;
    const largeTier = ma >= 4096;

    let foundUser: number | null = null;
    let foundLp: number | null = null;
    let foundLpOwner: PublicKey | null = null;
    let foundCtx: string | null = null;

    if (largeTier) {
      // Use vendor parser (correct offsets for Large tier)
      try {
        const indices = parseUsedIndices(slabData);
        for (const idx of indices) {
          try {
            const acc = parseAccount(slabData, idx);
            if (acc.kind === AccountKind.User && acc.owner.equals(wallet.publicKey)) {
              foundUser = idx;
            }
            if (acc.kind === AccountKind.LP && foundLp === null) {
              foundLp = idx;
              foundLpOwner = acc.owner;
              foundCtx = acc.matcherContext.toBase58();
            }
          } catch {}
        }
      } catch {}
    } else {
      // Tier-aware scanning for Small/Medium tiers
      try {
        const indices = tierAwareBitmapScan(slabData, ma);
        for (const idx of indices) {
          const acc = tierAwareParseAccount(slabData, idx, ma);
          if (!acc) continue;
          if (acc.kind === AccountKind.User && acc.owner.equals(wallet.publicKey)) {
            foundUser = idx;
          }
          if (acc.kind === AccountKind.LP && foundLp === null) {
            foundLp = idx;
            foundLpOwner = acc.owner;
            foundCtx = acc.matcherContext.toBase58();
          }
        }
        // Fallback: if bitmap scan found no user but numUsed > 0, brute-force scan
        if (foundUser === null) {
          const numUsed = tierAwareNumUsed(slabData, ma);
          if (numUsed > 0) {
            for (let i = 0; i < ma && i < numUsed + 10; i++) {
              if (indices.includes(i)) continue; // already checked
              const acc = tierAwareParseAccount(slabData, i, ma);
              if (!acc) continue;
              if (acc.kind === AccountKind.User && acc.owner.equals(wallet.publicKey)) {
                foundUser = i;
              }
              if (acc.kind === AccountKind.LP && foundLp === null) {
                foundLp = i;
                foundLpOwner = acc.owner;
                foundCtx = acc.matcherContext.toBase58();
              }
            }
          }
        }
      } catch {}
    }

    setUserIdx(foundUser);
    setLpIdx(foundLp);
    setLpOwner(foundLpOwner);
    setMatcherCtx(foundCtx);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- riskParams derived from slabData
  }, [slabData, wallet.publicKey]);

  // Check if matcher context is initialized (has PERCMATC magic at offset 64)
  // Re-checks whenever matcherCheckSeq bumps (after Init Matcher or other txs)
  useEffect(() => {
    if (!matcherCtx) { setMatcherInitialized(null); return; }
    connection.getAccountInfo(new PublicKey(matcherCtx)).then((info) => {
      if (!info || info.data.length < 72) { setMatcherInitialized(false); return; }
      // Check for PERCMATC magic (0x5045_5243_4d41_5443) at offset 64
      const magic = info.data.readBigUInt64LE(64);
      setMatcherInitialized(magic === BigInt("0x504552434d415443"));
    }).catch(() => setMatcherInitialized(null));
  }, [connection, matcherCtx, matcherCheckSeq]);

  // Pricing Truth: fetch matcher context (spread, inventory skew) + engine (guard, utilization)
  useEffect(() => {
    if (!matcherCtx || !slabData) {
      setPricingTruth({ spreadBps: null, skewInventory: null, guardState: null, utilization: null, crankFreshnessSlots: null });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const ctxPk = new PublicKey(matcherCtx);
        const info = await connection.getAccountInfo(ctxPk);
        let spreadBps: number | null = null;
        let skewInventory: string | null = null;
        if (info && info.data.length >= 64 + 144) {
          const buf = info.data;
          spreadBps = buf.readUInt32LE(64 + 52);
          const lo = buf.readBigUInt64LE(64 + 96);
          const hi = buf.readBigUInt64LE(64 + 104);
          const u = (hi << 64n) | lo;
          const sign = (u >= (1n << 127n));
          const inv = sign ? u - (1n << 128n) : u;
          skewInventory = String(inv);
        }
        let engine: EngineState | null = null;
        try { engine = parseEngine(slabData); } catch {}
        let guardState: string | null = null;
        let utilization: string | null = null;
        let crankFreshnessSlots: number | null = null;
        if (engine) {
          const currentSlot = await connection.getSlot();
          const age = currentSlot - Number(engine.lastCrankSlot);
          crankFreshnessSlots = age;
          const maxStale = Number(engine.maxCrankStalenessSlots);
          guardState = age <= maxStale ? "Crank fresh" : "Crank stale";
          const cTot = Number(engine.cTot);
          const oi = Number(engine.totalOpenInterest);
          utilization = cTot > 0 ? `${((oi / cTot) * 100).toFixed(1)}%` : null;
        }
        if (!cancelled) {
          setPricingTruth({ spreadBps, skewInventory, guardState, utilization, crankFreshnessSlots });
        }
      } catch {
        if (!cancelled) setPricingTruth({ spreadBps: null, skewInventory: null, guardState: null, utilization: null, crankFreshnessSlots: null });
      }
    })();
    return () => { cancelled = true; };
  }, [connection, matcherCtx, slabData]);

  // Load oracle info
  useEffect(() => {
    if (!slabData) return;
    let cancelled = false;
    try {
      const config = parseConfig(slabData);
      // Detect oracle mode from config
      const hasAuthority = !config.oracleAuthority.equals(PublicKey.default);
      const feedIdAllZeros = config.indexFeedId.equals(PublicKey.default);

      if (hasAuthority && feedIdAllZeros) {
        // Oracle Authority mode — no external oracle account
        if (!cancelled) setOracleOwner("authority");
      } else {
        // Try to read the oracle account (Pyth or Chainlink)
        const oracleAddr = feedIdAllZeros ? DEVNET.chainlinkSolUsd : config.indexFeedId.toBase58();
        connection.getAccountInfo(new PublicKey(oracleAddr)).then((info) => {
          if (cancelled || !info) return;
          setOracleOwner(info.owner.toBase58());
        }).catch(() => {});
      }

      // Read vault balance
      connection.getTokenAccountBalance(config.vaultPubkey).then((bal) => {
        if (!cancelled) {
          setVaultBalance(BigInt(bal.value.amount));
          // Use the vault's decimals to set collateral decimals
          if (bal.value.decimals !== undefined) setCollateralDecimals(bal.value.decimals);
        }
      }).catch(() => {});

      // Read user's collateral token balance
      if (wallet.publicKey) {
        try {
          const userAta = getAssociatedTokenAddressSync(config.collateralMint, wallet.publicKey);
          connection.getTokenAccountBalance(userAta).then((bal) => {
            if (!cancelled) {
              setUserTokenBalance(BigInt(bal.value.amount));
              if (bal.value.decimals !== undefined) setCollateralDecimals(bal.value.decimals);
            }
          }).catch(() => {
            if (!cancelled) setUserTokenBalance(0n);
          });
        } catch {
          if (!cancelled) setUserTokenBalance(0n);
        }
      }
    } catch {}
    return () => { cancelled = true; };
  }, [slabData, connection, wallet.publicKey]);

  // Load program truth (uses the actual slab owner as the percolator program)
  useEffect(() => {
    // Program truth (upgradeability, authorities) can be fetched via a dedicated API
    // that uses @sov/proof server-side. For now, omit client-side inspection.
    setProgramTruth([]);
  }, [connection, cluster, slabOwner]);

  /* ------------------------------------------------------------------ */
  /*  Parsed state                                                       */
  /* ------------------------------------------------------------------ */

  const header = slabData ? (() => { try { return parseHeader(slabData); } catch { return null; } })() : null;
  const config = slabData ? (() => { try { return parseConfig(slabData); } catch { return null; } })() : null;
  const engine = slabData ? (() => { try { return parseEngine(slabData); } catch { return null; } })() : null;
  const riskParams = slabData ? (() => { try { return parseParams(slabData); } catch { return null; } })() : null;

  const currentSlot = engine ? bigToNum(engine.currentSlot) : 0;
  const lastCrankSlot = engine ? bigToNum(engine.lastCrankSlot) : 0;
  const maxStaleness = engine ? bigToNum(engine.maxCrankStalenessSlots) : 200;
  const lastSweepStart = engine ? bigToNum(engine.lastSweepStartSlot) : 0;
  const lastSweepComplete = engine ? bigToNum(engine.lastSweepCompleteSlot) : 0;
  const crankAge = currentSlot - lastCrankSlot;
  const crankStale = crankAge > maxStaleness;

  const oracleType = oracleOwner ? detectOracleType(oracleOwner) : "unknown";
  const hasOracleAuthority = config ? !config.oracleAuthority.equals(PublicKey.default) : false;
  const authorityPriceE6 = config ? bigToNum(config.authorityPriceE6) : 0;

  // User account data — tier-aware
  const maxAccts = riskParams ? Number(riskParams.maxAccounts) : 4096;
  const isLargeTier = maxAccts >= 4096;
  const userAccount = useMemo(() => {
    if (!slabData || userIdx === null) return null;
    if (isLargeTier) {
      try { return parseAccount(slabData, userIdx); } catch { return null; }
    }
    return tierAwareParseAccount(slabData, userIdx, maxAccts);
  }, [slabData, userIdx, maxAccts, isLargeTier]);

  // LP account data — tier-aware (for displaying LP capital, funding, etc.)
  const lpAccount = useMemo(() => {
    if (!slabData || lpIdx === null) return null;
    if (isLargeTier) {
      try { return parseAccount(slabData, lpIdx); } catch { return null; }
    }
    return tierAwareParseAccount(slabData, lpIdx, maxAccts);
  }, [slabData, lpIdx, maxAccts, isLargeTier]);

  // LP deposit form
  const [lpDepositAmt, setLpDepositAmt] = useState("");

  // Use the ACTUAL owner of the slab account as programId (supports all tiers)
  const programId = slabOwner;

  // For Oracle Authority mode, the oracle account doesn't matter much for crank
  // (the program uses the authority price). Use the config's indexFeedId if non-zero,
  // otherwise use the connected wallet or a known account as placeholder.
  const oracleForParams = (() => {
    if (config && !config.indexFeedId.equals(PublicKey.default)) {
      return config.indexFeedId;
    }
    // For authority mode: use the slab itself as oracle placeholder (just needs to be a valid account)
    return slabPk;
  })();

  const params: PercolatorParams = {
    programId,
    slab: slabPk,
    oracle: oracleForParams,
  };

  /* ------------------------------------------------------------------ */
  /*  Action handlers                                                    */
  /* ------------------------------------------------------------------ */

  const refreshSlab = async () => {
    setRefreshing(true);
    await loadSlab();
    setRefreshing(false);
  };

  const sendAndReceipt = async (
    label: string,
    buildTx: () => Promise<Transaction>,
    cuLimit = 400_000,
  ) => {
    if (!wallet.publicKey || !wallet.sendTransaction) {
      setActionError("Connect wallet first");
      return null;
    }
    setStatus(label + "…");
    setActionError(null);
    setActionSuccess(null);
    try {
      const tx = await buildTx();
      addComputeBudget(tx, cuLimit);
      // Simulate first to capture program logs on failure
      try {
        tx.feePayer = wallet.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        const sim = await connection.simulateTransaction(tx);
        if (sim.value.err) {
          const logs = sim.value.logs ?? [];
          const errLines = logs.filter(l => l.includes("Error") || l.includes("failed") || l.includes("custom program error"));
          const rawDetail = errLines.length > 0 ? errLines.join("; ") : JSON.stringify(sim.value.err);
          const detail = humanizeSimError(rawDetail);
          setStatus("");
          setActionError(`Simulation failed: ${detail}`);
          console.error("[Simulation]", sim.value.err, logs);
          // If Init Matcher fails with "already initialized", mark matcher as initialized
          if (label.includes("Init Matcher") && rawDetail.includes("uninitialized account")) {
            setMatcherInitialized(true);
          }
          return null;
        }
      } catch (simErr) {
        // Simulation itself errored (e.g. accounts not found) — log but try sending anyway
        console.warn("[Simulation error]", simErr);
      }
      const sig = await wallet.sendTransaction(tx, connection, { skipPreflight: true });
      await connection.confirmTransaction(sig);
      const pricingContext =
        label.startsWith("Trade") && pricingTruth.spreadBps != null
          ? {
              spreadBpsAtFill: pricingTruth.spreadBps,
              skewBefore: pricingTruth.skewInventory != null ? Number(pricingTruth.skewInventory) : undefined,
              crankFreshnessSlots: pricingTruth.crankFreshnessSlots ?? undefined,
              guardTriggered: "none" as const,
            }
          : undefined;
      // Receipts for proof actions can be added via a server-side helper in a follow-up pass.
      setStatus("");
      setActionSuccess(`${label} confirmed — ${sig.slice(0, 16)}…`);
      setTimeout(() => setActionSuccess(null), 6000);
      // Wait briefly for RPC to reflect the new state, then refresh
      await new Promise((r) => setTimeout(r, 2000));
      await refreshSlab();
      // Re-check matcher initialized state after any transaction
      setMatcherCheckSeq((s) => s + 1);
      // If user account not found after Init User, retry once more after a delay
      if (label === "Init User") {
        setTimeout(async () => {
          await refreshSlab();
        }, 3000);
      }
      return sig;
    } catch (e) {
      setStatus("");
      let msg = e instanceof Error ? e.message : "Transaction failed";
      // Extract program logs from SendTransactionError
      const anyErr = e as Record<string, unknown>;
      if (anyErr?.logs && Array.isArray(anyErr.logs)) {
        const programErrors = (anyErr.logs as string[]).filter(
          (l: string) => l.includes("Error") || l.includes("failed") || l.includes("custom program error")
        );
        if (programErrors.length > 0) {
          msg += " — " + programErrors.join("; ");
        }
      }
      setActionError(humanizeSimError(msg));
      return null;
    }
  };

  const handleInitUser = () =>
    sendAndReceipt("Init User", async () => {
      const fee = riskParams?.newAccountFee ?? BigInt(2000000);
      const ix = await buildInitUserIx(connection, params, wallet.publicKey!, fee);
      return new Transaction().add(ix);
    }, 200_000);

  const handleCrank = () =>
    sendAndReceipt("Crank Now", async () => {
      const ix = buildKeeperCrankIx(params, wallet.publicKey!);
      return new Transaction().add(ix);
    }, 400_000);

  const handleUpdateAdmin = (newAdmin: PublicKey) =>
    sendAndReceipt("Update Admin", async () => {
      if (!header) throw new Error("Slab not loaded");
      const tx = new Transaction();
      addComputeBudget(tx, 150_000);
      tx.add(buildUpdateAdminIx({ programId: params.programId, slab: params.slab }, header.admin, newAdmin));
      return tx;
    }, 150_000);

  const handleBurnAdmin = () =>
    sendAndReceipt("Burn Admin Key", async () => {
      if (!header) throw new Error("Slab not loaded");
      const tx = new Transaction();
      addComputeBudget(tx, 150_000);
      tx.add(buildUpdateAdminIx({ programId: params.programId, slab: params.slab }, header.admin, BURNED_ADMIN));
      return tx;
    }, 150_000);

  const handleDeposit = () => {
    if (!depositAmt) return;
    const raw = parseTokenInput(depositAmt, collateralDecimals);
    if (raw === 0n) { setActionError("Invalid deposit amount"); return; }
    return sendAndReceipt("Deposit", async () => {
      if (userIdx === null) throw new Error("Init user first");
      const ix = await buildDepositIx(connection, params, wallet.publicKey!, userIdx, raw);
      return new Transaction().add(ix);
    }, 200_000);
  };

  const handleWithdraw = () => {
    if (!withdrawAmt) return;
    const raw = parseTokenInput(withdrawAmt, collateralDecimals);
    if (raw === 0n) { setActionError("Invalid withdraw amount"); return; }
    return sendAndReceipt("Withdraw", async () => {
      if (userIdx === null) throw new Error("Init user first");
      const ix = await buildWithdrawIx(connection, params, wallet.publicKey!, userIdx, raw);
      return new Transaction().add(ix);
    }, 200_000);
  };

  // Fund LP — deposit collateral to the LP account (needed if LP has zero capital)
  const handleFundLP = () => {
    if (!lpDepositAmt || lpIdx === null) return;
    const raw = parseTokenInput(lpDepositAmt, collateralDecimals);
    if (raw === 0n) { setActionError("Invalid amount"); return; }
    return sendAndReceipt("Fund LP", async () => {
      // DepositCollateral works on any account (user or LP) as long as the signer is the owner
      const ix = await buildDepositIx(connection, params, wallet.publicKey!, lpIdx, raw);
      return new Transaction().add(ix);
    }, 200_000);
  };

  const handleTrade = (direction: "long" | "short") => {
    if (!tradeSize) return;
    let size: bigint;
    try { size = BigInt(tradeSize); } catch { setActionError("Invalid trade size — enter a whole number"); return; }
    if (size === 0n) { setActionError("Trade size must be non-zero"); return; }
    const signedSize = direction === "long" ? size : -size;
    const lpI = tradeLpIdx ? parseInt(tradeLpIdx) : lpIdx;

    if (lpI === null || !matcherCtx) {
      setActionError("No LP available to trade against");
      return;
    }
    if (!lpOwner) {
      setActionError("LP owner not resolved — refresh the page");
      return;
    }
    if (crankStale) {
      setActionError("Crank is stale — crank first before trading");
      return;
    }
    if (matcherInitialized !== true) {
      setActionError("Matcher context not initialized — click 'Init Matcher' first");
      return;
    }

    // Determine oracle account for the instruction
    const oracleAcct = config && !config.indexFeedId.equals(PublicKey.default)
      ? config.indexFeedId
      : slabPk; // authority mode: use slab as placeholder

    // Log trade diagnostics (helps debug EngineUndercollateralized / margin issues)
    console.log("[Trade diagnostics]", {
      direction, size: String(signedSize),
      userIdx, lpIdx: lpI, lpOwner: lpOwner.toBase58(),
      oracleAcct: oracleAcct.toBase58(),
      matcherCtx,
      programId: programId.toBase58(),
      userCapital: userAccount ? String(userAccount.capital) : "unknown",
      userPosition: userAccount ? String(userAccount.positionSize) : "unknown",
    });

    return sendAndReceipt(`Trade ${direction}`, async () => {
      const fullParams = {
        ...params,
        matcherProgramId: MATCHER_PROGRAM_ID,
        matcherContext: new PublicKey(matcherCtx),
      };
      // Use Direct variant to avoid vendor parser (which fails for Small/Medium tiers)
      const ix = buildTradeCpiIxDirect(fullParams, wallet.publicKey!, lpI, lpOwner, oracleAcct, userIdx!, signedSize);
      return new Transaction().add(ix);
    }, 400_000);
  };

  const handlePushPrice = () => {
    if (!pushPriceInput) return;
    const priceE6 = BigInt(Math.floor(parseFloat(pushPriceInput) * 1_000_000));
    const ts = BigInt(Math.floor(Date.now() / 1000));
    return sendAndReceipt("Push Oracle Price", async () => {
      const ix = buildPushOraclePriceIx(
        { programId, slab: slabPk },
        wallet.publicKey!,
        priceE6,
        ts,
      );
      return new Transaction().add(ix);
    }, 200_000);
  };

  // Initialize matcher context (for markets launched before matcher init was added)
  const handleInitMatcher = () => {
    if (lpIdx === null || !matcherCtx) {
      setActionError("No LP found — cannot initialize matcher");
      return;
    }
    const matcherProgId = MATCHER_PROGRAM_ID;
    const matcherCtxPk = new PublicKey(matcherCtx);
    const [lpPda] = deriveLpPda(programId, slabPk, lpIdx);

    return sendAndReceipt("Init Matcher Context", async () => {
      // Tag 2 = InitVamm — the only init instruction the matcher program accepts
      // Layout: [tag(1) | mode(1) | trading_fee_bps(4) | base_spread_bps(4) | max_total_bps(4) |
      //          impact_k_bps(4) | liquidity_notional_e6(16) | max_fill_abs(16) | max_inventory_abs(16)]
      const initVammData = Buffer.alloc(66);
      initVammData[0] = 2; // Tag 2 = InitVamm
      initVammData[1] = 0; // Passive mode
      initVammData.writeUInt32LE(50, 2);  // trading_fee_bps (0.5%)
      initVammData.writeUInt32LE(50, 6);  // base_spread_bps (0.5%)
      initVammData.writeUInt32LE(500, 10); // max_total_bps (5%)
      // impact_k_bps = 0 (offset 14), liquidity_notional_e6 = 0 (offset 18) for Passive
      // max_fill_abs (offset 34) - set to large number
      {
        const maxFill = BigInt("1000000000000");
        const buf = Buffer.alloc(16);
        buf.writeBigUInt64LE(maxFill & BigInt("0xFFFFFFFFFFFFFFFF"), 0);
        buf.writeBigUInt64LE(maxFill >> 64n, 8);
        initVammData.set(buf, 34);
      }
      // max_inventory_abs = 0 (offset 50, no limit) — already zero

      const initVammIx = {
        programId: matcherProgId,
        keys: [
          { pubkey: lpPda, isSigner: false, isWritable: false },
          { pubkey: matcherCtxPk, isSigner: false, isWritable: true },
        ],
        data: initVammData,
      };

      return new Transaction().add(initVammIx);
    }, 100_000);
  };

  // Market-scoped receipts
  const marketReceipts = receipts.filter((r) => r.marketId === marketId);

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  // Determine if this is "not found" vs actual RPC error
  const isNotFound = error && (error.includes("not found") || error.includes("null"));
  const isRpcError = error && !isNotFound;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-[#00E5FF]/30 border-t-[#00E5FF] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-zinc-600">Loading market data from RPC…</p>
        </div>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="w-full px-4 lg:px-6 py-4 lg:py-6">
          {/* Still show the scaffold — not a blank void */}
          <section className="mb-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-[16px] font-bold text-foreground tracking-tight">Market Proof</h2>
                <span className="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-primary text-primary-foreground">DEVNET</span>
              </div>
              <div className="font-mono text-sm text-zinc-400">{short(marketId, 12)}</div>
            </div>
          </section>

          {/* Top cards — all show "Unknown / Not found" */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <StatusCard label="Market" value="Not found" color="text-amber-400" />
            <StatusCard label="Oracle" value="Unknown" color="text-zinc-600" />
            <StatusCard label="Crank" value="Unknown" color="text-zinc-600" />
            <StatusCard label="Vault" value="Unknown" color="text-zinc-600" />
          </div>

          {/* Not found message */}
          <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.03] p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-[14px] font-bold text-amber-400 mb-1">Market not found on devnet</p>
            <p className="text-sm text-zinc-500 font-mono mb-2">{marketId}</p>
            <p className="text-sm text-zinc-600 mb-4 max-w-md mx-auto">
              This address may be on a different cluster or not created yet. Verify the address is correct and that it exists on Solana devnet.
            </p>
            <div className="flex items-center gap-2 justify-center flex-wrap">
              <a
                href={explorerAccountUrl(marketId, "devnet")}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.08] rounded text-sm text-zinc-300 transition"
              >
                Open in Explorer (devnet)
              </a>
              <Link href="/app/devnet" className="px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.08] rounded text-sm text-zinc-300 transition">
                Back to Directory
              </Link>
              <Link href="/app/devnet/launch" className="px-3 py-1.5 bg-[#00E5FF] hover:bg-[#00E5FF] rounded text-sm font-semibold text-white transition">
                Launch a New Market
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isRpcError) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="w-full px-4 lg:px-6 py-4 lg:py-6">
          <section className="mb-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-[16px] font-bold text-foreground tracking-tight">Market Proof</h2>
                <span className="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-primary text-primary-foreground">DEVNET</span>
              </div>
              <div className="font-mono text-sm text-zinc-400">{short(marketId, 12)}</div>
            </div>
          </section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <StatusCard label="RPC" value="Error" color="text-red-400" />
            <StatusCard label="Oracle" value="Unknown" color="text-zinc-600" />
            <StatusCard label="Crank" value="Unknown" color="text-zinc-600" />
            <StatusCard label="Vault" value="Unknown" color="text-zinc-600" />
          </div>
          <div className="rounded-lg border border-red-500/15 bg-red-500/[0.03] p-4 text-center">
            <p className="text-[13px] font-semibold text-red-400 mb-1">RPC Connection Error</p>
            <p className="text-sm text-zinc-500 mb-3">{error}</p>
            <button onClick={refreshSlab} className="px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.08] rounded text-sm text-zinc-300 transition">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const copy = (s: string) => { navigator.clipboard.writeText(s); };

  return (
    <div className="flex-1 overflow-auto">
      <div className="w-full px-4 lg:px-6 py-4 lg:py-6 space-y-4">
        {/* ============ 1) Identity Header ============ */}
        <section className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-[16px] font-bold text-foreground tracking-tight">Market Proof</h2>
              <span className="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-primary text-primary-foreground">
                DEVNET
              </span>
                {header?.resolved && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20">
                    RESOLVED
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-zinc-400">{short(marketId, 12)}</span>
                <CopyBtn onClick={() => copy(marketId)} />
              </div>
              {config && (
                <div className="flex items-center gap-3 mt-1 text-xs text-zinc-600">
                  <span>Collateral: {short(config.collateralMint.toBase58(), 6)}</span>
                  <span>Invert: {config.invert ? "Yes" : "No"}</span>
                  <span>Unit Scale: {config.unitScale}</span>
                </div>
              )}
          </div>
          <button
            onClick={refreshSlab}
            disabled={refreshing}
            className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.07] rounded-lg text-sm text-zinc-400 transition flex items-center gap-1.5 shrink-0 border border-white/[0.06]"
          >
            {refreshing ? (
              <div className="w-3 h-3 border border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Refresh
          </button>
        </section>

        {/* ============ Top status cards ============ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatusCard label="Market" value="Found" color="text-[#00E5FF]" />
          <StatusCard label="Oracle" value={oracleType.toUpperCase()} color={oracleType !== "unknown" ? "text-[#00E5FF]" : "text-zinc-600"} />
          <StatusCard label="Crank" value={crankStale ? `Stale (${crankAge})` : `Fresh (${crankAge})`} color={crankStale ? "text-amber-400" : "text-[#00E5FF]"} />
          <StatusCard label="Vault" value={vaultBalance !== null ? formatTokenAmount(vaultBalance, collateralDecimals) : "Unknown"} color={vaultBalance !== null ? "text-zinc-300" : "text-zinc-600"} />
        </div>

        {/* ============ 2) Addresses Truth Table ============ */}
        <Section title="Addresses">
          <div className="space-y-0.5">
            <AddrRow label="Slab / Market" value={marketId} cluster={cluster} onCopy={() => copy(marketId)} />
            <AddrRow label="Percolator Program" value={slabOwner.toBase58()} cluster={cluster} onCopy={() => copy(slabOwner.toBase58())} />
            <AddrRow label="Matcher Program" value={DEVNET.matcherProgramId} cluster={cluster} onCopy={() => copy(DEVNET.matcherProgramId)} />
            {oracleType === "authority" && config
              ? <AddrRow label="Oracle" value={config.oracleAuthority.toBase58()} cluster={cluster} badge="AUTHORITY" onCopy={() => copy(config.oracleAuthority.toBase58())} />
              : <AddrRow label="Oracle" value={config?.indexFeedId.toBase58() || "N/A"} cluster={cluster} badge={oracleType.toUpperCase()} onCopy={() => config && copy(config.indexFeedId.toBase58())} />
            }
            {config && <AddrRow label="Collateral Mint" value={config.collateralMint.toBase58()} cluster={cluster} onCopy={() => copy(config.collateralMint.toBase58())} />}
            {config && <AddrRow label="Vault" value={config.vaultPubkey.toBase58()} cluster={cluster} onCopy={() => copy(config.vaultPubkey.toBase58())} />}
            {hasOracleAuthority && config && (
              <AddrRow label="Oracle Authority" value={config.oracleAuthority.toBase58()} cluster={cluster} onCopy={() => copy(config.oracleAuthority.toBase58())} />
            )}
            {header && (
              header.admin.equals(BURNED_ADMIN)
                ? <AddrRow label="Admin" value="Burned (immutable)" cluster={cluster} badge="IMMUTABLE" onCopy={() => copy("Burned")} />
                : <AddrRow label="Admin" value={header.admin.toBase58()} cluster={cluster} onCopy={() => copy(header.admin.toBase58())} />
            )}
            {matcherCtx && <AddrRow label="Matcher Context" value={matcherCtx} cluster={cluster} onCopy={() => copy(matcherCtx)} />}
          </div>
        </Section>

        {/* ============ 2b) Market Admin (rotate / burn key) ============ */}
        {header && (
          <Section title="Market Admin" subtitle="rotate or burn admin key — burn is irreversible">
            {header.admin.equals(BURNED_ADMIN) ? (
              <div className="p-2.5 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/20">
                <p className="text-sm text-[#00E5FF] font-semibold">Admin key burned (immutable)</p>
                <p className="text-xs text-zinc-500 mt-1">No one can change config, set oracle authority, or perform other admin operations. This market is trust-minimized.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">Current admin:</span>
                  <span className="text-xs font-mono text-zinc-300">{short(header.admin.toBase58(), 8)}</span>
                  {wallet.publicKey && header.admin.equals(wallet.publicKey) && (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">You</span>
                  )}
                </div>
                {wallet.publicKey && header.admin.equals(wallet.publicKey) && (
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-2">
                    <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-semibold">Update or burn admin key</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={newAdminInput}
                        onChange={(e) => setNewAdminInput(e.target.value)}
                        placeholder="New admin pubkey (base58)"
                        className="flex-1 min-w-[200px] bg-white/[0.04] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#00E5FF]/40"
                      />
                      <button
                        onClick={() => {
                          try {
                            const pk = new PublicKey(newAdminInput);
                            if (pk.equals(BURNED_ADMIN)) { setActionError("Use Burn button to burn admin"); return; }
                            handleUpdateAdmin(pk);
                            setNewAdminInput("");
                          } catch {
                            setActionError("Invalid pubkey");
                          }
                        }}
                        disabled={!newAdminInput.trim() || !!status}
                        className="px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.12] disabled:opacity-50 rounded text-xs font-semibold text-zinc-300 transition"
                      >
                        Update admin
                      </button>
                    </div>
                    {!burnAdminConfirm ? (
                      <button
                        onClick={() => setBurnAdminConfirm(true)}
                        className="px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 rounded text-xs font-semibold text-red-400 transition"
                      >
                        Burn admin key (irreversible)
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-amber-400">Confirm: admin ops disabled forever.</span>
                        <button
                          onClick={() => { handleBurnAdmin(); setBurnAdminConfirm(false); }}
                          disabled={!!status}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded text-xs font-semibold text-white transition"
                        >
                          Confirm burn
                        </button>
                        <button onClick={() => setBurnAdminConfirm(false)} className="text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Section>
        )}

        {/* ============ 3) Program Truth Panel ============ */}
        <Section title="Program Truth" subtitle="don't trust, verify">
          {programTruth.length === 0 ? (
            <p className="text-xs text-zinc-700">Loading program inspection…</p>
          ) : (
            <div className="space-y-2">
              {programTruth.map((p) => (
                <div key={p.programId} className="flex items-start gap-3 p-2.5 rounded-lg bg-white/[0.015] border border-white/[0.04]">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs text-zinc-300 truncate">{p.programId}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        p.upgradeable
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-[#00E5FF]/10 text-[#00E5FF]"
                      }`}>
                        {p.upgradeable ? "Upgradeable" : "Immutable"}
                      </span>
                      {p.upgradeAuthority && (
                        <span className="text-[9px] text-zinc-600 font-mono">
                          Authority: {short(p.upgradeAuthority)}
                        </span>
                      )}
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        p.verificationStatus === "verified"
                          ? "bg-[#00E5FF]/10 text-[#00E5FF]"
                          : "bg-zinc-500/10 text-zinc-600"
                      }`}>
                        {p.verificationStatus === "verified" ? "Verified" : "Not verified"}
                      </span>
                    </div>
                  </div>
                  <a
                    href={p.explorerLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] text-[#00E5FF] hover:text-[#00E5FF] transition shrink-0"
                  >
                    Explorer
                  </a>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ============ 4) Oracle Health Panel ============ */}
        <Section title="Oracle Health">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Oracle Type" value={oracleType.toUpperCase()} />
            <StatCard label="Oracle Authority" value={hasOracleAuthority ? "Active" : "Disabled"} color={hasOracleAuthority ? "text-amber-400" : "text-zinc-600"} />
            {hasOracleAuthority && authorityPriceE6 > 0 && (
              <>
                <StatCard label="Mark Price (Authority)" value={`$${(authorityPriceE6 / 1_000_000).toFixed(2)}`} />
                <StatCard label="Funding Rate" value={config ? `${bigToNum(config.authorityTimestamp)} bps/slot` : "—"} />
              </>
            )}
            {config && (
              <>
                <StatCard label="Max Staleness" value={`${bigToNum(config.maxStalenessSlots)}s`} />
                <StatCard label="Conf Filter" value={`${config.confFilterBps} bps`} />
                <StatCard label="Last Effective Price" value={config.lastEffectivePriceE6 > 0n ? `$${(bigToNum(config.lastEffectivePriceE6) / 1_000_000).toFixed(2)}` : "—"} />
              </>
            )}
          </div>
          {/* Push Oracle Price (if authority) */}
          {hasOracleAuthority && wallet.publicKey && config && wallet.publicKey.equals(config.oracleAuthority) && (
            <div className="mt-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-widest font-semibold">Push Price (Authority)</p>
              {status && status.includes("Push") && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                  <span className="text-xs text-zinc-400">{status}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Target price (USD)"
                  value={pushPriceInput}
                  onChange={(e) => setPushPriceInput(e.target.value)}
                  className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded px-2 py-1.5 text-sm text-zinc-300 font-mono"
                />
                <button
                  onClick={handlePushPrice}
                  disabled={!pushPriceInput || !!status}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded text-sm font-medium text-white transition"
                >
                  Push
                </button>
              </div>
              <p className="text-[9px] text-zinc-600 mt-1.5">
                Circuit breaker: price moves gradually toward target (rate-limited per crank). Push + Crank repeatedly to reach large price changes.
              </p>
            </div>
          )}
        </Section>

        {/* ============ 5) Liveness / Crank Panel ============ */}
        <Section title="Liveness / Crank">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <StatCard
              label="Crank Status"
              value={crankStale ? "STALE" : "FRESH"}
              color={crankStale ? "text-amber-400" : "text-[#00E5FF]"}
            />
            <StatCard label="Slots Since Crank" value={String(crankAge)} color={crankStale ? "text-amber-400" : "text-zinc-300"} />
            <StatCard label="Max Staleness" value={`${maxStaleness} slots`} />
            <StatCard label="Last Crank Slot" value={String(lastCrankSlot)} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <StatCard label="Sweep Start" value={String(lastSweepStart)} />
            <StatCard label="Sweep Complete" value={String(lastSweepComplete)} />
            <StatCard label="Crank Cursor" value={engine ? String(engine.crankCursor) : "—"} />
            <StatCard label="Liq Cursor" value={engine ? String(engine.liqCursor) : "—"} />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCrank}
              disabled={!wallet.publicKey || !wallet.sendTransaction || !!status}
              className="px-4 py-2 bg-[#00E5FF] hover:bg-[#00E5FF] disabled:opacity-50 rounded-lg text-sm font-semibold text-white transition"
            >
              {status === "Crank Now…" ? "Cranking…" : "Crank Now"}
            </button>
            {actionSuccess && actionSuccess.includes("Crank") && (
              <span className="text-xs text-[#00E5FF] flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Confirmed
              </span>
            )}
          </div>
        </Section>

        {/* ============ 5b) Pricing Truth Panel ============ */}
        <Section title="Pricing Truth" subtitle="safety posture — real data from matcher + engine">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <StatCard label="Current spread" value={pricingTruth.spreadBps != null ? `${pricingTruth.spreadBps} bps` : "—"} />
            <StatCard label="Skew (LP inventory)" value={pricingTruth.skewInventory != null ? pricingTruth.skewInventory : "—"} />
            <StatCard label="Vol regime" value="—" />
            <StatCard label="Utilization (OI vs cTot)" value={pricingTruth.utilization ?? "—"} />
            <StatCard label="Oracle divergence" value="—" />
            <StatCard label="Guard state" value={pricingTruth.guardState ?? "—"} color={pricingTruth.guardState === "Crank stale" ? "text-amber-400" : "text-zinc-500"} />
          </div>
          <p className="text-[9px] text-zinc-600 mt-2">
            Spread and skew from LP matcher context; guard from crank freshness. PropAmm uses inventory skew. See sdk/docs/PRICING_ROADMAP.md.
          </p>
        </Section>

        {/* ============ 6) Market State Panel ============ */}
        <Section title="Market State" subtitle="real on-chain balances">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Token Account Balance" value={vaultBalance !== null ? formatTokenAmount(vaultBalance, collateralDecimals) : "—"} />
            <StatCard label="Engine Tracked Vault" value={engine ? formatTokenAmount(engine.vault, collateralDecimals) : "—"} />
            <StatCard label="Insurance Balance" value={engine ? formatTokenAmount(engine.insuranceFund.balance, collateralDecimals) : "—"} />
            <StatCard label="Accrued Fee Revenue" value={engine ? formatTokenAmount(engine.insuranceFund.feeRevenue, collateralDecimals) : "—"} />
            <StatCard label="Total OI" value={engine ? String(engine.totalOpenInterest) : "—"} />
            <StatCard
              label="Used Accounts"
              value={(() => {
                if (!slabData || !riskParams) return "—";
                const maxAccts = Number(riskParams.maxAccounts);
                const numUsed = tierAwareNumUsed(slabData, maxAccts);
                return numUsed >= 0 ? `${numUsed} / ${maxAccts}` : "—";
              })()}
            />
            <StatCard label="Lifetime Liquidations" value={engine ? String(engine.lifetimeLiquidations) : "—"} />
            <StatCard label="Funding Rate (last)" value={engine ? `${engine.fundingRateBpsPerSlotLast} bps/slot` : "—"} />
          </div>
          {riskParams && (
            <div className="mt-3">
              <p className="text-xs text-zinc-600 uppercase tracking-widest font-semibold mb-2">Risk Parameters</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                <ParamRow label="Init Margin" value={`${bigToNum(riskParams.initialMarginBps)} bps`} />
                <ParamRow label="Maint Margin" value={`${bigToNum(riskParams.maintenanceMarginBps)} bps`} />
                <ParamRow label="Trading Fee" value={`${bigToNum(riskParams.tradingFeeBps)} bps`} />
                <ParamRow label="Liq Fee" value={`${bigToNum(riskParams.liquidationFeeBps)} bps`} />
                <ParamRow label="Max Accounts" value={String(riskParams.maxAccounts)} />
                <ParamRow label="Warmup Slots" value={String(riskParams.warmupPeriodSlots)} />
                <ParamRow label="New Acct Fee" value={String(riskParams.newAccountFee)} />
                <ParamRow label="Liq Buffer" value={`${bigToNum(riskParams.liquidationBufferBps)} bps`} />
              </div>
            </div>
          )}
        </Section>

        {/* ============ 7) Full Cycle Checklist ============ */}
        <Section title="Full Trading Cycle" subtitle="acceptance test — every action real, every step verified">
          {/* Global status / success / error */}
          {status && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="w-3 h-3 border-2 border-[#00E5FF]/30 border-t-[#00E5FF] rounded-full animate-spin" />
              <span className="text-sm text-zinc-400">{status}</span>
            </div>
          )}
          {actionSuccess && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-[#00E5FF]/[0.06] border border-[#00E5FF]/20 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#00E5FF] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-[#00E5FF] font-medium">{actionSuccess}</p>
            </div>
          )}
          {actionError && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-red-500/[0.05] border border-red-500/20">
              <p className="text-sm text-red-400 whitespace-pre-wrap">{actionError}</p>
            </div>
          )}

          {/* Your Account summary */}
          <div className="mb-4 p-3 rounded-lg bg-white/[0.015] border border-white/[0.04]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Your Account</span>
              {userIdx !== null ? (
                <span className="text-xs text-[#00E5FF] font-mono">Account #{userIdx}</span>
              ) : (
                <span className="text-xs text-zinc-600">Not initialized</span>
              )}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
              <div className="flex justify-between"><span className="text-zinc-600">Collateral Balance</span><span className="font-mono text-zinc-400">{userTokenBalance !== null ? `${formatTokenAmount(userTokenBalance, collateralDecimals)} tokens` : "—"}</span></div>
              {userAccount && (
                <>
                  <div className="flex justify-between"><span className="text-zinc-600">Capital</span><span className="font-mono text-zinc-400">{formatTokenAmount(userAccount.capital, collateralDecimals)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-600">PnL</span><span className={`font-mono ${Number(userAccount.pnl) > 0 ? "text-[#00E5FF]" : Number(userAccount.pnl) < 0 ? "text-red-400" : "text-zinc-400"}`}>{String(userAccount.pnl)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-600">Position</span><span className={`font-mono ${Number(userAccount.positionSize) !== 0 ? "text-amber-400" : "text-zinc-400"}`}>{String(userAccount.positionSize)}</span></div>
                </>
              )}
            </div>
          </div>

          {/* LP Account summary */}
          {lpIdx !== null && (
            <div className="mb-4 p-3 rounded-lg bg-white/[0.015] border border-white/[0.04]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">LP Account</span>
                <span className="text-xs text-[#00E5FF] font-mono">Account #{lpIdx}</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                {lpAccount ? (
                  <>
                    <div className="flex justify-between"><span className="text-zinc-600">LP Capital</span><span className="font-mono text-zinc-400">{formatTokenAmount(lpAccount.capital, collateralDecimals)}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-600">LP Position</span><span className={`font-mono ${Number(lpAccount.positionSize) !== 0 ? "text-amber-400" : "text-zinc-400"}`}>{String(lpAccount.positionSize)}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-600">LP PnL</span><span className={`font-mono ${Number(lpAccount.pnl) > 0 ? "text-[#00E5FF]" : Number(lpAccount.pnl) < 0 ? "text-red-400" : "text-zinc-400"}`}>{String(lpAccount.pnl)}</span></div>
                  </>
                ) : (
                  <div className="text-zinc-600">Loading…</div>
                )}
              </div>
              {lpAccount && lpAccount.capital === 0n && (
                <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded">
                  <p className="text-[9px] text-amber-400 mb-1.5">
                    LP has zero capital — all trades will fail with &quot;Undercollateralized&quot;.
                    Deposit tokens to the LP to enable trading.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Amount (tokens)"
                      value={lpDepositAmt}
                      onChange={(e) => setLpDepositAmt(e.target.value)}
                      className="w-32 bg-white/[0.03] border border-white/[0.06] rounded px-2 py-1 text-xs text-zinc-300 font-mono"
                    />
                    <button
                      onClick={handleFundLP}
                      disabled={!lpDepositAmt || !!status}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded text-xs font-medium text-white transition"
                    >
                      Fund LP
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---- 6-Step Checklist ---- */}
          <div className="space-y-2">
            {/* Step 1: Init User */}
            <CycleStep
              step={1}
              label="Init User Account"
              desc="Creates your trading account on-chain. Pays a small fee in collateral tokens."
              done={userIdx !== null}
              active={userIdx === null}
              disabled={!wallet.publicKey || !!status || userIdx !== null}
              receipt={marketReceipts.find(r => r.action === "Init User")}
            >
              {userIdx === null && (
                <div className="mt-2">
                  {userTokenBalance !== null && userTokenBalance === 0n && (
                    <p className="text-[9px] text-amber-400 mb-1.5">You need collateral tokens in your wallet. Mint them in the Token Factory first.</p>
                  )}
                  <button
                    onClick={handleInitUser}
                    disabled={!wallet.publicKey || !!status}
                    className="px-4 py-1.5 bg-white/[0.06] hover:bg-white/[0.09] disabled:opacity-50 rounded text-sm font-semibold text-zinc-200 transition"
                  >
                    Init User
                  </button>
                </div>
              )}
            </CycleStep>

            {/* Step 2: Deposit */}
            <CycleStep
              step={2}
              label="Deposit Collateral"
              desc="Transfer collateral tokens from your wallet into the market vault."
              done={userAccount !== null && Number(userAccount.capital) > 0}
              active={userIdx !== null && (userAccount === null || Number(userAccount.capital) === 0)}
              disabled={userIdx === null || !!status}
              receipt={marketReceipts.find(r => r.action === "Deposit")}
            >
              {userIdx !== null && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    placeholder="Amount (token units)"
                    value={depositAmt}
                    onChange={(e) => setDepositAmt(e.target.value)}
                    className="w-40 bg-white/[0.03] border border-white/[0.06] rounded px-2 py-1.5 text-sm text-zinc-300 font-mono"
                  />
                  <button
                    onClick={handleDeposit}
                    disabled={!depositAmt || !!status}
                    className="px-3 py-1.5 bg-[#00E5FF] hover:bg-[#00E5FF] disabled:opacity-50 rounded text-sm font-medium text-white transition"
                  >
                    Deposit
                  </button>
                </div>
              )}
            </CycleStep>

            {/* Step 3: Crank */}
            <CycleStep
              step={3}
              label="Crank Now"
              desc="Update the market engine. Required before risk-increasing trades."
              done={!crankStale && marketReceipts.some(r => r.action === "Crank Now")}
              active={userAccount !== null && Number(userAccount.capital) > 0}
              disabled={!wallet.publicKey || !!status}
              receipt={marketReceipts.filter(r => r.action === "Crank Now").pop()}
            >
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleCrank}
                  disabled={!wallet.publicKey || !!status}
                  className="px-3 py-1.5 bg-[#00E5FF] hover:bg-[#00E5FF] disabled:opacity-50 rounded text-sm font-medium text-white transition"
                >
                  Crank
                </button>
                <span className={`text-[9px] ${crankStale ? "text-amber-400" : "text-[#00E5FF]"}`}>
                  {crankStale ? `Stale (${crankAge} slots)` : `Fresh (${crankAge} slots)`}
                </span>
              </div>
            </CycleStep>

            {/* Step 4: Open Trade */}
            <CycleStep
              step={4}
              label="Open Position"
              desc="Execute a trade. Long or Short with a specified size."
              done={userAccount !== null && Number(userAccount.positionSize) !== 0}
              active={userAccount !== null && Number(userAccount.capital) > 0 && !crankStale && lpIdx !== null}
              disabled={userIdx === null || !!status || crankStale || lpIdx === null || (userAccount !== null && Number(userAccount.capital) === 0)}
              receipt={marketReceipts.find(r => r.action.startsWith("Trade"))}
            >
              {userIdx !== null && (
                <div className="space-y-2 mt-2">
                  <input
                    type="text"
                    placeholder="Size (raw units, e.g. 1000000)"
                    value={tradeSize}
                    onChange={(e) => setTradeSize(e.target.value)}
                    className="w-56 bg-white/[0.03] border border-white/[0.06] rounded px-2 py-1.5 text-sm text-zinc-300 font-mono"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTrade("long")}
                      disabled={!tradeSize || !!status || crankStale || lpIdx === null || matcherInitialized !== true}
                      className="px-3 py-1.5 bg-[#00E5FF] hover:bg-[#00E5FF] disabled:opacity-50 rounded text-sm font-medium text-white transition"
                    >
                      Long
                    </button>
                    <button
                      onClick={() => handleTrade("short")}
                      disabled={!tradeSize || !!status || crankStale || lpIdx === null || matcherInitialized !== true}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded text-sm font-medium text-white transition"
                    >
                      Short
                    </button>
                  </div>
                  {lpIdx === null && <p className="text-[9px] text-zinc-600">No LP found — cannot trade</p>}
                  {crankStale && <p className="text-[9px] text-amber-400">Crank stale — trade disabled</p>}
                  {matcherInitialized !== true && matcherCtx && (
                    <div className="mt-1.5 p-2 bg-amber-500/10 border border-amber-500/20 rounded">
                      <p className="text-[9px] text-amber-400 mb-1.5">
                        {matcherInitialized === null ? "Checking matcher context…" : "Matcher context not initialized — required before trading"}
                      </p>
                      {matcherInitialized === false && (
                        <button
                          onClick={handleInitMatcher}
                          disabled={!!status}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded text-xs font-medium text-white transition"
                        >
                          Init Matcher
                        </button>
                      )}
                    </div>
                  )}
                  {matcherInitialized === true && (
                    <p className="text-[9px] text-[#00E5FF] mt-1">Matcher initialized</p>
                  )}
                </div>
              )}
            </CycleStep>

            {/* Step 5: Close Position */}
            <CycleStep
              step={5}
              label="Close Position"
              desc="Flatten your position by trading the opposite direction."
              done={userAccount !== null && Number(userAccount.positionSize) === 0 && marketReceipts.filter(r => r.action.startsWith("Trade")).length >= 2}
              active={userAccount !== null && Number(userAccount.positionSize) !== 0}
              disabled={userIdx === null || !!status || crankStale || lpIdx === null || !userAccount || Number(userAccount.positionSize) === 0}
              receipt={marketReceipts.filter(r => r.action.startsWith("Trade")).length >= 2 ? marketReceipts.filter(r => r.action.startsWith("Trade")).pop() : undefined}
            >
              {userAccount && Number(userAccount.positionSize) !== 0 && (
                <div className="mt-2">
                  <p className="text-[9px] text-zinc-500 mb-1.5">
                    Current position: <span className="font-mono text-amber-400">{String(userAccount.positionSize)}</span>
                    {" — "}will trade <span className="font-mono">{Number(userAccount.positionSize) > 0 ? "short" : "long"} {String(Number(userAccount.positionSize) > 0 ? userAccount.positionSize : -BigInt(String(userAccount.positionSize)))}</span> to close
                  </p>
                  <button
                    onClick={() => {
                      const pos = BigInt(String(userAccount.positionSize));
                      const closeSize = -pos; // negate current position to flatten
                      const dir = pos > 0n ? "short" : "long";
                      const lpI = tradeLpIdx ? parseInt(tradeLpIdx) : lpIdx;
                      if (lpI === null || !matcherCtx) { setActionError("No LP available"); return; }
                      if (!lpOwner) { setActionError("LP owner not resolved — refresh page"); return; }
                      const oracleAcct = config && !config.indexFeedId.equals(PublicKey.default) ? config.indexFeedId : slabPk;
                      sendAndReceipt(`Trade ${dir} (close)`, async () => {
                        const fullParams = { ...params, matcherProgramId: MATCHER_PROGRAM_ID, matcherContext: new PublicKey(matcherCtx) };
                        const ix = buildTradeCpiIxDirect(fullParams, wallet.publicKey!, lpI, lpOwner, oracleAcct, userIdx!, closeSize);
                        return new Transaction().add(ix);
                      }, 400_000);
                    }}
                    disabled={!!status || crankStale || lpIdx === null || matcherInitialized !== true}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded text-sm font-medium text-white transition"
                  >
                    Close Position
                  </button>
                </div>
              )}
            </CycleStep>

            {/* Step 6: Withdraw */}
            <CycleStep
              step={6}
              label="Withdraw"
              desc="Withdraw collateral back to your wallet. Only when no open positions."
              done={marketReceipts.some(r => r.action === "Withdraw")}
              active={userAccount !== null && Number(userAccount.positionSize) === 0 && Number(userAccount.capital) > 0}
              disabled={userIdx === null || !!status || (userAccount !== null && Number(userAccount.positionSize) !== 0)}
              receipt={marketReceipts.find(r => r.action === "Withdraw")}
            >
              {userIdx !== null && userAccount && Number(userAccount.positionSize) === 0 && Number(userAccount.capital) > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    placeholder="Amount"
                    value={withdrawAmt}
                    onChange={(e) => setWithdrawAmt(e.target.value)}
                    className="w-40 bg-white/[0.03] border border-white/[0.06] rounded px-2 py-1.5 text-sm text-zinc-300 font-mono"
                  />
                  <button
                    onClick={handleWithdraw}
                    disabled={!withdrawAmt || !!status}
                    className="px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.09] disabled:opacity-50 rounded text-sm font-medium text-zinc-300 transition"
                  >
                    Withdraw
                  </button>
                </div>
              )}
            </CycleStep>
          </div>

          {/* Cycle completion */}
          {marketReceipts.some(r => r.action === "Withdraw") && (
            <div className="mt-4 p-4 rounded-lg bg-[#00E5FF]/[0.04] border border-[#00E5FF]/20 text-center">
              <p className="text-[13px] font-bold text-[#00E5FF]">Full Cycle Complete</p>
              <p className="text-xs text-zinc-500 mt-1">Init → Deposit → Crank → Trade → Close → Withdraw — all verified with receipts.</p>
            </div>
          )}
        </Section>

        {/* ============ 8) Receipts (market-scoped) ============ */}
        <Section title="Receipts" subtitle={`${marketReceipts.length} for this market`}>
          {marketReceipts.length === 0 ? (
            <p className="text-xs text-zinc-700 text-center py-4">No receipts for this market yet</p>
          ) : (
            <div className="space-y-1 max-h-[300px] overflow-auto">
              {marketReceipts.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-2 rounded bg-white/[0.015] border border-white/[0.04]">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-300">{r.action}</span>
                      <span className="text-[9px] text-zinc-600 font-mono">{new Date(r.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-[9px] text-zinc-600 font-mono truncate">{r.txSignatures[0]}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {r.invokedPrograms.slice(0, 3).map((p) => (
                      <span
                        key={p.programId}
                        title={`${short(p.programId, 6)} — ${p.upgradeable ? "Upgradeable" : "Immutable"}${p.upgradeAuthority ? ` (auth: ${short(p.upgradeAuthority, 4)})` : ""}`}
                        className={`text-[7px] px-1 py-0.5 rounded font-bold uppercase ${
                          p.upgradeable ? "bg-amber-500/10 text-amber-500" : "bg-[#00E5FF]/10 text-[#00E5FF]"
                        }`}
                      >
                        {p.upgradeable ? "Upgradeable" : "Immutable"}
                      </span>
                    ))}
                    <a
                      href={r.explorerLinks[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] text-[#00E5FF] hover:text-[#00E5FF]"
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
          {marketReceipts.length > 0 && (
            <button
              onClick={() => {
                const json = JSON.stringify(marketReceipts, null, 2);
                const blob = new Blob([json], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `receipts-${short(marketId, 8)}.json`;
                a.click();
              }}
              className="mt-2 text-xs text-[#00E5FF] hover:text-[#00E5FF] transition"
            >
              Export Receipts JSON
            </button>
          )}
        </Section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-white/[0.04] bg-white/[0.01] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/[0.04] flex items-center gap-2">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">{title}</h3>
        {subtitle && <span className="text-[9px] text-zinc-700 italic">{subtitle}</span>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function AddrRow({ label, value, cluster, badge, onCopy }: { label: string; value: string; cluster: string; badge?: string; onCopy: () => void }) {
  return (
    <div className="flex items-center gap-3 py-1 group">
      <span className="text-xs text-zinc-600 w-28 shrink-0 uppercase tracking-wider">{label}</span>
      <span className="font-mono text-xs text-zinc-400 truncate flex-1">{value}</span>
      {badge && (
        <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-500">{badge}</span>
      )}
      <a
        href={explorerAccountUrl(value, cluster as "devnet")}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[9px] text-[#00E5FF] hover:text-[#00E5FF] transition opacity-0 group-hover:opacity-100 shrink-0"
      >
        Explorer
      </a>
      <CopyBtn onClick={onCopy} />
    </div>
  );
}

function CopyBtn({ onClick }: { onClick: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { onClick(); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
      className="text-[9px] text-zinc-600 hover:text-[#00E5FF] transition shrink-0 px-1"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function StatCard({ label, value, color = "text-zinc-300" }: { label: string; value: string; color?: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-white/[0.015] border border-white/[0.04]">
      <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-0.5">{label}</p>
      <p className={`text-[12px] font-mono font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function ParamRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-zinc-600">{label}</span>
      <span className="font-mono text-zinc-400">{value}</span>
    </div>
  );
}

function StatusCard({ label, value, color = "text-zinc-300" }: { label: string; value: string; color?: string }) {
  return (
    <div className="p-3 rounded-lg bg-white/[0.015] border border-white/[0.04]">
      <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-semibold mb-0.5">{label}</p>
      <p className={`text-[13px] font-bold ${color}`}>{value}</p>
    </div>
  );
}

/* ---- Full Cycle Step ---- */
function CycleStep({
  step, label, desc, done, active, disabled, receipt, children,
}: {
  step: number;
  label: string;
  desc: string;
  done: boolean;
  active: boolean;
  disabled: boolean;
  receipt?: { txSignatures: string[]; explorerLinks: string[] };
  children?: React.ReactNode;
}) {
  const borderColor = done
    ? "border-[#00E5FF]/25"
    : active
    ? "border-white/[0.08]"
    : "border-white/[0.04]";
  const bgColor = done
    ? "bg-[#00E5FF]/[0.02]"
    : active
    ? "bg-white/[0.015]"
    : "bg-white/[0.005]";

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} p-3 transition-colors`}>
      <div className="flex items-center gap-3">
        {/* Step indicator */}
        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
          done
            ? "bg-[#00E5FF] text-white"
            : active
            ? "bg-white/[0.08] text-zinc-300 border border-white/[0.1]"
            : "bg-white/[0.02] text-zinc-700 border border-white/[0.04]"
        }`}>
          {done ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            step
          )}
        </div>

        {/* Label + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[12px] font-semibold ${done ? "text-[#00E5FF]" : active ? "text-zinc-200" : "text-zinc-600"}`}>{label}</span>
            {done && receipt && (
              <a
                href={receipt.explorerLinks[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[8px] px-1.5 py-0.5 rounded bg-[#00E5FF]/10 text-[#00E5FF] hover:text-[#00E5FF]/90 transition font-mono"
              >
                {receipt.txSignatures[0]?.slice(0, 12)}…
              </a>
            )}
          </div>
          <p className={`text-[9px] ${done ? "text-zinc-600" : active ? "text-zinc-500" : "text-zinc-700"}`}>{desc}</p>
        </div>
      </div>

      {/* Step action content (input fields, buttons) */}
      {!done && !disabled && children && (
        <div className="ml-10">
          {children}
        </div>
      )}
    </div>
  );
}
