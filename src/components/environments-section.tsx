"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const ACCENT = "#00E5FF";

const pillBase =
  "inline-flex items-center justify-center text-center py-2.5 px-4 sm:px-5 rounded-full text-sm font-medium whitespace-nowrap transition-colors w-full sm:w-auto sm:min-w-[8rem] sm:max-w-[11rem]";

function FlowItem({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "accent";
}) {
  if (variant === "accent") {
    return (
      <div className={`${pillBase} text-[#0A0A0A]`} style={{ backgroundColor: ACCENT }}>
        {children}
      </div>
    );
  }
  return (
    <div
      className={`${pillBase} bg-[#0A0A0A] border text-white/90`}
      style={{ borderColor: `${ACCENT}40` }}
    >
      {children}
    </div>
  );
}

const BEAM_DURATION_MS = 1800;

function AnimatedBeamLine({ delayMs = 0 }: { delayMs?: number }) {
  return (
    <div
      className="relative flex-1 min-w-[2rem] h-[3px] self-center rounded-full overflow-hidden -mx-4 lg:-mx-6"
      style={{ backgroundColor: `${ACCENT}25` }}
      aria-hidden
    >
      {/* Animated beam: travels from left pill to right pill along the track */}
      <div
        className="absolute left-0 top-0 h-full w-[26%] rounded-full animate-beam-left-to-right"
        style={{
          backgroundColor: ACCENT,
          boxShadow: `0 0 6px ${ACCENT}90`,
          animationDelay: delayMs ? `${delayMs}ms` : undefined,
        }}
      />
    </div>
  );
}

