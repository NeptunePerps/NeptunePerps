"use client";

import { useState } from "react";
import type { Receipt } from "@/lib/proof-client";
import { explorerTxUrl } from "@/lib/proof-client";
import { useReceipts } from "./receipts-provider";

export function ReceiptsDock({ receipts }: { receipts: Receipt[] }) {
  const { clearReceipts, exportReceipts } = useReceipts();
  const [filterMarket, setFilterMarket] = useState("");

  const filtered = filterMarket
    ? receipts.filter(
        (r) =>
          r.marketId?.includes(filterMarket) ||
          r.marketLabel?.toLowerCase().includes(filterMarket.toLowerCase()) ||
          r.action.toLowerCase().includes(filterMarket.toLowerCase())
      )
    : receipts;

  const handleExport = () => {
    const json = exportReceipts();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sov-receipts-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside className="w-64 xl:w-72 border-l border-white/[0.04] flex flex-col bg-card/80 backdrop-blur-xl shrink-0">
      {/* Header */}
      <div className="h-10 border-b border-white/[0.04] flex items-center px-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="h-6 w-6 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center">
            <svg className="w-3 h-3 text-[#00E5FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
            Receipts
          </span>
        </div>
        {receipts.length > 0 && (
          <span className="ml-auto text-[9px] text-primary bg-primary/15 px-1.5 py-0.5 rounded-full font-bold font-mono">
            {receipts.length}
          </span>
        )}
      </div>

      {/* Filter */}
      <div className="p-2.5 border-b border-white/[0.04]">
        <input
          type="text"
          placeholder="Filter by market, action…"
          value={filterMarket}
          onChange={(e) => setFilterMarket(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/[0.05] rounded-lg px-2.5 py-1.5 text-[10px] text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-primary/30"
        />
      </div>

      {/* Receipts list */}
      <div className="flex-1 overflow-auto p-2.5 space-y-1.5 min-h-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-4 pt-8">
            <svg className="w-5 h-5 text-zinc-800 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-[10px] text-zinc-600 text-center">
              {receipts.length === 0 ? "No receipts yet. Every action produces a verified receipt." : "No matches found."}
            </p>
          </div>
        ) : (
          filtered.map((r) => <ReceiptCard key={r.id} receipt={r} />)
        )}
      </div>

      {/* Footer actions */}
      {receipts.length > 0 && (
        <div className="border-t border-white/[0.04] px-3 py-1.5 flex items-center gap-2">
          <button
            onClick={handleExport}
            className="text-[9px] text-primary hover:text-primary/80 transition"
          >
            Export JSON
          </button>
          <button
            onClick={clearReceipts}
            className="text-[9px] text-zinc-600 hover:text-red-400 transition ml-auto"
          >
            Clear
          </button>
        </div>
      )}
    </aside>
  );
}

function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] overflow-hidden shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2.5 text-left hover:bg-white/[0.03] transition"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-zinc-100 truncate">{receipt.action}</span>
          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
            receipt.mode === "mainnet"
              ? "bg-primary/10 text-primary"
              : "bg-amber-500/10 text-amber-400"
          }`}>
            {receipt.mode}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] text-zinc-500 font-mono truncate flex-1">
            {receipt.txSignatures[0]?.slice(0, 20)}…
          </span>
          <span className="text-[8px] text-zinc-600">
            {new Date(receipt.timestamp).toLocaleTimeString()}
          </span>
        </div>
        {receipt.marketId && (
          <div className="text-[8px] text-zinc-600 font-mono truncate mt-0.5">
            Market: {receipt.marketId.slice(0, 16)}…
          </div>
        )}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-white/[0.04] pt-2">
          {/* Tx signatures */}
          {receipt.txSignatures.map((sig, i) => (
            <a
              key={sig}
              href={receipt.explorerLinks[i] || explorerTxUrl(sig, receipt.cluster)}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[9px] text-primary hover:text-primary/80 font-mono truncate transition"
            >
              {sig.slice(0, 28)}…
            </a>
          ))}

          {/* Pricing at fill (when available) */}
          {receipt.pricingContext && (
            <div className="mt-1.5 p-1.5 rounded-lg bg-primary/5 border border-primary/10">
              <div className="text-[8px] text-primary/90 uppercase tracking-widest mb-1 font-semibold">
                Pricing at fill
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] font-mono text-zinc-400">
                {receipt.pricingContext.spreadBpsAtFill != null && <><span className="text-zinc-600">Spread</span><span>{receipt.pricingContext.spreadBpsAtFill} bps</span></>}
                {receipt.pricingContext.skewBefore != null && <><span className="text-zinc-600">Skew before</span><span>{receipt.pricingContext.skewBefore}</span></>}
                {receipt.pricingContext.skewAfter != null && <><span className="text-zinc-600">Skew after</span><span>{receipt.pricingContext.skewAfter}</span></>}
                {receipt.pricingContext.oracleFreshnessSlots != null && <><span className="text-zinc-600">Oracle fresh</span><span>{receipt.pricingContext.oracleFreshnessSlots} slots</span></>}
                {receipt.pricingContext.crankFreshnessSlots != null && <><span className="text-zinc-600">Crank fresh</span><span>{receipt.pricingContext.crankFreshnessSlots} slots</span></>}
                {receipt.pricingContext.guardTriggered && receipt.pricingContext.guardTriggered !== "none" && <><span className="text-zinc-600">Guard</span><span className="text-amber-400">{receipt.pricingContext.guardTriggered}</span></>}
              </div>
            </div>
          )}

          {/* Invoked programs with truth */}
          {receipt.invokedPrograms.length > 0 && (
            <div className="mt-1.5">
              <div className="text-[8px] text-zinc-600 uppercase tracking-widest mb-1 font-semibold">
                Invoked Programs
              </div>
              {receipt.invokedPrograms.map((p) => (
                <div key={p.programId} className="py-1 border-b border-white/[0.02] last:border-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono text-zinc-400 truncate flex-1">
                      {p.programId.slice(0, 16)}…
                    </span>
                    <span className={`text-[7px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                      p.upgradeable
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-primary/10 text-primary"
                    }`}>
                      {p.upgradeable ? "Upgradeable" : "Immutable"}
                    </span>
                  </div>
                  {p.upgradeAuthority && (
                    <div className="text-[8px] text-zinc-600 font-mono mt-0.5">
                      Authority: {p.upgradeAuthority.slice(0, 12)}…
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[7px] font-bold uppercase ${
                      p.verificationStatus === "verified"
                        ? "text-primary"
                        : p.verificationStatus === "unverified"
                          ? "text-zinc-600"
                          : "text-zinc-700"
                    }`}>
                      {p.verificationStatus}
                    </span>
                    <a
                      href={p.explorerLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[8px] text-primary hover:text-primary/80"
                    >
                      Explorer
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
