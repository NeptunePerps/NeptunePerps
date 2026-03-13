"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { DEVNET } from "@sov/config";
import type { DevnetMarketInfo } from "@sov/percolator-sdk";
import {
  fetchSlab,
  parseEngine,
  parseConfig,
  parseHeader,
  parseParams,
  parseUsedIndices,
  parseAccount,
  AccountKind,
} from "@sov/percolator-sdk";
import { explorerAccountUrl } from "@/lib/proof-client";

/* ------------------------------------------------------------------ */
/*  Local storage registry (no hardcoded markets)                      */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "sov_devnet_markets";

function loadMarketsFromStorage(): DevnetMarketInfo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMarketsToStorage(markets: DevnetMarketInfo[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(markets));
  } catch {}
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function short(s: string, len = 6) {
  if (s.length <= len * 2 + 3) return s;
  return `${s.slice(0, len)}…${s.slice(-len)}`;
}

function isValidBase58(s: string): boolean {
  try { new PublicKey(s); return true; } catch { return false; }
}

/* ------------------------------------------------------------------ */
/*  Market live status                                                 */
/* ------------------------------------------------------------------ */

type SlabStatus = {
  state: "loading" | "found" | "not_found" | "rpc_error";
  crankFresh?: boolean;
  crankAge?: number;
  usedAccounts?: number;
  vaultBalance?: string;
  hasLP?: boolean;
  errorMsg?: string;
};

/**
 * Market Quality Score: 0 = Low, 1 = Medium, 2 = High.
 * Parameters: (1) crank fresh = +1, (2) has LP = +1. No mock — uses on-chain slab + engine.
 */
function qualityScore(status: SlabStatus): 0 | 1 | 2 {
  if (status.state !== "found") return 0;
  let s = 0;
  if (status.crankFresh) s += 1;
  if (status.hasLP) s += 1;
  return s as 0 | 1 | 2;
}

function qualityLabel(score: 0 | 1 | 2): string {
  return score === 2 ? "High (crank fresh + LP)" : score === 1 ? "Medium (crank or LP)" : "Low (stale + no LP)";
}