export function EnvironmentsSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-10 py-8 sm:py-12 lg:py-16 border-t border-white/5 overflow-x-hidden">
      <div className="max-w-5xl mx-auto w-full">
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-tight">
            Environments
          </h2>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-white/40 tracking-tight">
            Two modes. One standard.
          </h2>
        </div>

        <p className="text-white/50 text-sm sm:text-base lg:text-lg max-w-2xl mb-6 sm:mb-8">
          Production-ready trading and a builder sandbox. Same protocol, same proof system.
        </p>

        {/* Mobile: Vertical stack layout */}
        <div className="lg:hidden space-y-6">
          <div className="space-y-3">
            <FlowItem variant="accent">Mainnet</FlowItem>
            <div className="flex items-center gap-3 pl-4">
              <div className="w-6 h-px" style={{ backgroundColor: `${ACCENT}40` }} />
              <span className="text-xs text-white/40">→</span>
            </div>
            <FlowItem>Trade</FlowItem>
            <div className="flex items-center gap-3 pl-4">
              <div className="w-6 h-px" style={{ backgroundColor: `${ACCENT}40` }} />
              <span className="text-xs text-white/40">→</span>
            </div>
            <FlowItem>Gasless</FlowItem>
            <div className="flex items-center gap-3 pl-4">
              <div className="w-6 h-px" style={{ backgroundColor: `${ACCENT}40` }} />
              <span className="text-xs text-white/40">→</span>
            </div>
            <FlowItem>Proof Page</FlowItem>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/10">
            <FlowItem>Devnet</FlowItem>
            <div className="flex items-center gap-3 pl-4">
              <div className="w-6 h-px" style={{ backgroundColor: `${ACCENT}40` }} />
              <span className="text-xs text-white/40">→</span>
            </div>
            <FlowItem variant="accent">Launch</FlowItem>
            <div className="flex items-center gap-3 pl-4">
              <div className="w-6 h-px" style={{ backgroundColor: `${ACCENT}40` }} />
              <span className="text-xs text-white/40">→</span>
            </div>
            <FlowItem>Mint</FlowItem>
            <div className="flex items-center gap-3 pl-4">
              <div className="w-6 h-px" style={{ backgroundColor: `${ACCENT}40` }} />
              <span className="text-xs text-white/40">→</span>
            </div>
            <FlowItem>Test</FlowItem>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/10">
            <FlowItem>Same protocol</FlowItem>
            <div className="flex items-center gap-3 pl-4">
              <div className="w-6 h-px" style={{ backgroundColor: `${ACCENT}40` }} />
              <span className="text-xs text-white/40">→</span>
            </div>
            <FlowItem variant="accent">Same proof</FlowItem>
            <div className="flex items-center gap-3 pl-4">
              <div className="w-6 h-px" style={{ backgroundColor: `${ACCENT}40` }} />
              <span className="text-xs text-white/40">→</span>
            </div>
            <FlowItem>Percolator</FlowItem>
          </div>
        </div>

        {/* Desktop: Horizontal flow diagram — 4 columns: 4, 4, 2, 1 pills with connectors between */}
        <div className="hidden lg:block relative overflow-x-auto pb-4 flex justify-center">
          <div className="flex items-stretch gap-8 lg:gap-12 min-w-0">
            {/* Column 1 — 4 pills */}
            <div className="flex flex-col gap-2 lg:gap-3">
              <FlowItem variant="accent">Mainnet</FlowItem>
              <FlowItem>Trade</FlowItem>
              <FlowItem>Gasless</FlowItem>
              <FlowItem>Proof Page</FlowItem>
            </div>

            <div className="flex flex-col gap-2 lg:gap-3">
              <div className="flex items-center min-h-[2.5rem]"><AnimatedBeamLine /></div>
              <div className="flex items-center min-h-[2.5rem]"><AnimatedBeamLine delayMs={BEAM_DURATION_MS} /></div>
              <div className="flex items-center min-h-[2.5rem]"><AnimatedBeamLine /></div>
              <div className="flex items-center min-h-[2.5rem]"><AnimatedBeamLine delayMs={BEAM_DURATION_MS} /></div>
            </div>

            {/* Column 2 — 4 pills */}
            <div className="flex flex-col gap-2 lg:gap-3">
              <FlowItem>Devnet</FlowItem>
              <FlowItem variant="accent">Launch</FlowItem>
              <FlowItem>Mint</FlowItem>
              <FlowItem>Test</FlowItem>
            </div>

            <div className="flex flex-col gap-2 lg:gap-3">
              <div className="flex items-center min-h-[2.5rem]"><AnimatedBeamLine /></div>
              <div className="flex items-center min-h-[2.5rem]"><AnimatedBeamLine delayMs={BEAM_DURATION_MS} /></div>
              <div className="flex items-center min-h-[2.5rem]"><AnimatedBeamLine /></div>
              <div className="flex items-center min-h-[2.5rem]"><AnimatedBeamLine delayMs={BEAM_DURATION_MS} /></div>
            </div>

            {/* Column 3 — 2 pills */}
            <div className="flex flex-col gap-2 lg:gap-3">
              <FlowItem>Same protocol</FlowItem>
              <FlowItem variant="accent">Same proof</FlowItem>
              <div className={pillBase} style={{ visibility: "hidden" }} aria-hidden>&nbsp;</div>
              <div className={pillBase} style={{ visibility: "hidden" }} aria-hidden>&nbsp;</div>
            </div>

            <div className="flex flex-col gap-2 lg:gap-3">
              <div className="flex items-center min-h-[2.5rem]"><AnimatedBeamLine /></div>
              <div className="flex items-center min-h-[2.5rem]"><AnimatedBeamLine delayMs={BEAM_DURATION_MS} /></div>
              <div className="flex items-center min-h-[2.5rem]"><AnimatedBeamLine /></div>
              <div className="flex items-center min-h-[2.5rem]"><AnimatedBeamLine delayMs={BEAM_DURATION_MS} /></div>
            </div>

            {/* Column 4 — Percolator in a double-height cell so both Same protocol & Same proof beams connect to its center */}
            <div className="flex flex-col gap-2 lg:gap-3">
              <div className="min-h-[5.5rem] flex items-center justify-center shrink-0">
                <FlowItem>Percolator</FlowItem>
              </div>
              <div className={pillBase} style={{ visibility: "hidden" }} aria-hidden>&nbsp;</div>
              <div className={pillBase} style={{ visibility: "hidden" }} aria-hidden>&nbsp;</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-6">
          <Link
            href="/app/mainnet"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[#0A0A0A] font-medium text-sm transition-all hover:opacity-95"
            style={{
              backgroundColor: ACCENT,
              boxShadow: `0 0 20px ${ACCENT}40`,
            }}
          >
            Open Terminal
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/app/devnet"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border font-medium text-sm text-white/90 hover:bg-white/5 hover:text-white transition-colors"
            style={{ borderColor: `${ACCENT}50` }}
          >
            Explore Devnet
          </Link>
        </div>
      </div>
    </section>
  );
}
