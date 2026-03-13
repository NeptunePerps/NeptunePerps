"use client";

import Link from "next/link";
import { Menu, X, ChevronDown, ArrowUpRight } from "lucide-react";
import { NeptuneLogo } from "./neptune-logo";
import { BRAND } from "@/lib/brand";
import { useState } from "react";

const TOKEN_CA = process.env.NEXT_PUBLIC_TOKEN_ADDRESS ?? "";

function truncateCa(addr: string, start = 4, end = 4) {
  if (addr.length <= start + end) return addr;
  return `${addr.slice(0, start)}…${addr.slice(-end)}`;
}

function CAWithCopy() {
  const [copied, setCopied] = useState(false);
  if (!TOKEN_CA || TOKEN_CA.length < 8) return null;

  const copy = () => {
    navigator.clipboard.writeText(TOKEN_CA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="hidden sm:flex items-center gap-2 rounded-full pl-3 pr-1.5 py-1.5 bg-[#0f0f0f] border border-[#2a2a2a]">
      <span className="text-[11px] font-medium text-[#E5E5E5]/70">CA:</span>
      <span className="text-[11px] font-mono text-[#E5E5E5]/90 tabular-nums" title={TOKEN_CA}>
        {truncateCa(TOKEN_CA)}
      </span>
      <button
        type="button"
        onClick={copy}
        className="p-1.5 rounded-md hover:bg-white/10 text-[#E5E5E5]/60 hover:text-[#00E5FF] transition-colors"
        title="Copy contract address"
        aria-label="Copy CA"
      >
        {copied ? (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h2m0 0v2m0 8v2m0-8a2 2 0 012-2h2m0 0a2 2 0 012 2v8a2 2 0 01-2 2h-2m0-8V6" />
          </svg>
        )}
      </button>
    </div>
  );
}

const TRADE_ITEMS = [
  { href: "/app/mainnet", title: "Trading Terminal", desc: "Real perps, real liquidity" },
  { href: "/app/devnet", title: "Devnet Lab", desc: "Launch, mint, test" },
];

const BUILD_ITEMS = [
  { href: "/app/devnet/launch", title: "Launch Market", desc: "Deploy a perp market" },
  { href: "/app/devnet/mint", title: "Token Factory", desc: "Mint SPL tokens" },
];

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [buildOpen, setBuildOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-[60] pt-3 sm:pt-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 space-y-2">
        <div className="flex h-11 sm:h-12 lg:h-14 items-center justify-between gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-white/10 bg-[#0A0A0A]/95 backdrop-blur-md px-4 sm:px-5 lg:px-6">
          {/* Left: logo + nav */}
          <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6 lg:gap-8">
            <Link href="/" className="shrink-0" aria-label="Neptune home">
              <NeptuneLogo size="lg" className="h-5 sm:h-6 w-auto lg:h-7" />
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              <div
                className="relative"
                onMouseEnter={() => setTradeOpen(true)}
                onMouseLeave={() => setTradeOpen(false)}
              >
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-medium text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Trade
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${tradeOpen ? "rotate-180" : ""}`} />
                </button>
                {tradeOpen && (
                  <div className="absolute left-0 top-full pt-1">
                    <div className="w-56 rounded-xl border border-white/10 bg-[#0A0A0A] p-1.5 shadow-xl">
                      {TRADE_ITEMS.map(({ href, title, desc }) => (
                        <Link
                          key={href}
                          href={href}
                          className="group flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-white/5 transition-colors"
                          onClick={() => setTradeOpen(false)}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-white">{title}</span>
                            <span className="block text-xs text-white/50">{desc}</span>
                          </div>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-white/40 group-hover:text-[#00E5FF] transition-colors" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div
                className="relative"
                onMouseEnter={() => setBuildOpen(true)}
                onMouseLeave={() => setBuildOpen(false)}
              >
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-medium text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Build
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${buildOpen ? "rotate-180" : ""}`} />
                </button>
                {buildOpen && (
                  <div className="absolute left-0 top-full pt-1">
                    <div className="w-56 rounded-xl border border-white/10 bg-[#0A0A0A] p-1.5 shadow-xl">
                      {BUILD_ITEMS.map(({ href, title, desc }) => (
                        <Link
                          key={href}
                          href={href}
                          className="group flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-white/5 transition-colors"
                          onClick={() => setBuildOpen(false)}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-white">{title}</span>
                            <span className="block text-xs text-white/50">{desc}</span>
                          </div>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-white/40 group-hover:text-[#00E5FF] transition-colors" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <CAWithCopy />
            </nav>
          </div>

          {/* Right: socials + CTA */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
            <a
              href={BRAND.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="X / Twitter"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href={BRAND.github}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="GitHub"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            </a>
            <Link
              href="/app"
              className="inline-flex items-center justify-center rounded-lg border border-[#00E5FF]/30 bg-[#00E5FF] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-[13px] font-medium text-[#031014] hover:bg-[#5CF0FF] transition-colors shadow-[0_0_24px_rgba(0,229,255,0.18)]"
            >
              Open App
            </Link>
            <button
              type="button"
              className="lg:hidden flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/5 hover:text-white transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden rounded-xl border border-white/10 bg-[#0A0A0A]/95 backdrop-blur-md">
            <div className="px-4 sm:px-6 py-3 sm:py-4 space-y-2.5 sm:space-y-3">
            {TOKEN_CA.length >= 8 && (
              <div className="flex items-center justify-between rounded-lg px-3 py-2 bg-white/5 border border-white/10">
                <span className="text-xs text-white/50">CA:</span>
                <span className="text-xs font-mono text-white/90">{truncateCa(TOKEN_CA)}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(TOKEN_CA)}
                  className="p-1.5 rounded-md hover:bg-white/10 text-white/50 hover:text-[#00E5FF] transition-colors"
                  aria-label="Copy CA"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h2m0 0v2m0 8v2m0-8a2 2 0 012-2h2m0 0a2 2 0 012 2v8a2 2 0 01-2 2h-2m0-8V6" />
                  </svg>
                </button>
              </div>
            )}
            {[...TRADE_ITEMS, ...BUILD_ITEMS].map(({ href, title, desc }) => (
              <Link
                key={href}
                href={href}
                className="block rounded-lg px-3 py-2 hover:bg-white/5 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <span className="block text-[13px] sm:text-sm font-medium text-white">{title}</span>
                <span className="block text-xs text-white/50">{desc}</span>
              </Link>
            ))}
            <Link
              href="/app"
              className="flex h-10 sm:h-11 items-center justify-center rounded-lg border border-[#00E5FF]/30 bg-[#00E5FF] text-xs sm:text-[13px] font-semibold text-[#031014] hover:bg-[#5CF0FF] transition-colors shadow-[0_0_24px_rgba(0,229,255,0.18)]"
              onClick={() => setMobileOpen(false)}
            >
              Open App
            </Link>
          </div>
        </div>
        )}
      </div>
    </header>
  );
}
