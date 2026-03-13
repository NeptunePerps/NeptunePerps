"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const HERO_IMAGE_SRC =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-03-08%20at%2015.00.05-67YXPmIvhSwd8VHHJsEMzBWWLtDkqV.png";

export function LandingHero() {
  return (
    <section className="px-4 sm:px-6 lg:px-10 pt-20 sm:pt-28 lg:pt-32 pb-4 sm:pb-8 bg-[#0A0A0A] overflow-x-hidden" aria-label="Hero">
      <div className="max-w-7xl mx-auto min-w-0 text-center">
        {/* Hero text — gradient accent */}
        <div className="mb-6 sm:mb-10 lg:mb-12 pt-2 sm:pt-4 space-y-2 sm:space-y-3">
          <h1 className="text-[32px] leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-balance bg-gradient-to-r from-white via-[#C7FCFF] to-[#00E5FF] bg-clip-text text-transparent">
            Gasless Permissionless Perps
          </h1>
          <h2 className="text-[32px] leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-balance bg-gradient-to-r from-white via-[#C7FCFF] to-[#00E5FF] bg-clip-text text-transparent">
            Zero-deploy Percolator Markets
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-white/60 font-medium tracking-tight">
            PropAMM · Micro Order Book
          </p>
          <p className="text-sm sm:text-base text-white/40">
            Built with PropAMM + Micro Order Book
          </p>
        </div>

        <p className="text-sm sm:text-lg text-white/50 max-w-xl mx-auto mb-2 sm:mb-3">
          Trade perps with $0 network fees. Launch new Percolator markets with no deployment cost. Verify everything with Proof Pages.
        </p>
        <p className="text-[11px] sm:text-sm text-white/35 max-w-xl mx-auto mb-6 sm:mb-10">
          PropAMM + thin-market guardrails · Micro Order Books v0.1 · Receipts for every action.
        </p>

        {/* CTA — reference style */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8 sm:mb-14">
          <Link
            href="/app"
            className="inline-flex items-center justify-between border border-[#00E5FF]/30 bg-[#00E5FF] text-[#031014] px-3 sm:px-4 py-2 sm:py-2.5 rounded-3xl min-w-[140px] sm:min-w-[160px] hover:bg-[#5CF0FF] transition-colors group shadow-[0_0_20px_rgba(0,229,255,0.15)]"
          >
            <span className="font-medium text-[13px] sm:text-[14px]">Launch App</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-3xl border border-[#00E5FF]/25 bg-[#00E5FF]/[0.06] text-[#8EF7FF] hover:text-[#C7FCFF] hover:border-[#00E5FF]/40 text-[13px] sm:text-[14px] font-medium transition-colors"
          >
            How it works
          </a>
        </div>

        {/* Pills — feature options */}
        <ul className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-2 sm:gap-4 mb-8 sm:mb-14 max-w-md sm:max-w-2xl mx-auto">
          {[
            "Gasless mainnet trading",
            "Zero-deploy perp markets",
            "PropAMM risk engine",
            "Micro Order Books + Proof",
          ].map((label) => (
            <li key={label} className="min-w-0">
              <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-sm text-white/70 bg-white/[0.06] border border-white/10 w-full sm:w-auto">
                <span className="size-1 sm:size-1.5 rounded-full bg-[#00E5FF] shrink-0" aria-hidden />
                <span className="truncate">{label}</span>
              </span>
            </li>
          ))}
        </ul>

        {/* App screenshot with macOS-style mockup — like reference */}
        <div className="relative w-full rounded-xl overflow-hidden">
          <div className="relative bg-gradient-to-b from-[#6B8DD6] via-[#8E7AB5] to-[#2D1B3D]">
            {/* macOS-style menu bar */}
            <div className="flex items-center justify-between px-2 sm:px-4 py-1.5 bg-black/30 backdrop-blur-sm text-white/90 text-[9px] sm:text-[11px]">
              <div className="flex items-center gap-2 sm:gap-5 min-w-0">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <span className="font-medium shrink-0">Neptune</span>
                <span className="hidden sm:inline">File</span>
                <span className="hidden sm:inline">Edit</span>
                <span className="hidden md:inline">View</span>
                <span className="hidden md:inline">Window</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span className="truncate">Solana · Percolator</span>
              </div>
            </div>

            {/* Screenshot */}
            <div className="relative min-h-[260px] sm:min-h-[400px] md:min-h-[500px] flex items-center justify-center p-3 sm:p-6 md:p-8">
              <div className="relative w-full max-w-5xl rounded-lg overflow-hidden shadow-2xl border border-white/10">
                <Image
                  src={HERO_IMAGE_SRC}
                  alt="Neptune Trading Platform - SOL perpetual trading interface"
                  width={1920}
                  height={1080}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats row — our content */}
        <div className="flex flex-wrap items-stretch justify-center gap-px mt-6 sm:mt-10 max-w-xl mx-auto">
          {[
            { value: "$0", label: "Network fees" },
            { value: "Free", label: "Devnet launch" },
            { value: "PropAMM", label: "Guardrails" },
            { value: "Proof Pages", label: "Receipts" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="flex-1 min-w-0 sm:min-w-[80px] relative px-2 sm:px-3 py-2 sm:py-2.5"
            >
              {i > 0 && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-px bg-white/[0.08]" />
              )}
              <span className="block text-sm sm:text-base md:text-lg font-display font-bold tracking-tight text-white">
                {stat.value}
              </span>
              <span className="block text-[8px] sm:text-[9px] text-white/35 mt-0.5 uppercase tracking-[0.1em] font-medium">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
