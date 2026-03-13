# NEPTUNE

![NEPTUNE](./public/images/og-image.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Website](https://img.shields.io/badge/Website-neptune-perps.trade-111111?logo=globe&logoColor=white)](https://neptune-perps.trade)
[![X](https://img.shields.io/badge/X-@NeptunePerps-111111?logo=x&logoColor=white)](https://x.com/NeptunePerps)
[![GitHub](https://img.shields.io/badge/GitHub-NeptunePerps-111111?logo=github&logoColor=white)](https://github.com/NeptunePerps)
[![Next.js](https://img.shields.io/badge/Next.js-15.x-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Solana](https://img.shields.io/badge/Solana-Enabled-14F195?logo=solana&logoColor=white)](https://solana.com)

**Neptune is the terminal + launch layer for permissionless perps — built on the Percolator design.**  
Trade on mainnet, launch markets on devnet, and **verify every action** with receipts that include **CPI traces, program upgrade authority, oracle health, and crank freshness**.

> **Goal:** become the #1 trading terminal for **Percolator perps** *and* “normal perps” (major venues),  
> while enabling permissionless perp launches and **adding third-party Percolator markets** for trading.

---

## What is Neptune?

Neptune productizes the Percolator design into a **dual-mode** platform:

### 1) Mainnet Trading Terminal (`/app/mainnet`)
A professional perps terminal for real trading:
- Real-time charts (multi-timeframe) + indicators (RSI, moving averages, etc.)
- Market & limit orders (long/short), leverage controls (up to 50x where supported)
- Fast position management (mark/entry/uPnL refresh, one-click close, close-all)
- Collateral flexibility (SOL / USDC depending on venue)
- Transaction history with explorer links
- **Receipts for key actions** (trades, deposits, withdrawals)

### 2) Devnet Lab — Credibility Engine (`/app/devnet`)
A builder sandbox for Percolator markets — designed to survive scrutiny:
- Markets directory loaded from **on-chain registry** (no hardcoded lists)
- **Market Proof Page** (`/app/devnet/markets/[marketId]`) with on-chain truth:
  - Addresses Truth Table (slab, vaults, insurance, PDAs, oracle accounts)
  - **Market Admin**: current admin or “Burned (immutable)”; **rotate or burn admin key** from the Proof Page (burn = set admin to zero → no config changes ever)
  - Program Truth Panel (upgradeable vs immutable, **upgrade authority**, explorer links)
  - Oracle Health (mode, price, staleness/confidence, authority override)
  - Liveness / Crank Panel (fresh/stale, last crank slot/time, **Crank Now**)
  - Pricing Truth panel (spread, skew, guards — coming soon)
  - Market State Panel (vaults, insurance, fees, OI, funding, full risk params)
- **Full Trading Cycle Checklist** (acceptance test):
  **Init → Deposit → Crank → Trade → Close → Withdraw**
  with receipts at every step

### 3) Permissionless Market Launch (“Pump.fun for perps”) (`/app/devnet/launch`)
A guided flow for launching Percolator-style perp markets:
- Quick Launch tiers (Small/Medium/Large) with transparent costs
- Advanced wizard (oracle mode, slab size, matcher/vAMM params, risk/fees)
- **Atomic core deploy** (all-or-nothing to avoid stranded SOL)
- Live rent/cost computation from RPC (no made-up numbers)
- Exportable Market JSON for sharing/importing

---

## What makes Neptune different

### Proof-native (not proof-added)
Every critical action produces a **verifiable receipt**, not a UI notification:
- tx signature(s) + explorer links
- invoked programs (including **inner CPI**)
- program metadata (upgradeable vs immutable, **upgrade authority**)
- oracle status (mode, staleness/health)
- crank freshness / liveness at execution time
- exportable JSON (portable audit trail)

### Zero mock data (hard rule)
If it can’t be read from RPC/on-chain accounts, Neptune shows it as **unavailable** — not “fake”.

### Next: Pricing as a first-class pillar
We’re upgrading the **pricing layer** to be measurable and verifiable (propAMM-style matcher, thin-market protections, Pricing Truth on the Proof Page, pricing events on receipts). See **[Pricing Roadmap](src/sdk/docs/PRICING_ROADMAP.md)** for the full plan and **[pricing-tests.md](src/sdk/docs/pricing-tests.md)** for the abuse/safety test harness (results TBD).

### Liveness is first-class UX
Percolator-style perps require fresh keeper cranks for risk-increasing actions.  
Neptune surfaces this explicitly and enforces it.

---

## Built on the Percolator design

**Percolator is the engine. Neptune is the product layer.**

Percolator defines the constraints that make permissionless perps real:
- margin + liquidation logic
- vault & insurance accounting
- funding mechanics
- oracle dependencies
- keeper crank / liveness gating
- optional matcher/vAMM execution

Neptune makes those constraints **usable, visible, and verifiable** via Proof Pages + receipts.

---

## Quick demo (what “real” looks like)

### Devnet credibility loop (the acceptance test)
1. Open a devnet market Proof Page
2. **Init user**
3. **Deposit collateral**
4. **Crank Now** (freshen market)
5. **Open position**
6. **Close position**
7. **Withdraw**
8. Export receipts JSON

If you can run that loop with a fresh wallet and every step yields receipts + state changes,
you’ve proven the system end-to-end.

---

## Receipts (high-level format)

Neptune receipts are designed to be inspectable and shareable:

- `tx`: signature(s)
- `marketId`: market identifier
- `action`: deposit/trade/crank/withdraw/deploy/…
- `programsInvoked`: top-level + inner CPI
- `programTruth`: upgradeability + upgrade authority per program
- `oracleStatus`: mode + health/staleness (where applicable)
- `crankFreshness`: fresh/stale + slots/time since last crank
- `export`: JSON serialization for audit and sharing

> Exact field names may differ by implementation — the invariant is that receipts capture
> **CPI + program truth + liveness + oracle health**.

---

## Roadmap (direction)

Neptune is expanding into the default terminal for:
- **Percolator perps** (native + third-party Percolator markets)
- **Major perps venues** (“normal perps”) via adapters in the mainnet terminal
- A unified discovery layer (market directory, proof pages, receipts-first trading)

North star: **best execution UX + best verifiability UX**.

---

## Getting started

### Prerequisites
- Node.js 18+ (recommended: 20+)
- pnpm (recommended) or npm/yarn
- A Solana wallet (Phantom / Solflare)
- Devnet SOL for testing (Neptune includes airdrop helpers)

### Install
```bash
git clone https://github.com/<YOUR_ORG>/<YOUR_REPO>.git
cd <YOUR_REPO>
pnpm install


Environment

Create .env.local (or copy from .env.example if present).
Typical variables:

NEXT_PUBLIC_MAINNET_RPC_URL

NEXT_PUBLIC_DEVNET_RPC_URL

Example:

NEXT_PUBLIC_MAINNET_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_DEVNET_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY

Use the exact variable names your repo expects (check .env.example).

Run
pnpm dev

Open http://localhost:3000

Build
pnpm build
pnpm start
Project structure (high level)

Typical Next.js App Router layout:

app/
  page.tsx                 # landing
  app/
    mainnet/               # mainnet terminal
    devnet/                # devnet lab
      launch/              # market launch wizard
      mint/                # token factory
      markets/[marketId]/  # proof page
components/
lib/
public/
Security notes

No private keys: signing happens via the user’s wallet

RPC keys: keep in .env.local, never commit

Receipts: stored per wallet + cluster; exportable for audit

Program truth inspection: surfaces upgradeability + upgrade authority explicitly

This repo is a developer preview. Treat it as experimental unless explicitly audited.

Contributing

PRs welcome. If you ship something that improves verifiability, liveness UX, receipts,
or Percolator market interoperability — that’s core to Neptune.

Fork

Branch: git checkout -b feat/<name>

Test locally

PR with clear description + screenshots where relevant

License

MIT for this repository. Integrated protocols and vendor code retain their own licenses/terms.


### What this README fixes + upgrades (so you don’t miss it)
- Removes **SOV** identity leakage and “legacy branding” leftovers
- Makes **Percolator** explicit (hero-level positioning)
- Calls out the **Proof Page** + **Program Truth** + **CPI trace** + **crank freshness** (the real bangers)
- Adds the **acceptance test** that Solana builders respect
- Aligns to your direction: **#1 Percolator terminal + normal perps aggregator + third-party Percolator markets**

