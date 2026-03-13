"use client";

import { useState } from "react";
import { BRAND } from "@/lib/brand";

const STEPS = [
  { label: "You sign", desc: "Approve the trade in your wallet. No SOL needed for gas." },
  { label: "Network fee: $0", desc: "The network fee is handled under the hood; you don’t pay for tx fees." },
  { label: "Tx lands", desc: "The transaction confirms on Solana and updates your position." },
  { label: "Receipt issued", desc: "Proof Page + on-chain receipt so anyone can verify the trade." },
];

export function HowGaslessWorks() {
  const [tradesPerDay, setTradesPerDay] = useState(10);
  const [daysPerMonth, setDaysPerMonth] = useState(20);
  // Network fee + typical priority fees per tx on other platforms (Neptune pays neither)
  const solPerTx = 0.0004;
  const savedSol = (tradesPerDay * daysPerMonth * solPerTx).toFixed(2);

  return (
    <section className="relative py-8 sm:py-16 lg:py-24 xl:py-32 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-1/4 right-0 w-[60%] max-w-[500px] h-[50%] rounded-full opacity-[0.06] blur-[80px]"
          style={{ background: `radial-gradient(ellipse 50% 50% at 90% 30%, ${BRAND.primary}, transparent 70%)` }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <span className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40 mb-4 sm:mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]/80" />
          How Gasless Works
        </span>
        <h2 className="text-[28px] sm:text-5xl lg:text-[3.5rem] font-display font-bold text-white tracking-[-0.03em] leading-[1.1] text-balance mb-3 sm:mb-4">
          $0 network fees. Just sign the trade.
        </h2>
          <p className="text-sm sm:text-base lg:text-lg text-white/45 max-w-2xl mb-8 sm:mb-12">
            Trades on Neptune settle on Solana with zero network + priority fees on your side. You don’t need SOL for gas; you just sign. Protocol trading fees and spreads still apply.
          </p>

        {/* Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6 sm:mb-12 lg:mb-16">
          {STEPS.map((step, i) => (
            <div
              key={step.label}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5 flex flex-col"
            >
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-1.5 sm:mb-2">Step {i + 1}</span>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-1">{step.label}</h3>
              <p className="text-[13px] sm:text-sm text-white/45">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Savings slider */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-6 lg:p-8">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Estimate your savings</h3>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-3 sm:mb-4">
            <div>
              <label className="block text-[10px] sm:text-[11px] text-white/50 uppercase tracking-wider mb-2">Trades per day</label>
              <input
                type="range"
                min={1}
                max={50}
                value={tradesPerDay}
                onChange={(e) => setTradesPerDay(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none bg-white/10 accent-[#00E5FF]"
              />
              <span className="text-[13px] sm:text-sm font-mono text-white/70 mt-1 block">{tradesPerDay}</span>
            </div>
            <div>
              <label className="block text-[10px] sm:text-[11px] text-white/50 uppercase tracking-wider mb-2">Days per month</label>
              <input
                type="range"
                min={1}
                max={30}
                value={daysPerMonth}
                onChange={(e) => setDaysPerMonth(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none bg-white/10 accent-[#00E5FF]"
              />
              <span className="text-[13px] sm:text-sm font-mono text-white/70 mt-1 block">{daysPerMonth}</span>
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-display font-bold text-[#00E5FF]">
            You save ~{savedSol} SOL/month in network + priority fees
          </p>
          <p className="text-[10px] sm:text-[11px] text-white/40 mt-1.5 sm:mt-2">
            * Varies with priority fees and network conditions. For illustration only.
          </p>
        </div>
      </div>
    </section>
  );
}
