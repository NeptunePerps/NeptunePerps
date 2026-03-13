"use client";

import { useEffect, useState } from "react";

const ACCENT = "#00E5FF";
const GOLD = "#F5B942";

function NavItem({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={`flex items-center gap-2 text-sm transition-all duration-300 min-w-0 ${
        active ? "text-white font-medium" : "text-white/40 hover:text-white/65"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300 ${
          active ? "bg-[#00E5FF]" : "bg-transparent"
        }`}
      />
      <span className="truncate">{children}</span>
    </a>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4 sm:p-5">
      <div className="mb-3 sm:mb-4 text-[#00E5FF]">{icon}</div>
      <h4 className="text-white text-[15px] sm:text-base font-medium mb-1">{title}</h4>
      <p className="text-white/50 text-[13px] sm:text-sm leading-5 sm:leading-6">{description}</p>
    </div>
  );
}

function WalletIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

function OracleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    </svg>
  );
}

function MiniPill({
  children,
  accent = false,
  gold = false,
  dim = false,
  className = "",
}: {
  children: React.ReactNode;
  accent?: boolean;
  gold?: boolean;
  dim?: boolean;
  className?: string;
}) {
  let classes =
    "inline-flex items-center rounded-full border px-3 py-1 text-xs whitespace-nowrap";

  if (accent) {
    classes += " border-[#00E5FF]/30 bg-[#00E5FF]/10 text-[#00E5FF]";
  } else if (gold) {
    classes += " border-[#F5B942]/30 bg-[#F5B942]/10 text-[#F5B942]";
  } else if (dim) {
    classes += " border-white/10 bg-white/[0.02] text-white/40";
  } else {
    classes += " border-white/12 bg-white/[0.03] text-white/70";
  }

  return <span className={`${classes} ${className}`}>{children}</span>;
}

function SectionGraphicShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative mt-7 sm:mt-10 mb-7 sm:mb-10 rounded-[24px] sm:rounded-[28px] border border-white/8 bg-[#050608] overflow-x-auto overflow-y-hidden min-w-0 ${className}`}
    >
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(0,229,255,0.09),transparent_28%),radial-gradient(circle_at_85%_80%,rgba(245,185,66,0.06),transparent_24%)]" />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

/* ---------------- GRAPHICS ---------------- */

