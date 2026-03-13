"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function MicroOrderBooksSection() {
  return (
    <section className="relative py-8 sm:py-16 lg:py-24 xl:py-32 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute bottom-1/4 left-0 w-[50%] max-w-[400px] h-[50%] rounded-full opacity-[0.06] blur-[80px]"
          style={{ background: "radial-gradient(ellipse 50% 50% at 10% 80%, #2E5BFF, transparent 70%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40 mb-3 sm:mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2E5BFF]/80" />
              New
            </span>
            <h2 className="text-[28px] sm:text-4xl md:text-5xl font-display font-bold text-white tracking-[-0.03em] leading-[1.1] text-balance mb-2.5 sm:mb-4">
              Micro Order Books <span className="text-[#00E5FF]">v0.1</span>
            </h2>
            <p className="text-[13px] sm:text-base text-white/45 leading-relaxed mb-3.5 sm:mb-6">
              Sovereign maker books with parametric quoting and pro-rata execution. Less contention, no queue wars — depth over speed. Preview in the Launch Wizard today; full execution coming soon.
            </p>
            <ul className="space-y-1.5 sm:space-y-2 text-[13px] sm:text-sm text-white/45 mb-5 sm:mb-8">
              <li className="flex items-center gap-2"><span className="text-[#00E5FF]">·</span> Sovereign maker books (reduce contention)</li>
              <li className="flex items-center gap-2"><span className="text-[#00E5FF]">·</span> Parametric quoting (cheap updates)</li>
              <li className="flex items-center gap-2"><span className="text-[#00E5FF]">·</span> Pro-rata execution (depth &gt; speed)</li>
            </ul>
            <Link
              href="/app/devnet/launch"
              className="inline-flex items-center gap-2 px-4 sm:px-6 h-10 sm:h-11 rounded-full border border-[#00E5FF]/30 bg-[#00E5FF] text-[#031014] hover:bg-[#5CF0FF] text-[13px] sm:text-sm font-semibold transition-all w-fit shadow-[0_0_24px_rgba(0,229,255,0.16)]"
            >
              Try in Launch Wizard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-6 lg:p-8 lg:min-w-[320px]">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20">
                Preview
              </span>
            </div>
            <p className="text-[13px] sm:text-sm text-white/50">
              Micro Order Book is selectable in the matcher step. Configuration is saved; execution uses PropAMM until v0.1 is fully live. We’ll ship execution as it’s ready.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
