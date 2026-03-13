"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const ACCENT = "#00E5FF";

export function DeveloperPreviewSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-10 py-5 sm:py-8 lg:py-12 border-t border-white/5 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Steps + right description */}
        <div className="grid lg:grid-cols-[1fr,400px] gap-3 sm:gap-6 lg:gap-8 mb-3 sm:mb-6 lg:mb-8">
          {/* Left: Steps with code */}
          <div className="space-y-3 sm:space-y-6 lg:space-y-8">
            {/* Step 01 */}
            <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-3 lg:gap-4">
              <div className="text-white/30 text-xs sm:text-sm font-mono pt-1">01</div>
              <div className="flex-1 min-w-0">
                <p className="text-white/70 text-xs sm:text-sm mb-2 sm:mb-3">
                  Send API call and receive connection string in{" "}
                  <span style={{ color: ACCENT }}>120ms</span>
                </p>
                <div className="relative rounded-lg overflow-x-auto">
                  <div
                    className="absolute inset-0 animate-pulse opacity-80"
                    style={{
                      background: `linear-gradient(to right, ${ACCENT}20, ${ACCENT}40, ${ACCENT}20)`,
                    }}
                  />
                  <div className="relative bg-[#0A0A0A] m-[1px] rounded-lg p-2 sm:p-3">
                    <div className="flex items-center gap-2 font-mono text-[10px] sm:text-xs md:text-sm min-w-0">
                      <span style={{ color: ACCENT }} className="shrink-0">●</span>
                      <span className="text-white/80 break-all">
                        neptune://market@7xKq-9mPd.solana.neptune-perps.trade/primary
                      </span>
                    </div>
                  </div>
                  <div
                    className="absolute top-0 right-0 w-8 h-full to-transparent pointer-events-none"
                    style={{ background: `linear-gradient(to left, ${ACCENT}30, transparent)` }}
                  />
                </div>
              </div>
            </div>

            {/* Step 02 */}
            <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-3 lg:gap-4">
              <div className="text-white/30 text-xs sm:text-sm font-mono pt-1">02</div>
              <div className="flex-1 min-w-0">
                <p className="text-white/70 text-xs sm:text-sm mb-2 sm:mb-3">
                  Test and deploy <span className="text-white/40">{">>"}</span>
                </p>
                <div className="bg-[#111] border border-white/10 rounded-lg overflow-hidden">
                  <div className="p-2 sm:p-3 font-mono text-[10px] sm:text-xs md:text-sm space-y-1 overflow-x-auto">
                    <div>
                      <span className="text-purple-400">CREATE</span>{" "}
                      <span className="text-white/60">MARKET IF NOT EXISTS</span>{" "}
                      <span style={{ color: ACCENT }}>sol_perp</span>
                      <span className="text-white/40">(</span>
                    </div>
                    <div className="pl-2 sm:pl-4 break-words">
                      <span className="text-white/60">id</span>{" "}
                      <span className="text-orange-400">SERIAL PRIMARY KEY</span>
                      <span className="text-white/40">,</span>{" "}
                      <span className="text-white/60">pair</span>{" "}
                      <span className="text-orange-400">TEXT NOT NULL</span>
                      <span className="text-white/40">,</span>{" "}
                      <span className="text-white/60">leverage</span>{" "}
                      <span className="text-orange-400">REAL</span>
                    </div>
                    <div>
                      <span className="text-white/40">);</span>
                    </div>
                    <div>
                      <span className="text-purple-400">INSERT INTO</span>{" "}
                      <span style={{ color: ACCENT }}>sol_perp</span>
                      <span className="text-white/40">(</span>
                      <span style={{ color: ACCENT }}>pair, leverage</span>
                      <span className="text-white/40">)</span>
                    </div>
                    <div className="break-words">
                      <span className="text-purple-400">SELECT</span>{" "}
                      <span className="text-white/60">LEFT</span>
                      <span className="text-white/40">(</span>
                      <span className="text-white/60">md5</span>
                      <span className="text-white/40">(</span>
                      <span className="text-white/60">i::TEXT</span>
                      <span className="text-white/40">),</span>
                      <span className="text-white/60">10</span>
                      <span className="text-white/40">),</span>
                      <span className="text-white/60">random</span>
                      <span className="text-white/40">()</span>{" "}
                      <span className="text-purple-400">FROM</span>{" "}
                      <span style={{ color: ACCENT }}>generate_series</span>
                      <span className="text-white/40">(</span>
                      <span className="text-white/60">1,10</span>
                      <span className="text-white/40">)</span>
                      <span className="text-white/60">s</span>
                      <span className="text-white/40">(</span>
                      <span className="text-white/60">i</span>
                      <span className="text-white/40">);</span>
                    </div>
                    <div>
                      <span className="text-purple-400">SELECT</span>{" "}
                      <span className="text-white/60">*</span>{" "}
                      <span className="text-purple-400">FROM</span>{" "}
                      <span style={{ color: ACCENT }}>sol_perp</span>
                      <span className="text-white/40">;</span>
                    </div>
                  </div>
                  <div className="border-t border-white/10 px-2 sm:px-3 py-1.5 sm:py-2">
                    <button
                      type="button"
                      className="flex items-center gap-2 text-white/70 text-xs sm:text-sm hover:text-white transition-colors"
                    >
                      <span style={{ color: ACCENT }}>▶</span> Run Query
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Description */}
          <div className="lg:pt-4 mt-3 sm:mt-0">
            <h3 className="text-[15px] sm:text-xl md:text-2xl lg:text-3xl font-medium text-white mb-2 sm:mb-3 leading-snug">
              Manage your fleet via API.{" "}
              <span className="text-white/40">
                Neptune Percolator markets spin up in milliseconds, with APIs for quota controls and
                fleet scaling.
              </span>
            </h3>
            <Link
              href="/app/devnet/launch"
              className="inline-flex items-center gap-2 rounded-full border border-[#00E5FF]/25 bg-[#00E5FF]/[0.06] px-3.5 py-2 text-[#8EF7FF] hover:text-[#C7FCFF] hover:border-[#00E5FF]/40 transition-colors text-xs sm:text-sm mt-2 sm:mt-3"
            >
              Learn more <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Link>
          </div>
        </div>

        {/* Market checkpoints copy */}
        <div className="mb-3 sm:mb-6 lg:mb-8">
          <h3 className="text-[15px] sm:text-lg md:text-2xl lg:text-3xl font-medium text-white mb-2 text-center max-w-4xl mx-auto px-4 sm:px-0">
            Market checkpoints.{" "}
            <span className="text-white/40">
              Copy-on-write storage makes it cheap and fast to save point-in-time versions of your
              market and restore a previous state when necessary.
            </span>
          </h3>
        </div>

        {/* Timeline visualization — full version (reference) */}
        <div className="relative overflow-x-auto pb-2 sm:pb-4 -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="min-w-[280px] sm:min-w-[600px] lg:min-w-[900px]">
            {/* Grid background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-l border-white/10"
                  style={{ left: `${i * 5}%` }}
                />
              ))}
            </div>

            {/* Main timeline line — horizontal teal line, positioned lower; circles sit on this */}
            <div className="relative h-[90px] sm:h-[180px] lg:h-[200px]">
              {/* Horizontal timeline — 65% from top = lower position */}
              <div
                className="absolute left-0 right-0 h-px"
                style={{ top: "65%", backgroundColor: ACCENT }}
              />

              {/* Restore version tooltip — dashed orange curve from button to checkpoint */}
              <div className="absolute left-[35%] top-[20px] sm:top-[30px] -translate-x-1/2">
                <div className="relative">
                  <div className="bg-[#0A0A0A] border-2 border-amber-400/90 rounded-full px-2.5 py-1.5 sm:px-4 sm:py-2 text-amber-400/95 text-[10px] sm:text-xs font-mono whitespace-nowrap">
                    restore previous version
                  </div>
                  <div className="absolute left-1/2 top-full w-px h-6 sm:h-[40px] bg-amber-400/50" />
                  <svg
                    className="absolute left-1/2 top-6 sm:top-[40px] w-[120px] h-[30px] sm:w-[200px] sm:h-[50px] -translate-x-[20%]"
                    viewBox="0 0 200 50"
                  >
                    <path
                      d="M 0 0 Q 0 30, 50 40 L 180 40"
                      stroke="rgb(251 191 36 / 0.9)"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray="4 4"
                    />
                  </svg>
                </div>
              </div>

              {/* Timeline checkpoints — circle ON line, vertical line up, time below */}
              {[
                { left: "2%", leftSm: "5%", time: "12:00", label: "devnet", labelShort: "dev", variant: "default" as const },
                { left: "16%", leftSm: "20%", time: "12:24", label: "first-market", labelShort: "first", variant: "default" as const },
                { left: "30%", leftSm: "35%", time: "13:48", label: "checkpoint", labelShort: "check", variant: "checkpoint" as const },
                { left: "44%", leftSm: "50%", time: "14:15", label: "add-alerts", labelShort: "alerts", variant: "default" as const },
                { left: "58%", leftSm: "65%", time: "16:42", label: "test-predeploy", labelShort: "test", variant: "default" as const },
                { left: "72%", leftSm: "80%", time: "17:18", label: "query-error", labelShort: "error", variant: "error" as const },
                { left: "86%", leftSm: "95%", time: "17:20", label: "rollback", labelShort: "roll", variant: "default" as const },
              ].map(({ left, leftSm, time, label, labelShort, variant }) => (
                <div
                  key={label}
                  className="absolute top-0 bottom-0 -translate-x-1/2 w-px flex flex-col items-center"
                  style={{ left: `clamp(${left}, ${leftSm}, ${leftSm})` }}
                >
                  {/* Vertical line — from top down to circle (on timeline at 65%) */}
                  <div
                    className="w-px shrink-0"
                    style={{
                      height: "65%",
                      backgroundColor:
                        variant === "checkpoint" ? `${ACCENT}80`
                        : variant === "error" ? "rgba(248,113,113,0.6)"
                        : "rgba(255,255,255,0.2)",
                    }}
                  />
                  {/* Circle — sits ON the horizontal timeline */}
                  <div
                    className="w-2 h-2 rounded-full shrink-0 ring-2 ring-[#0A0A0A]"
                    style={{
                      backgroundColor: variant === "checkpoint" ? ACCENT : variant === "error" ? "rgb(248,113,113)" : "rgba(255,255,255,0.5)",
                    }}
                  />
                  {/* Time + label — below the line */}
                  <div className="flex flex-col items-center pt-1 sm:pt-1.5 shrink-0">
                    <span className="text-white/30 text-[8px] sm:text-xs font-mono leading-none whitespace-nowrap">{time}</span>
                    <span
                      className={`text-[8px] sm:text-xs leading-none whitespace-nowrap ${
                        variant === "checkpoint"
                          ? "text-white font-medium"
                          : variant === "error"
                            ? "text-red-400"
                            : "text-white/50"
                      }`}
                    >
                      <span className="sm:hidden">{labelShort}</span>
                      <span className="hidden sm:inline">{label}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom row — restored / follow-up (Neptune flow) */}
            <div className="relative h-[40px] sm:h-[80px] mt-2 sm:mt-8">
              <div className="absolute top-0 left-[33%] sm:left-[35%] right-[22%] sm:right-[20%] h-px bg-white/10" />
              <div className="absolute top-[12px] sm:top-[30px] left-[33%] sm:left-[35%] flex flex-col items-center">
                <span className="text-white/30 text-[8px] sm:text-xs font-mono leading-none">17:21</span>
                <span className="text-white/50 text-[8px] sm:text-xs leading-none">
                  <span className="sm:hidden">proof</span>
                  <span className="hidden sm:inline">proof-page</span>
                </span>
              </div>
              <div className="absolute top-[12px] sm:top-[30px] left-[58%] sm:left-[60%] flex flex-col items-center">
                <span className="text-white/30 text-[8px] sm:text-xs font-mono leading-none">18:42</span>
                <span className="text-white/50 text-[8px] sm:text-xs leading-none">
                  <span className="sm:hidden">verify</span>
                  <span className="hidden sm:inline">verify-receipt</span>
                </span>
              </div>
              <div className="absolute top-[12px] sm:top-[30px] left-[78%] sm:left-[80%] flex flex-col items-center">
                <span className="text-white/30 text-[8px] sm:text-xs font-mono leading-none">21:15</span>
                <span className="text-white/50 text-[8px] sm:text-xs leading-none">mainnet</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
