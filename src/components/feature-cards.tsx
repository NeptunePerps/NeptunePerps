"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function TradingTerminal() {
  return (
    <div className="relative w-full h-full min-h-[360px] lg:min-h-[440px] bg-[#080a0d] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#00E5FF]/[0.04] via-transparent to-transparent" />
      {/* Background-only fade: left/right edges darker; chart stays full, no overlay on content */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to right, rgba(0,0,0,0.35) 0%, transparent 22%), linear-gradient(to left, rgba(0,0,0,0.35) 0%, transparent 22%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 35%, rgba(0,0,0,0.12) 100%)",
        }}
      />
      <div className="absolute inset-0 flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-white/[0.06]" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/[0.06]" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/[0.06]" />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/[0.04]">
              {/* Solana logo (CoinGecko-style asset icon) */}
              <img
                src="https://assets.coingecko.com/coins/images/4128/small/solana.png"
                alt=""
                className="w-4 h-4 rounded-full shrink-0"
                width={16}
                height={16}
              />
              <span className="font-mono text-xs text-white/70 font-medium">SOL-PERP</span>
              <span className="font-mono text-xs text-[#00E5FF] font-semibold">$142.87</span>
              <span className="font-mono text-[10px] text-[#00E5FF]/70">+4.28%</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {["1H", "4H", "1D", "1W"].map((tf, i) => (
              <button
                key={tf}
                className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded ${
                  i === 2 ? "bg-white/[0.08] text-white/70" : "text-white/20 hover:text-white/40"
                } transition-colors`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 relative p-4">
          <svg className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)]" preserveAspectRatio="none">
            {[0.25, 0.5, 0.75].map((y) => (
              <line key={y} x1="0" y1={`${y * 100}%`} x2="100%" y2={`${y * 100}%`} stroke="rgba(255,255,255,0.025)" />
            ))}
            {[0.2, 0.4, 0.6, 0.8].map((x) => (
              <line key={x} x1={`${x * 100}%`} y1="0" x2={`${x * 100}%`} y2="100%" stroke="rgba(255,255,255,0.015)" />
            ))}
          </svg>
          <svg className="relative w-full h-full" viewBox="0 0 500 240" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.12" />
                <stop offset="60%" stopColor="#00E5FF" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.2" />
                <stop offset="30%" stopColor="#00E5FF" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#00E5FF" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path
              d="M0,180 C25,175 40,170 60,155 C80,140 95,148 120,130 C145,112 155,120 180,105 C205,90 215,95 240,80 C265,65 275,72 300,55 C325,38 340,48 365,35 C390,22 410,28 435,18 C460,8 480,15 500,12 L500,240 L0,240Z"
              fill="url(#chartArea)"
            />
            <path
              d="M0,180 C25,175 40,170 60,155 C80,140 95,148 120,130 C145,112 155,120 180,105 C205,90 215,95 240,80 C265,65 275,72 300,55 C325,38 340,48 365,35 C390,22 410,28 435,18 C460,8 480,15 500,12"
              fill="none"
              stroke="url(#chartLine)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="500" cy="12" r="3" fill="#00E5FF" />
            <circle cx="500" cy="12" r="8" fill="#00E5FF" opacity="0.25" />
            <line x1="300" y1="0" x2="300" y2="240" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <line x1="0" y1="55" x2="500" y2="55" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <circle cx="300" cy="55" r="4" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
          </svg>
          <div className="absolute top-[calc(23%-4px)] left-[60%] -translate-x-1/2 px-2.5 py-1 rounded-md bg-white/[0.06] backdrop-blur-sm border border-white/[0.08]">
            <span className="font-mono text-[10px] text-white/50">$148.32</span>
          </div>
        </div>
        <div className="px-5 py-3.5 border-t border-white/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="px-4 py-1.5 rounded-md bg-[#00E5FF]/10 border border-[#00E5FF]/20">
              <span className="text-[11px] font-semibold text-[#00E5FF]">Long</span>
            </div>
            <div className="px-4 py-1.5 rounded-md bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[11px] font-semibold text-white/30">Short</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="block text-[9px] text-white/20 uppercase tracking-wider">Size</span>
              <span className="font-mono text-xs text-white/50">1,000 USDC</span>
            </div>
            <div className="text-right">
              <span className="block text-[9px] text-white/20 uppercase tracking-wider">Leverage</span>
              <span className="font-mono text-xs text-white/50">10x</span>
            </div>
            <div className="px-4 py-1.5 rounded-md bg-[#00E5FF]/15 border border-[#00E5FF]/25">
              <span className="text-[11px] font-semibold text-[#00E5FF]">Place Order</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CARD_GRADIENTS = {
  trade:
    "radial-gradient(ellipse 90% 60% at 75% 5%, rgba(0,229,255,0.14) 0%, transparent 45%), radial-gradient(ellipse 70% 50% at 15% 85%, rgba(46,91,255,0.08) 0%, transparent 50%), radial-gradient(ellipse 50% 80% at 50% 50%, rgba(0,229,255,0.03) 0%, transparent 60%), radial-gradient(ellipse at 50% 50%, #080a0d 0%, #050608 100%)",
  build:
    "radial-gradient(ellipse 85% 55% at 85% 15%, rgba(0,229,255,0.12) 0%, transparent 45%), radial-gradient(ellipse 65% 55% at 15% 75%, rgba(46,91,255,0.06) 0%, transparent 50%), radial-gradient(ellipse 50% 70% at 50% 50%, rgba(0,229,255,0.02) 0%, transparent 55%), radial-gradient(ellipse at 50% 50%, #080a0d 0%, #050608 100%)",
  verify:
    "radial-gradient(ellipse 85% 55% at 25% 10%, rgba(46,91,255,0.12) 0%, transparent 45%), radial-gradient(ellipse 70% 50% at 85% 85%, rgba(0,229,255,0.08) 0%, transparent 50%), radial-gradient(ellipse 50% 80% at 50% 50%, rgba(0,229,255,0.03) 0%, transparent 60%), radial-gradient(ellipse at 50% 50%, #080a0d 0%, #050608 100%)",
};

const NOISE_STYLE = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
};

export function FeatureCards() {
  const headerReveal = useReveal(0.2);
  const row1 = useReveal(0.1);
  const row2 = useReveal(0.1);

  return (
    <section className="relative py-32 lg:py-40 overflow-hidden">
      {/* Web3-style background: gradient orbs + subtle grid */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] max-w-[900px] h-[80%] rounded-full opacity-[0.12] blur-[100px]"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, #00E5FF, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-[80%] max-w-[600px] h-[60%] rounded-full opacity-[0.08] blur-[80px]"
          style={{ background: "radial-gradient(ellipse 50% 60% at 20% 100%, #2E5BFF, transparent 70%)" }}
        />
        <div
          className="absolute top-1/3 right-0 w-[50%] max-w-[400px] h-[50%] rounded-full opacity-[0.06] blur-[90px]"
          style={{ background: "radial-gradient(ellipse 60% 50% at 100% 30%, #00E5FF, transparent 70%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative  mx-auto px-6 lg:px-10">
        <div
          ref={headerReveal.ref}
          className="max-w-3xl mb-20 lg:mb-28 opacity-0 translate-y-6"
          style={{
            transition: "opacity 0.9s ease, transform 0.9s ease",
            ...(headerReveal.visible ? { opacity: 1, transform: "translateY(0)" } : {}),
          }}
        >
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]/80 shadow-[0_0_10px_rgba(0,229,255,0.4)]" />
            Four pillars
          </span>
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]/80 shadow-[0_0_10px_rgba(0,229,255,0.4)]" />
            Four pillars
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-display font-bold text-white tracking-[-0.03em] leading-[1.1] text-balance">
            Gasless trading. Zero-deploy Percolator markets. PropAMM. Proof.
          </h2>
          <p className="mt-4 text-base lg:text-lg text-white/45 max-w-2xl">
            <span className="text-white/55 font-medium">PropAMM</span>
            {" "}keeps thin markets safer with inventory‑aware spreads and guardrails so venues don’t get drained.
            Micro Order Books v0.1 add fine‑grained maker control and depth, all wired into Neptune’s proof‑first tooling.
          </p>
        </div>

        <div
          ref={row1.ref}
          className="opacity-0 translate-y-8"
          style={{
            transition: "opacity 0.9s ease, transform 0.9s ease",
            ...(row1.visible ? { opacity: 1, transform: "translateY(0)" } : {}),
          }}
        >
          <div className="group relative rounded-2xl border border-white/[0.06] hover:border-white/[0.1] transition-all duration-500 overflow-hidden">
            {/* Card gradient background (How it works style) */}
            <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.02]" style={{ background: CARD_GRADIENTS.trade }} />
            <div className="absolute inset-0 opacity-[0.12]" style={NOISE_STYLE} />
            <div className="grid lg:grid-cols-[1fr,1.2fr]">
              <div className="relative p-8 lg:p-12 xl:p-14 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Pillar 1</span>
                </div>
                <h3 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-display font-bold text-white tracking-[-0.02em] leading-[1.15]">
                  Gasless perps
                  <br />
                  on mainnet.
                </h3>
                <p className="text-white/35 leading-relaxed mt-5 text-base lg:text-lg max-w-lg">
                  Trade with $0 network fees and real collateral settlement. Positions are fully on-chain with up to 50x leverage.
                </p>
                <p className="text-white/30 text-sm mt-3 max-w-lg">
                  You don’t need SOL for gas to place trades. Protocol fees and spreads still apply, and every action gets a receipt.
                </p>
                <div className="flex items-center gap-0 mt-10 mb-10">
                  {[
                    { value: "50x", label: "Max Leverage" },
                    { value: "400ms", label: "Settlement" },
                    { value: "No signup", label: "No KYC" },
                  ].map((stat, i) => (
                    <div key={stat.label} className="flex items-center">
                      {i > 0 && <div className="w-px h-8 bg-white/[0.06] mx-5 lg:mx-7" />}
                      <div>
                        <span className="block text-2xl lg:text-3xl font-display font-bold text-white tracking-tight">{stat.value}</span>
                        <span className="block text-[10px] uppercase tracking-[0.15em] text-white/30 mt-1 font-medium">{stat.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/app/mainnet"
                  className="inline-flex items-center gap-2.5 rounded-full text-sm font-semibold px-7 h-12 text-[#050507] transition-all hover:opacity-95 w-fit"
                  style={{
                    background: "linear-gradient(135deg, #ffffff 0%, #b2ebf2 25%, #00E5FF 55%, #2E5BFF 100%)",
                    boxShadow: "0 0 24px rgba(0, 229, 255, 0.3), 0 0 0 1px rgba(255,255,255,0.08) inset",
                  }}
                >
                  Start Trading
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="relative border-t lg:border-t-0 lg:border-l border-white/[0.04]">
                <TradingTerminal />
              </div>
            </div>
          </div>
        </div>

        <div
          ref={row2.ref}
          className="grid md:grid-cols-1 lg:grid-cols-3 gap-5 mt-5 opacity-0 translate-y-8"
          style={{
            transition: "opacity 0.9s ease, transform 0.9s ease",
            transitionDelay: "150ms",
            ...(row2.visible ? { opacity: 1, transform: "translateY(0)" } : {}),
          }}
        >
          <div className="group relative rounded-2xl border border-white/[0.06] hover:border-white/[0.1] transition-all duration-500 overflow-hidden flex flex-col">
            <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.02]" style={{ background: CARD_GRADIENTS.build }} />
            <div className="absolute inset-0 opacity-[0.12]" style={NOISE_STYLE} />
            <div className="relative p-8 lg:p-10 flex flex-col flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Pillar 2</span>
              </div>
              <h3 className="text-2xl lg:text-[1.75rem] font-display font-bold text-white tracking-[-0.02em] leading-[1.15]">
                Launch a Percolator perp
                <br />
                with zero deploy cost.
              </h3>
              <p className="text-white/35 leading-relaxed mt-4 text-sm max-w-md flex-1">
                In a vanilla Percolator setup, launching a new market locks roughly ~7 SOL of slab rent on-chain. On Neptune you launch Percolator perp markets with no deployment cost, one-click and atomic.
              </p>
              <p className="text-white/30 text-sm mt-2">Atomic deploy · no gatekeepers · clear limits to keep things safe.</p>
              <div className="flex items-center gap-0 mt-8 mb-8">
                {[
                  { value: "$0", label: "Cost to you" },
                  { value: "~60s", label: "Deploy" },
                  { value: "Any", label: "Pair" },
                ].map((stat, i) => (
                  <div key={stat.label} className="flex items-center">
                    {i > 0 && <div className="w-px h-7 bg-white/[0.06] mx-5" />}
                    <div>
                      <span className="block text-xl lg:text-2xl font-display font-bold text-white tracking-tight">{stat.value}</span>
                      <span className="block text-[10px] uppercase tracking-[0.12em] text-white/30 mt-1">{stat.label}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/app/devnet/launch"
                className="inline-flex items-center gap-2 px-6 h-11 rounded-full border border-white/[0.12] text-white/80 hover:text-white hover:border-white/[0.2] hover:bg-white/[0.04] text-sm font-semibold transition-all w-fit"
              >
                Create Market
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="group relative rounded-2xl border border-white/[0.06] hover:border-white/[0.1] transition-all duration-500 overflow-hidden flex flex-col">
            <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.02]" style={{ background: CARD_GRADIENTS.verify }} />
            <div className="absolute inset-0 opacity-[0.12]" style={NOISE_STYLE} />
            <div className="relative p-8 lg:p-10 flex flex-col flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2E5BFF]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Pillar 3 · PropAMM</span>
              </div>
              <h3 className="text-2xl lg:text-[1.75rem] font-display font-bold text-white tracking-[-0.02em] leading-[1.15]">
                PropAMM + Proof Pages.
                <br />
                Receipts for every action.
              </h3>
              <p className="text-white/35 leading-relaxed mt-4 text-sm max-w-md flex-1">
                Guard state, oracle health, crank freshness, spread breakdown — all visible. Every action gets a portable receipt (tx, CPI, program truth). Exportable as JSON.
              </p>
              <div className="flex items-center gap-0 mt-8 mb-8">
                {[
                  { value: "Every", label: "action" },
                  { value: "CPI", label: "traced" },
                  { value: "JSON", label: "export" },
                ].map((stat, i) => (
                  <div key={stat.label} className="flex items-center">
                    {i > 0 && <div className="w-px h-7 bg-white/[0.06] mx-5" />}
                    <div>
                      <span className="block text-xl lg:text-2xl font-display font-bold text-white tracking-tight">{stat.value}</span>
                      <span className="block text-[10px] uppercase tracking-[0.12em] text-white/30 mt-1">{stat.label}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/app/devnet"
                className="inline-flex items-center gap-2 px-6 h-11 rounded-full border border-white/[0.12] text-white/80 hover:text-white hover:border-white/[0.2] hover:bg-white/[0.04] text-sm font-semibold transition-all w-fit"
              >
                View Explorer
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="group relative rounded-2xl border border-white/[0.06] hover:border-white/[0.1] transition-all duration-500 overflow-hidden flex flex-col">
            <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.02]" style={{ background: CARD_GRADIENTS.verify }} />
            <div className="absolute inset-0 opacity-[0.12]" style={NOISE_STYLE} />
            <div className="relative p-8 lg:p-10 flex flex-col flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Pillar 4 · Micro Order Books</span>
              </div>
              <h3 className="text-2xl lg:text-[1.75rem] font-display font-bold text-white tracking-[-0.02em] leading-[1.15]">
                Micro Order Books v0.1.
                <br />
                Depth-first matching.
              </h3>
              <p className="text-white/35 leading-relaxed mt-4 text-sm max-w-md flex-1">
                Sovereign maker books with parametric quoting and pro‑rata execution. Less contention, no queue wars — depth over speed, wired directly into Neptune’s Percolator perps.
              </p>
              <div className="flex items-center gap-0 mt-8 mb-8">
                {[
                  { value: "Maker", label: "books" },
                  { value: "Parametric", label: "quotes" },
                  { value: "Pro‑rata", label: "fills" },
                ].map((stat, i) => (
                  <div key={stat.label} className="flex items-center">
                    {i > 0 && <div className="w-px h-7 bg-white/[0.06] mx-5" />}
                    <div>
                      <span className="block text-xl lg:text-2xl font-display font-bold text-white tracking-tight">{stat.value}</span>
                      <span className="block text-[10px] uppercase tracking-[0.12em] text-white/30 mt-1">{stat.label}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/app/devnet/launch"
                className="inline-flex items-center gap-2 px-6 h-11 rounded-full border border-white/[0.12] text-white/80 hover:text-white hover:border-white/[0.2] hover:bg-white/[0.04] text-sm font-semibold transition-all w-fit"
              >
                Configure in Launch Wizard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
