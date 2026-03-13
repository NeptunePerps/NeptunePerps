"use client";

const STEPS = [
  {
    num: "01",
    title: "Connect Wallet",
    desc: "Phantom, Solflare, or any Solana wallet. No signup, no KYC. One click and you are in.",
    gradient:
      "radial-gradient(ellipse at 20% 80%, #e040a0 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #4060ff 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, #1a0040 0%, #0a0020 100%)",
  },
  {
    num: "02",
    title: "Launch or Pick a Market",
    desc: "Deploy a new perpetual market in 60 seconds or open an existing one. Fully permissionless.",
    gradient:
      "radial-gradient(ellipse at 30% 30%, #8040ff 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, #4080ff 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, #2a1060 0%, #100840 100%)",
  },
  {
    num: "03",
    title: "Deposit Collateral",
    desc: "Transfer collateral into the market vault. Fully on-chain, non-custodial, verifiable.",
    gradient:
      "radial-gradient(ellipse at 70% 30%, #60c040 0%, transparent 50%), radial-gradient(ellipse at 30% 70%, #2080a0 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, #0a2020 0%, #081818 100%)",
  },
  {
    num: "04",
    title: "Trade Perps",
    desc: "Risk-increasing trades require a fresh crank. Neptune enforces freshness and lets you crank in one click.",
    gradient:
      "radial-gradient(ellipse at 80% 60%, #c0a020 0%, transparent 50%), radial-gradient(ellipse at 20% 40%, #8060e0 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, #1a1808 0%, #101008 100%)",
  },
  {
    num: "05",
    title: "Verify On-Chain",
    desc: "Receipts include CPI call chains + upgrade authority — not just an explorer link.",
    gradient:
      "radial-gradient(ellipse at 40% 20%, #20c0c0 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, #4040e0 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, #081820 0%, #060c18 100%)",
  },
  {
    num: "06",
    title: "Withdraw Anytime",
    desc: "Close your position, pull collateral back. Your keys, your funds. Always.",
    gradient:
      "radial-gradient(ellipse at 60% 20%, #ff6060 0%, transparent 50%), radial-gradient(ellipse at 30% 80%, #ff40a0 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, #200808 0%, #180810 100%)",
  },
];

function StepCard({ step }: { step: (typeof STEPS)[0] }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4 sm:p-5 lg:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.22em] text-white/35">
          Step {step.num}
        </span>
        <span className="inline-flex items-center rounded-full border border-[#00E5FF]/20 bg-[#00E5FF]/[0.06] px-2.5 py-1 text-[10px] sm:text-[11px] text-[#00E5FF]">
          On-chain
        </span>
      </div>

      <h3 className="text-[17px] sm:text-[20px] font-medium tracking-tight text-white mb-2">
        {step.title}
      </h3>
      <p className="text-[13px] sm:text-sm leading-6 text-white/50">
        {step.desc}
      </p>
    </div>
  );
}

export function HowItWorksBento() {
  return (
    <section id="how-it-works" className="relative py-8 sm:py-16 lg:py-24 xl:py-32 overflow-x-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-0 right-0 w-[80%] max-w-[520px] h-[60%] rounded-full opacity-[0.08] blur-[90px]"
          style={{ background: "radial-gradient(ellipse 50% 50% at 80% 20%, hsl(168 80% 42%), transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-[75%] max-w-[460px] h-[55%] rounded-full opacity-[0.05] blur-[80px]"
          style={{ background: "radial-gradient(ellipse 55% 55% at 20% 90%, hsl(262 80% 50%), transparent 72%)" }}
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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid lg:grid-cols-[0.9fr,1.1fr] gap-6 sm:gap-8 lg:gap-12 items-start">
          <div className="lg:sticky lg:top-24">
            <span className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40 mb-3 sm:mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]/80" />
              How It Works
            </span>
            <h2 className="text-[28px] sm:text-4xl md:text-5xl font-display font-bold text-white tracking-[-0.03em] leading-[1.08] text-balance mb-3 sm:mb-4">
              A cleaner path from wallet to verified execution.
            </h2>
            <p className="max-w-xl text-sm sm:text-base text-white/45 leading-6 sm:leading-7 mb-5 sm:mb-6">
              Neptune keeps the flow simple: connect, pick or launch a market, post collateral, trade, verify, and withdraw. Same protocol flow, clearer surface.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <div className="text-2xl sm:text-3xl font-light text-[#00E5FF]">6</div>
                <div className="mt-1 text-[11px] sm:text-xs uppercase tracking-[0.16em] text-white/35">
                  Core steps
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <div className="text-2xl sm:text-3xl font-light text-white">1</div>
                <div className="mt-1 text-[11px] sm:text-xs uppercase tracking-[0.16em] text-white/35">
                  Verification path
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {STEPS.map((step) => (
              <StepCard key={step.num} step={step} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