function PermissionlessGraphic() {
  const points = [
    { left: "5%", leftSm: "8%", time: "12:00", label: "devnet", labelShort: "dev", variant: "default" as const },
    { left: "20%", leftSm: "20%", time: "12:24", label: "first-market", labelShort: "first", variant: "default" as const },
    { left: "32%", leftSm: "32%", time: "13:15", label: "add-liquidity", labelShort: "add-liq", variant: "default" as const },
    { left: "43%", leftSm: "43%", time: "13:48", label: "checkpoint", labelShort: "check", variant: "checkpoint" as const },
    { left: "54%", leftSm: "54%", time: "14:15", label: "add-alerts", labelShort: "alerts", variant: "default" as const },
    { left: "65%", leftSm: "65%", time: "15:30", label: "optimize-fees", labelShort: "optimize", variant: "default" as const },
    { left: "76%", leftSm: "76%", time: "16:42", label: "test-predeploy", labelShort: "test", variant: "default" as const },
    { left: "87%", leftSm: "87%", time: "17:18", label: "query-error", labelShort: "error", variant: "error" as const },
    { left: "95%", leftSm: "95%", time: "17:20", label: "rollback", labelShort: "roll", variant: "default" as const },
  ];
  const ACCENT = "#00E5FF";

  return (
    <SectionGraphicShell className="h-[360px] sm:h-[420px]">
      <div className="absolute left-5 right-5 sm:left-8 sm:right-8 top-5 sm:top-10">
        <h4 className="text-white text-[20px] sm:text-[24px] md:text-[28px] leading-tight font-medium max-w-3xl pb-3 sm:pb-2">
          Market checkpoints.
          <span className="text-white/35 text-[0.95em]">
            {" "}
            Copy-on-write storage makes it cheap and fast to save point-in-time versions.
          </span>
        </h4>
      </div>

      {/* Timeline — same layout as developer-preview-section (circle on line, vertical up, time below) */}
      <div className="absolute left-5 right-5 sm:left-8 sm:right-8 bottom-[18%] h-[140px] sm:h-[180px] min-w-[480px] sm:min-w-0">
        {/* Horizontal blue line at 65% from top */}
        <div
          className="absolute left-0 right-0 h-px"
          style={{ top: "65%", backgroundColor: ACCENT }}
        />

        {/* Restore version — dashed orange curve to checkpoint */}
        <div className="absolute left-[43%] top-[12px] sm:top-[20px] -translate-x-1/2">
          <div className="relative">
            <div className="bg-[#0A0A0A] border-2 border-amber-400/90 rounded-full px-2.5 py-1.5 sm:px-4 sm:py-2 text-amber-400/95 text-[10px] sm:text-xs font-mono whitespace-nowrap">
              restore previous version
            </div>
            <div className="absolute left-1/2 top-full w-px h-5 sm:h-[40px] bg-amber-400/50" />
            <svg
              className="absolute left-1/2 top-5 sm:top-[40px] w-[100px] h-[28px] sm:w-[180px] sm:h-[45px] -translate-x-[25%]"
              viewBox="0 0 180 45"
            >
              <path
                d="M 0 0 Q 0 25, 45 35 L 160 35"
                stroke="rgb(251 191 36 / 0.9)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="4 4"
              />
            </svg>
          </div>
        </div>

        {/* Checkpoints — circle ON line, vertical line up, time below */}
        {points.map(({ left, leftSm, time, label, labelShort, variant }) => (
          <div
            key={label}
            className="absolute top-0 bottom-0 -translate-x-1/2 w-px flex flex-col items-center"
            style={{ left: `clamp(${left}, ${leftSm}, ${leftSm})` }}
          >
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
            <div
              className="w-2 h-2 rounded-full shrink-0 ring-2 ring-[#050608]"
              style={{
                backgroundColor: variant === "checkpoint" ? ACCENT : variant === "error" ? "rgb(248,113,113)" : "rgba(255,255,255,0.5)",
              }}
            />
            <div className="flex flex-col items-center pt-1 sm:pt-1.5 shrink-0">
              <span className="text-white/30 text-[8px] sm:text-xs font-mono leading-none whitespace-nowrap">{time}</span>
              <span
                className={`text-[8px] sm:text-xs leading-none whitespace-nowrap ${
                  variant === "checkpoint" ? "text-white font-medium"
                  : variant === "error" ? "text-red-400"
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
    </SectionGraphicShell>
  );
}

function VerifiableGraphic() {
  return (
    <SectionGraphicShell className="min-h-[480px] sm:min-h-[430px] lg:h-[430px]">
      <div className="absolute left-4 right-4 top-4 sm:left-8 sm:right-8 sm:top-8">
        <MiniPill accent>proof receipt</MiniPill>
      </div>

      <div className="absolute left-4 right-4 top-14 sm:left-8 sm:right-8 sm:top-20 rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6 sm:mb-8">
          <div>
            <div className="text-white text-xl sm:text-2xl lg:text-[30px] leading-none font-medium">Transaction Receipt</div>
            <div className="text-white/40 text-sm mt-2 sm:mt-3">Immutable execution proof</div>
          </div>

          <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-2xl border border-[#00E5FF]/30 bg-[#00E5FF]/10 flex items-center justify-center text-[#00E5FF]">
            <CheckIcon />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
          <div className="rounded-xl border border-white/6 bg-white/[0.02] px-4 py-3 sm:py-4">
            <div className="text-white/40 text-xs mb-2">tx signature</div>
            <div className="text-white text-sm sm:text-base break-all">5W9k...8Lpz</div>
          </div>
          <div className="rounded-xl border border-white/6 bg-white/[0.02] px-4 py-3 sm:py-4">
            <div className="text-white/40 text-xs mb-2">invoked programs</div>
            <div className="text-white text-sm sm:text-base">3 CPI calls</div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#00E5FF]/20 bg-[#00E5FF]/[0.06] p-4 sm:p-5 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
            <div className="text-5xl sm:text-6xl leading-none font-light text-[#00E5FF]">100%</div>
            <div className="text-white/75 text-sm sm:text-[15px] pb-0 sm:pb-2">On-chain verification</div>
          </div>
          <div className="mt-3 text-xs sm:text-sm leading-6 text-white/45">
            Every action includes signature, invoked programs, and program truth.
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-xl border border-white/6 bg-white/[0.02] px-4 py-3 sm:py-4">
            <div className="text-white/40 text-xs mb-2">upgradeability</div>
            <div className="text-white text-sm sm:text-base">verified</div>
          </div>
          <div className="rounded-xl border border-white/6 bg-white/[0.02] px-4 py-3 sm:py-4">
            <div className="text-white/40 text-xs mb-2">authority</div>
            <div className="text-white text-sm sm:text-base">matched</div>
          </div>
        </div>
      </div>
    </SectionGraphicShell>
  );
}

function ComposableGraphic() {
  const ORACLES = [
    { label: "Chainlink", sub: "Primary feed", active: true },
    { label: "Pyth", sub: "Secondary feed" },
    { label: "Neptune Oracle", sub: "Fallback / custom" },
  ];

  return (
    <SectionGraphicShell className="h-[320px] sm:h-[400px] lg:h-[430px] overflow-y-auto">
      <div className="absolute left-3 sm:left-8 top-3 sm:top-8">
        <h4 className="text-white text-base sm:text-xl lg:text-2xl font-medium">Oracle routing</h4>
        <p className="text-white/40 text-[10px] sm:text-sm mt-0.5 sm:mt-2">
          Clean fallback path with health and staleness checks.
        </p>
      </div>

      {/* Three-column layout: left cards | connector | right panel */}
      <div className="absolute left-3 sm:left-8 right-3 sm:right-8 top-14 sm:top-28 bottom-3 flex flex-col sm:flex-row sm:items-stretch gap-4 sm:gap-8 lg:gap-12">
        {/* Left column - oracle feeds */}
        <div className="hidden sm:flex flex-col gap-4 w-[200px] lg:w-[220px] shrink-0">
          {ORACLES.map((item) => (
            <div
              key={item.label}
              className={`rounded-xl lg:rounded-2xl border px-4 lg:px-5 py-3 lg:py-5 ${
                item.active
                  ? "border-[#00E5FF]/25 bg-[#00E5FF]/[0.06]"
                  : "border-white/8 bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-white text-sm lg:text-[15px] font-medium break-words leading-tight">{item.label}</div>
                <div className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full shrink-0 ${item.active ? "bg-[#00E5FF]" : "bg-white/20"}`} />
              </div>
              <div className="text-white/40 text-xs lg:text-sm mt-1 lg:mt-2 leading-tight">{item.sub}</div>
            </div>
          ))}
        </div>

        {/* Center - connector lines bridging left to right */}
        <div className="hidden sm:flex flex-1 min-w-[80px] items-center justify-center relative">
          <div className="absolute inset-0 flex items-center">
            {/* Horizontal: from left cards to vertical spine */}
            <div className="absolute left-0 top-[16%] right-1/2 h-px bg-gradient-to-r from-transparent via-[#00E5FF]/50 to-[#00E5FF]/40" />
            <div className="absolute left-0 top-[50%] right-1/2 h-px bg-gradient-to-r from-transparent via-white/20 to-white/20" />
            <div className="absolute left-0 top-[84%] right-1/2 h-px bg-gradient-to-r from-transparent via-white/20 to-white/20" />
            {/* Vertical spine with dots */}
            <div className="absolute left-1/2 top-[16%] bottom-[16%] w-px -translate-x-1/2 bg-white/10" />
            <div className="absolute left-1/2 top-[16%] w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00E5FF] shadow-[0_0_14px_rgba(0,229,255,0.6)]" />
            <div className="absolute left-1/2 top-[50%] w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20" />
            <div className="absolute left-1/2 top-[84%] w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20" />
            {/* Horizontal: from spine to right panel — active (blue) + inactive (grey) */}
            <div className="absolute left-1/2 top-[16%] right-0 h-px bg-gradient-to-r from-[#00E5FF]/40 via-[#00E5FF]/30 to-transparent" />
            <div className="absolute left-1/2 top-[50%] right-0 h-px bg-gradient-to-r from-white/20 via-white/15 to-transparent" />
            <div className="absolute left-1/2 top-[84%] right-0 h-px bg-gradient-to-r from-white/20 via-white/15 to-transparent" />
          </div>
        </div>

        {/* Mobile: stacked cards only */}
        <div className="sm:hidden flex flex-col gap-2">
          {ORACLES.map((item) => (
            <div
              key={item.label}
              className={`rounded-lg border px-3 py-2 ${
                item.active ? "border-[#00E5FF]/25 bg-[#00E5FF]/[0.06]" : "border-white/8 bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-white text-[10px] font-medium">{item.label}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${item.active ? "bg-[#00E5FF]" : "bg-white/20"}`} />
              </div>
              <span className="text-white/40 text-[9px] mt-0.5 block">{item.sub}</span>
            </div>
          ))}
        </div>

        {/* Right panel - resolved oracle details */}
        <div className="flex-1 min-w-0 sm:min-w-[200px] lg:min-w-[260px] sm:max-w-[300px] rounded-lg sm:rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-2 sm:p-4 lg:p-5">
        <div className="flex items-start justify-between mb-2 sm:mb-4 lg:mb-5 gap-1.5">
          <div className="min-w-0 flex-1">
            <div className="text-white text-[10px] sm:text-sm lg:text-[15px] font-medium break-words leading-tight">Resolved Oracle</div>
            <div className="text-white/40 text-[9px] sm:text-xs mt-0.5 leading-tight">Current market read path</div>
          </div>
          <MiniPill accent className="shrink-0 text-[8px] sm:text-xs px-1.5 sm:px-3 py-0.5 sm:py-1">healthy</MiniPill>
        </div>

        <div className="space-y-1.5 sm:space-y-3">
          <div className="rounded-lg sm:rounded-xl border border-[#00E5FF]/20 bg-[#00E5FF]/[0.05] px-2 sm:px-4 py-1.5 sm:py-4">
            <div className="text-white text-[10px] sm:text-sm lg:text-[15px] font-medium leading-tight">Chainlink</div>
            <div className="text-white/40 text-[9px] sm:text-xs lg:text-sm mt-0.5 sm:mt-2 leading-tight">Selected source</div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:gap-3">
            <div className="rounded-lg sm:rounded-xl border border-white/8 bg-white/[0.02] px-2 sm:px-4 py-1.5 sm:py-4 min-w-0">
              <div className="text-white/40 text-[8px] sm:text-xs mb-0.5 sm:mb-2 leading-tight">staleness</div>
              <div className="text-white text-[10px] sm:text-sm lg:text-base break-words leading-tight">&lt; 400ms</div>
            </div>
            <div className="rounded-lg sm:rounded-xl border border-white/8 bg-white/[0.02] px-2 sm:px-4 py-1.5 sm:py-4 min-w-0">
              <div className="text-white/40 text-[8px] sm:text-xs mb-0.5 sm:mb-2 leading-tight">confidence</div>
              <div className="text-white text-[10px] sm:text-sm lg:text-base break-words leading-tight">high</div>
            </div>
            <div className="rounded-lg sm:rounded-xl border border-white/8 bg-white/[0.02] px-2 sm:px-4 py-1.5 sm:py-4 min-w-0">
              <div className="text-white/40 text-[8px] sm:text-xs mb-0.5 sm:mb-2 leading-tight">fallbacks</div>
              <div className="text-white text-[10px] sm:text-sm lg:text-base break-words leading-tight">2 ready</div>
            </div>
            <div className="rounded-lg sm:rounded-xl border border-white/8 bg-white/[0.02] px-2 sm:px-4 py-1.5 sm:py-4 min-w-0">
              <div className="text-white/40 text-[8px] sm:text-xs mb-0.5 sm:mb-2 leading-tight">proof page</div>
              <div className="text-white text-[10px] sm:text-sm lg:text-base break-words leading-tight">visible</div>
            </div>
          </div>
        </div>
        </div>
      </div>

    </SectionGraphicShell>
  );
}

function RoadmapGraphic() {
  const liveItems: { title: string; desc: string }[] = [
    { title: "Mainnet Trade", desc: "Gasless perps trading, $0 network fees. Real markets, real liquidity." },
    { title: "Devnet Launch", desc: "Launch Percolator markets for free. Zero-deploy, full proof pages." },
  ];

  const comingSoonItems: { title: string; desc: string }[] = [
    { title: "Multi-Oracle", desc: "Chainlink, Pyth, and native oracle routing." },
    { title: "Spot + Perps", desc: "Unified venue with spot reference liquidity." },
  ];

  return (
    <SectionGraphicShell className="min-h-[420px] sm:min-h-[520px] overflow-visible">
      <div className="relative px-10 sm:px-16 pb-8 sm:pb-10">
        <div className="mb-6 sm:mb-8">
          <div className="text-white text-[20px] sm:text-[24px] md:text-[28px] font-medium">Roadmap</div>
          <div className="text-white/40 text-[13px] sm:text-sm mt-1.5 sm:mt-2">Live today · Coming soon</div>
        </div>

      <div className="space-y-5 sm:space-y-8">
          {liveItems.map((item) => (
            <div key={item.title}>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <MiniPill accent>Live</MiniPill>
                <span className="text-white text-[14px] sm:text-[15px] md:text-[16px] font-medium">{item.title}</span>
              </div>
              <p className="text-white/40 text-[13px] sm:text-sm mt-1.5 sm:mt-2 max-w-xl">{item.desc}</p>
            </div>
          ))}
          <div className="pt-5 border-t border-white/10 mt-4 sm:mt-6">
            <p className="text-white/50 text-sm font-medium mb-4">Coming soon</p>
            {comingSoonItems.map((item) => (
              <div key={item.title} className="mb-5 sm:mb-8 last:mb-0">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <MiniPill dim>Soon</MiniPill>
                  <span className="text-white/80 text-[14px] sm:text-[15px] md:text-[16px] font-medium">{item.title}</span>
                </div>
                <p className="text-white/40 text-[13px] sm:text-sm mt-1.5 sm:mt-2 max-w-xl">{item.desc}</p>
              </div>
            ))}
          </div>
      </div>
      </div>
    </SectionGraphicShell>
  );
}

/* ---------------- SECTION BLOCK ---------------- */

function SectionBlock({
  id,
  title,
  muted,
  description,
  graphic,
  children,
}: {
  id: string;
  title: string;
  muted: string;
  description: string;
  graphic: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div id={id} data-built-section className="mb-20 sm:mb-28 lg:mb-36 scroll-mt-24 sm:scroll-mt-32 flex flex-col">
      <h3 className="text-[28px] sm:text-3xl md:text-4xl lg:text-5xl font-medium mb-5 sm:mb-8 leading-tight max-w-5xl">
        <span className="text-white">{title}</span>{" "}
        <span className="text-white/40">{muted}</span>
      </h3>

      <p className="text-white/50 text-sm sm:text-base lg:text-lg leading-6 sm:leading-8 max-w-3xl">{description}</p>

      {graphic}

      {children}
    </div>
  );
}

/* ---------------- MAIN ---------------- */

export function BuiltDifferentSection() {
  const [activeSection, setActiveSection] = useState("permissionless");

  useEffect(() => {
    const sections = document.querySelectorAll("[data-built-section]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection((entry.target as HTMLElement).id);
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="px-4 sm:px-6 lg:px-10 py-8 sm:py-16 lg:py-24 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-[28px] sm:text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-tight mb-6 sm:mb-12 lg:mb-16">
          Built different.
        </h2>

        <div className="flex gap-6 sm:gap-12 lg:gap-16">
          <div className="hidden lg:block w-48 min-w-0 shrink-0">
            <div className="sticky top-24 w-48">
              <nav className="flex flex-col gap-3 min-w-0 max-w-full">
                <NavItem href="#permissionless" active={activeSection === "permissionless"}>
                  Permissionless
                </NavItem>
                <NavItem href="#verifiable" active={activeSection === "verifiable"}>
                  Verifiable
                </NavItem>
                <NavItem href="#composable" active={activeSection === "composable"}>
                  Composable
                </NavItem>
                <NavItem href="#roadmap" active={activeSection === "roadmap"}>
                  Roadmap
                </NavItem>
              </nav>
            </div>
          </div>

          <div className="flex-1 min-w-0 border-l-0 lg:border-l border-white/10 pl-0 lg:pl-12 overflow-x-hidden">
            <SectionBlock
              id="permissionless"
              title="Launch markets permissionlessly"
              muted="in under a minute."
              description="Neptune lets anyone deploy Percolator-style perp markets with real collateral, on-chain settlement, and full program truth — no KYC, no approvals. Free on devnet."
              graphic={<PermissionlessGraphic />}
            >
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-6 mb-8 sm:mb-12">
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 sm:p-6">
                  <div className="text-4xl sm:text-5xl md:text-6xl font-light mb-2 sm:mb-3" style={{ color: ACCENT }}>
                    50+
                  </div>
                  <div className="text-white/50 text-[13px] sm:text-sm">
                    Markets created and tested permissionlessly
                  </div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 sm:p-6">
                  <div className="text-4xl sm:text-5xl md:text-6xl font-light text-white mb-2 sm:mb-3">
                    {"<"}1 min
                  </div>
                  <div className="text-white/50 text-[13px] sm:text-sm">
                    Time to deploy a new market
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
                <FeatureCard
                  icon={<WalletIcon />}
                  title="No KYC required"
                  description="Deploy markets without identity verification"
                />
                <FeatureCard
                  icon={<ShieldIcon />}
                  title="Real collateral"
                  description="Backed by on-chain assets, not synthetic"
                />
                <FeatureCard
                  icon={<CodeIcon />}
                  title="Program truth"
                  description="Full transparency on program state"
                />
              </div>
            </SectionBlock>

            <SectionBlock
              id="verifiable"
              title="On-chain receipts"
              muted="for every action."
              description="Each receipt includes the tx signature, invoked programs including CPI, and program truth like upgradeability and upgrade authority — exportable as JSON."
              graphic={<VerifiableGraphic />}
            >
              <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
                <FeatureCard
                  icon={<FileIcon />}
                  title="JSON Export"
                  description="Download complete transaction receipts"
                />
                <FeatureCard
                  icon={<LockIcon />}
                  title="Program Truth"
                  description="Verify program upgradeability and authority"
                />
              </div>
            </SectionBlock>

            <SectionBlock
              id="composable"
              title="Flexible oracle modes:"
              muted="Chainlink, Pyth, or Neptune oracle."
              description="Oracle health and staleness are surfaced on the proof page. Choose the oracle path that fits your market while keeping routing, fallback, and state visibility clean."
              graphic={<ComposableGraphic />}
            >
              <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
                <FeatureCard
                  icon={<OracleIcon />}
                  title="Oracle modes"
                  description="Support for Chainlink, Pyth, and native Neptune oracle routing"
                />
                <FeatureCard
                  icon={<ClockIcon />}
                  title="Staleness tracked"
                  description="Real-time oracle health and freshness monitoring"
                />
                <FeatureCard
                  icon={<LayersIcon />}
                  title="Composable"
                  description="Mix and match sources per market with deterministic routing"
                />
              </div>
            </SectionBlock>

            <SectionBlock
              id="roadmap"
              title="Mainnet Trade"
              muted="+ Devnet Launch"
              description="Gasless perps trading on mainnet. Launch new Percolator markets on devnet for free. Both live today."
              graphic={<RoadmapGraphic />}
            />
          </div>
        </div>
      </div>
    </section>
  );
}