function useSlabStatus(connection: ReturnType<typeof useConnection>["connection"], slab: string): SlabStatus {
  const [status, setStatus] = useState<SlabStatus>({ state: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchSlab(connection, new PublicKey(slab));
        const engine = parseEngine(data);
        const config = parseConfig(data);
        const crankAge = Number(engine.currentSlot) - Number(engine.lastCrankSlot);
        const maxStale = Number(engine.maxCrankStalenessSlots);

        let hasLP = false;
        try {
          const indices = parseUsedIndices(data);
          for (const idx of indices) {
            try {
              const acc = parseAccount(data, idx);
              if (acc.kind === AccountKind.LP) { hasLP = true; break; }
            } catch {}
          }
        } catch {}

        let vaultBalance: string | undefined;
        try {
          const bal = await connection.getTokenAccountBalance(config.vaultPubkey);
          vaultBalance = bal.value.uiAmountString ?? (Number(bal.value.amount) / (10 ** (bal.value.decimals || 9))).toFixed(4);
        } catch {}

        if (!cancelled) {
          setStatus({
            state: "found",
            crankFresh: crankAge <= maxStale,
            crankAge,
            usedAccounts: engine.numUsedAccounts,
            vaultBalance,
            hasLP,
          });
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        // Distinguish "not found" from actual RPC errors
        if (msg.includes("not found") || msg.includes("null")) {
          setStatus({ state: "not_found", errorMsg: "Account not found on devnet" });
        } else {
          setStatus({ state: "rpc_error", errorMsg: msg });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [connection, slab]);

  return status;
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function DevnetMarketDirectory() {
  const { connection } = useConnection();
  const [markets, setMarkets] = useState<DevnetMarketInfo[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [selectedSlab, setSelectedSlab] = useState<string | null>(null);

  // Load from storage on mount
  useEffect(() => {
    setMarkets(loadMarketsFromStorage());
  }, []);

  /* ---- Import with validation ---- */
  const handleImport = async () => {
    setImportError(null);
    setImporting(true);
    try {
      const parsed = JSON.parse(importJson) as DevnetMarketInfo;

      // 1. Validate required fields
      if (!parsed.slab || !parsed.programId || !parsed.oracle) {
        throw new Error("Missing required fields: slab, programId, oracle");
      }

      // 2. Validate pubkeys
      if (!isValidBase58(parsed.slab)) throw new Error(`Invalid slab pubkey: ${parsed.slab}`);
      if (!isValidBase58(parsed.programId)) throw new Error(`Invalid programId: ${parsed.programId}`);
      if (!isValidBase58(parsed.oracle)) throw new Error(`Invalid oracle pubkey: ${parsed.oracle}`);
      if (parsed.matcherProgramId && !isValidBase58(parsed.matcherProgramId)) {
        throw new Error(`Invalid matcherProgramId: ${parsed.matcherProgramId}`);
      }

      // 3. Check slab exists on devnet
      const slabPk = new PublicKey(parsed.slab);
      const info = await connection.getAccountInfo(slabPk);
      if (!info) {
        throw new Error(`Slab not found on devnet: ${parsed.slab}\nThis address may not exist or may be on a different cluster.`);
      }

      // 4. Verify slab owner matches expected program
      const expectedProgram = parsed.programId || DEVNET.percolatorProgramId;
      if (info.owner.toBase58() !== expectedProgram) {
        throw new Error(
          `Slab owner mismatch: expected ${short(expectedProgram)}, got ${short(info.owner.toBase58())}.\nThis account may not be a Percolator market.`
        );
      }

      parsed.network = "devnet";
      const next = [parsed, ...markets.filter((m) => m.slab !== parsed.slab)];
      setMarkets(next);
      saveMarketsToStorage(next);
      setImportJson("");
      setShowImport(false);
    } catch (e) {
      if (e instanceof SyntaxError) {
        setImportError("Invalid JSON format");
      } else {
        setImportError(e instanceof Error ? e.message : "Import failed");
      }
    } finally {
      setImporting(false);
    }
  };

  const handleRemove = (slab: string) => {
    const next = markets.filter((m) => m.slab !== slab);
    setMarkets(next);
    saveMarketsToStorage(next);
    if (selectedSlab === slab) setSelectedSlab(null);
  };

  const selectedMarket = markets.find((m) => m.slab === selectedSlab);

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="flex gap-4 min-h-[calc(100vh-180px)] flex-col lg:flex-row">
      {/* ====== Left: Market Directory ====== */}
     {
      markets.length > 0 &&  <div className="w-full lg:w-[380px] shrink-0 flex flex-col">
      {/* Actions: only show when there are markets or when import is open (no duplicate CTAs when empty) */}
      {(markets.length > 0 || showImport) && (
        <div className="rounded-lg border border-border bg-surface p-2.5 mb-3">
          <div className="flex items-center gap-2">
            <Link
              href="/app/devnet/launch"
              className="px-3 py-1.5 bg-primary hover:bg-primary/90 rounded-md text-xs font-semibold text-primary-foreground transition flex items-center gap-1.5"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Launch Market
            </Link>
            <button
              onClick={() => setShowImport(!showImport)}
              className="px-2.5 py-1.5 border border-border bg-background/60 hover:bg-surface-hover rounded-md text-xs text-muted-foreground hover:text-foreground transition"
            >
              {showImport ? "Cancel" : "Import JSON"}
            </button>
          </div>
        </div>
      )}

      {/* Import form */}
      {showImport && (
        <div className="rounded-lg border border-border bg-surface p-4 mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Import Market JSON</p>
          <textarea
            value={importJson}
            onChange={(e) => { setImportJson(e.target.value); setImportError(null); }}
            placeholder={'{\n  "slab": "...",\n  "programId": "...",\n  "oracle": "..."\n}'}
            className="w-full bg-background/60 border border-border rounded-md px-3 py-2.5 text-sm text-foreground font-mono h-24 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 mb-3"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleImport}
              disabled={!importJson.trim() || importing}
              className="px-3 py-1.5 bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-md text-xs font-medium text-primary-foreground transition"
            >
              {importing ? "Validating…" : "Import"}
            </button>
          </div>
          {importError && (
            <div className="mt-2 p-2 rounded-md border border-destructive/30 bg-destructive/5">
              <p className="text-xs text-destructive whitespace-pre-wrap">{importError}</p>
            </div>
          )}
        </div>
      )}

      {/* Market list; left column empty when no markets */}
      {markets.length === 0 ? null : (
        <div className="space-y-1.5 flex-1 overflow-auto">
          {markets.map((m) => (
            <MarketListItem
              key={m.slab}
              market={m}
              connection={connection}
              selected={selectedSlab === m.slab}
              onSelect={() => setSelectedSlab(m.slab)}
              onRemove={() => handleRemove(m.slab)}
            />
          ))}
        </div>
      )}
    </div>
     }

      {/* ====== Right: Market Inspector (one box) ====== */}
      <div className="flex-1 min-w-0">
        {selectedMarket ? (
          <MarketInspector market={selectedMarket} connection={connection} />
        ) : (
          <InspectorScaffold
            hasMarkets={markets.length > 0}
            onShowImport={() => setShowImport(true)}
          />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Market List Item                                                   */
/* ------------------------------------------------------------------ */

function MarketListItem({
  market,
  connection,
  selected,
  onSelect,
  onRemove,
}: {
  market: DevnetMarketInfo;
  connection: ReturnType<typeof useConnection>["connection"];
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const status = useSlabStatus(connection, market.slab);

  return (
    <div
      onClick={onSelect}
      className={`rounded-lg border p-2.5 cursor-pointer transition ${
        selected
          ? "border-[#00E5FF]/25 bg-[#00E5FF]/[0.03]"
          : "border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02]"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-mono text-xs text-zinc-300 truncate">{short(market.slab, 8)}</span>
        <div className="flex items-center gap-1 shrink-0">
          {status.state === "loading" && (
            <div className="w-2.5 h-2.5 border border-zinc-700 border-t-zinc-500 rounded-full animate-spin" />
          )}
          {status.state === "found" && (
            <>
              <StatusDot ok={status.crankFresh} label={status.crankFresh ? "Fresh" : "Stale"} />
              {status.hasLP && <StatusDot ok={true} label="LP" />}
            </>
          )}
          {status.state === "not_found" && <StatusDot ok={false} label="Not found" />}
          {status.state === "rpc_error" && <StatusDot ok={null} label="RPC Error" />}
        </div>
      </div>
      <div className="flex items-center gap-2 text-[9px] text-zinc-600 flex-wrap">
        {status.state === "found" && (
          <span
            className={`font-bold uppercase px-1.5 py-0.5 rounded ${
              qualityScore(status) === 2 ? "bg-[#00E5FF]/15 text-[#00E5FF]" :
              qualityScore(status) === 1 ? "bg-amber-500/10 text-amber-400" :
              "bg-zinc-500/10 text-zinc-500"
            }`}
            title={qualityLabel(qualityScore(status))}
          >
            Quality: {qualityScore(status) === 2 ? "High" : qualityScore(status) === 1 ? "Medium" : "Low"}
          </span>
        )}
        <span className="uppercase font-bold">{market.oracleType || "unknown"}</span>
        {status.state === "found" && status.usedAccounts !== undefined && (
          <span>{status.usedAccounts} accts</span>
        )}
        {status.state === "found" && status.vaultBalance && (
          <span>Vault: {status.vaultBalance}</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 mt-1.5">
        <Link
          href={`/app/devnet/markets/${market.slab}`}
          onClick={(e) => e.stopPropagation()}
          className="px-2 py-0.5 bg-[#00E5FF] hover:bg-[#00E5FF]/90 rounded text-xs font-semibold text-[#030407] transition"
        >
          Proof Page
        </Link>
        <button
          onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(JSON.stringify(market, null, 2)); }}
          className="px-2 py-0.5 bg-white/[0.04] hover:bg-white/[0.07] rounded text-[9px] text-zinc-500 transition"
        >
          Export
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="px-2 py-0.5 bg-red-500/[0.05] hover:bg-red-500/[0.12] rounded text-[9px] text-red-400/70 hover:text-red-400 transition ml-auto"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Market Inspector (right panel)                                     */
/* ------------------------------------------------------------------ */

function MarketInspector({
  market,
  connection,
}: {
  market: DevnetMarketInfo;
  connection: ReturnType<typeof useConnection>["connection"];
}) {
  const status = useSlabStatus(connection, market.slab);

  if (status.state === "loading") {
    return (
      <div className="h-full flex items-center justify-center rounded-lg border border-border bg-surface/50">
        <div className="text-center">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading market data…</p>
        </div>
      </div>
    );
  }

  if (status.state === "not_found") {
    return (
      <div className="h-full flex items-center justify-center rounded-lg border border-border bg-surface/50">
        <div className="text-center max-w-sm">
          <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center mx-auto mb-3">
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-foreground mb-1">Account not found on devnet</p>
          <p className="text-sm text-muted-foreground font-mono mb-2">{market.slab}</p>
          <p className="text-sm text-muted-foreground mb-3">This address may be on a different cluster or not created yet.</p>
          <div className="flex items-center gap-2 justify-center">
            <a
              href={explorerAccountUrl(market.slab, "devnet")}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 border border-border bg-surface hover:bg-surface-hover rounded-md text-xs text-muted-foreground hover:text-foreground transition"
            >
              Open in Explorer (devnet)
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (status.state === "rpc_error") {
    return (
      <div className="h-full flex items-center justify-center rounded-lg border border-border bg-surface/50">
        <div className="text-center max-w-sm">
          <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
            <svg className="w-4 h-4 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <p className="text-base font-semibold text-destructive mb-1">RPC Error</p>
          <p className="text-sm text-muted-foreground mb-2">{status.errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <StatusChip label="Quality" value={qualityLabel(qualityScore(status))} ok={qualityScore(status) >= 1} />
        <StatusChip label="Market" value="Found" ok={true} />
        <StatusChip label="Crank" value={status.crankFresh ? "Fresh" : "Stale"} ok={status.crankFresh ?? false} />
        <StatusChip label="LP" value={status.hasLP ? "Active" : "None"} ok={status.hasLP ?? false} />
        {status.vaultBalance && <StatusChip label="Vault" value={`${status.vaultBalance} SOL`} ok={true} />}
        <StatusChip label="Accounts" value={String(status.usedAccounts ?? 0)} ok={true} />
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Addresses</p>
        <div className="space-y-0.5">
          <CopyRow label="Slab" value={market.slab} />
          <CopyRow label="Program" value={market.programId} />
          <CopyRow label="Matcher" value={market.matcherProgramId} />
          <CopyRow label="Oracle" value={market.oracle} />
          {market.mint && <CopyRow label="Mint" value={market.mint} />}
          {market.vault && <CopyRow label="Vault" value={market.vault} />}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Link
          href={`/app/devnet/markets/${market.slab}`}
          className="px-3 py-1.5 bg-primary hover:bg-primary/90 rounded-md text-xs font-semibold text-primary-foreground transition"
        >
          Open Full Proof Page
        </Link>
        <a
          href={explorerAccountUrl(market.slab, "devnet")}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 border border-border bg-surface hover:bg-surface-hover rounded-md text-xs text-muted-foreground hover:text-foreground transition"
        >
          Explorer
        </a>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared micro-components                                            */
/* ------------------------------------------------------------------ */

function StatusDot({ ok, label }: { ok: boolean | null | undefined; label: string }) {
  const c = ok === true ? "text-primary" : ok === false ? "text-destructive" : "text-muted-foreground";
  return (
    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-surface border border-border ${c}`}>
      {label}
    </span>
  );
}

function StatusChip({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface border border-border">
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-primary" : "bg-muted-foreground"}`} />
      <span className="text-[9px] text-muted-foreground">{label}:</span>
      <span className={`text-xs font-semibold ${ok ? "text-primary" : "text-muted-foreground"}`}>{value}</span>
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 py-0.5 group">
      <span className="text-[9px] text-muted-foreground w-16 shrink-0 uppercase tracking-wider">{label}</span>
      <span className="font-mono text-[9px] text-foreground truncate flex-1">{value}</span>
      <button
        onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
        className="text-[10px] text-muted-foreground hover:text-primary transition opacity-0 group-hover:opacity-100 shrink-0"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Inspector Scaffold (no market selected)                            */
/* ------------------------------------------------------------------ */

function InspectorScaffold({ hasMarkets, onShowImport }: { hasMarkets: boolean; onShowImport?: () => void }) {
  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden flex flex-col">
      {/* Status block */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-border">
        <ScaffoldCard label="Market" value={hasMarkets ? "Select a market" : "None"} />
        <ScaffoldCard label="Oracle" value="Unknown" />
        <ScaffoldCard label="Crank" value="Unknown" />
        <ScaffoldCard label="Vault" value="Unknown" />
      </div>

      {/* All sections inside the same box */}
      <div className="p-4 flex-1 space-y-0">
        {/* Empty state: inside the box when no markets */}
        {!hasMarkets && (
          <section className="pb-4 border-b border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-background/50 border border-border flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">No devnet markets yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">Markets are permissionless. Launch creates a live market and proof page on devnet.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/app/devnet/launch"
                className="px-3 py-2 bg-primary hover:bg-primary/90 rounded-md text-xs font-semibold text-primary-foreground transition inline-flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Launch New Market
              </Link>
              <button
                type="button"
                onClick={onShowImport}
                className="px-3 py-2 border border-border bg-background/50 hover:bg-surface-hover rounded-md text-xs text-muted-foreground hover:text-foreground transition"
              >
                Import JSON
              </button>
            </div>
          </section>
        )}

        <section className={!hasMarkets ? "py-4 border-b border-border" : "pb-4 border-b border-border"}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Program Truth (from config)</p>
          <div className="divide-y divide-border">
            <ScaffoldRow label="Percolator" value={DEVNET.percolatorProgramId} />
            <ScaffoldRow label="Matcher" value={DEVNET.matcherProgramId} />
            <ScaffoldRow label="Chainlink OCR2" value={DEVNET.chainlinkOcr2ProgramId} />
          </div>
        </section>

        <section className="py-4 border-b border-border">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Actions</p>
          <div className="flex flex-wrap gap-2">
            {["Init User", "Deposit", "Withdraw", "Crank Now", "Trade"].map((action) => (
              <button
                key={action}
                disabled
                className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground bg-background/50 border border-border cursor-not-allowed opacity-70"
                title="Select a market to enable"
              >
                {action}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {hasMarkets ? "Select a market on the left to enable actions" : "Launch or import a market to get started"}
          </p>
        </section>

        <section className="pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Quickstart</p>
          <div className="space-y-2.5">
            {[
              { step: "1", label: "Airdrop SOL", desc: "Get devnet SOL from the top bar" },
              { step: "2", label: "Launch Market", desc: "Create a real market via the wizard" },
              { step: "3", label: "Open Proof Page", desc: "Inspect addresses, programs, oracle" },
              { step: "4", label: "Init → Deposit → Crank → Trade", desc: "Full trading flow with receipts" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0 mt-0.5">
                  {item.step}
                </span>
                <div>
                  <span className="text-xs text-foreground font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground ml-1.5">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ScaffoldCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 border-r border-b border-border even:border-r-0 last:border-r-0">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm text-foreground font-medium mt-1 truncate" title={value}>{value}</p>
    </div>
  );
}

function ScaffoldRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const display = value.length > 20 ? `${value.slice(0, 8)}…${value.slice(-8)}` : value;
  return (
    <div className="flex items-center gap-3 px-3 py-2 group">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider w-24 shrink-0">{label}</span>
      <code className="font-mono text-xs text-foreground truncate flex-1 min-w-0" title={value}>{display}</code>
      <button
        type="button"
        onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
        className="text-[10px] font-medium text-primary hover:underline shrink-0 opacity-80 group-hover:opacity-100 transition"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
