"use client";

import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import {
  PublicKey,
  Transaction,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
} from "@solana/spl-token";
import { requestDevnetAirdrop, WEB_FAUCETS } from "@/lib/devnet-faucet";
import { useReceipts } from "./receipts-provider";
import { useCluster } from "./cluster-provider";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MintResult {
  mintAddress: string;
  ataAddress: string;
  supply: string;
  decimals: number;
  signatures: string[];
}

/* ------------------------------------------------------------------ */
/*  Token Factory Component                                            */
/* ------------------------------------------------------------------ */

interface TokenFactoryProps {
  /** When false, hide the internal header (use when page provides its own). */
  showHeader?: boolean;
}

export function TokenFactory({ showHeader = true }: TokenFactoryProps = {}) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const router = useRouter();
  const { addReceipt } = useReceipts();
  const { cluster } = useCluster();

  // Form state
  const [tokenName, setTokenName] = useState("Test Token");
  const [symbol, setSymbol] = useState("TEST");
  const [decimals, setDecimals] = useState(6);
  const [supply, setSupply] = useState("1000000");
  const [recipient, setRecipient] = useState("");

  // Mint-more state
  const [existingMint, setExistingMint] = useState("");
  const [mintMoreAmount, setMintMoreAmount] = useState("1000000");

  // UI state
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [mintingMore, setMintingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mintResult, setMintResult] = useState<MintResult | null>(null);
  const [recentMints, setRecentMints] = useState<MintResult[]>([]);

  // Load recent mints from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sov:devnet-mints");
      if (stored) setRecentMints(JSON.parse(stored));
    } catch {}
  }, []);

  // Save recent mints to localStorage
  const saveMint = useCallback((mint: MintResult) => {
    setRecentMints((prev) => {
      const next = [mint, ...prev.filter((m) => m.mintAddress !== mint.mintAddress)].slice(0, 20);
      try { localStorage.setItem("sov:devnet-mints", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // Set recipient to wallet by default
  useEffect(() => {
    if (wallet.publicKey && !recipient) {
      setRecipient(wallet.publicKey.toBase58());
    }
  }, [wallet.publicKey, recipient]);

  // Poll balance
  useEffect(() => {
    if (!wallet.publicKey) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const bal = await connection.getBalance(wallet.publicKey!);
        if (!cancelled) setSolBalance(bal / LAMPORTS_PER_SOL);
      } catch {}
    };
    poll();
    const id = setInterval(poll, 8000);
    return () => { cancelled = true; clearInterval(id); };
  }, [wallet.publicKey, connection]);

  // Receipts can be added via a server-side helper in a follow-up pass.

  /* ------------------------------------------------------------------ */
  /*  Create new mint + mint tokens                                      */
  /* ------------------------------------------------------------------ */

  const handleCreate = async () => {
    if (!wallet.publicKey || !wallet.sendTransaction) return;
    setCreating(true);
    setError(null);
    setMintResult(null);

    try {
      const payer = wallet.publicKey;
      const mintKeypair = Keypair.generate();
      const recipientPk = new PublicKey(recipient || payer.toBase58());

      // 1. Create mint account
      const lamports = await getMinimumBalanceForRentExemptMint(connection);
      const createMintIx = SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: mintKeypair.publicKey,
        lamports,
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID,
      });
      const initMintIx = createInitializeMintInstruction(
        mintKeypair.publicKey,
        decimals,
        payer, // mint authority
        payer, // freeze authority (optional)
      );

      // 2. Create ATA for recipient
      const ata = getAssociatedTokenAddressSync(mintKeypair.publicKey, recipientPk);
      const createAtaIx = createAssociatedTokenAccountInstruction(
        payer,
        ata,
        recipientPk,
        mintKeypair.publicKey,
      );

      // 3. Mint tokens
      const supplyRaw = BigInt(Math.floor(parseFloat(supply) * 10 ** decimals));
      const mintToIx = createMintToInstruction(
        mintKeypair.publicKey,
        ata,
        payer, // mint authority
        supplyRaw,
      );

      // Send as single transaction
      const tx = new Transaction().add(createMintIx, initMintIx, createAtaIx, mintToIx);
      const sig = await wallet.sendTransaction(tx, connection, { signers: [mintKeypair] });
      await connection.confirmTransaction(sig, "confirmed");

      const result: MintResult = {
        mintAddress: mintKeypair.publicKey.toBase58(),
        ataAddress: ata.toBase58(),
        supply,
        decimals,
        signatures: [sig],
      };
      setMintResult(result);
      saveMint(result);

      // Refresh balance
      try {
        const bal = await connection.getBalance(payer);
        setSolBalance(bal / LAMPORTS_PER_SOL);
      } catch {}
    } catch (e: any) {
      setError(e?.message || "Failed to create token");
    } finally {
      setCreating(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Mint more of existing token                                        */
  /* ------------------------------------------------------------------ */

  const handleMintMore = async () => {
    if (!wallet.publicKey || !wallet.sendTransaction || !existingMint) return;
    setMintingMore(true);
    setError(null);

    try {
      const payer = wallet.publicKey;
      const mintPk = new PublicKey(existingMint);
      const recipientPk = new PublicKey(recipient || payer.toBase58());

      // Ensure ATA exists
      const ata = getAssociatedTokenAddressSync(mintPk, recipientPk);
      const ataInfo = await connection.getAccountInfo(ata);

      const tx = new Transaction();
      if (!ataInfo) {
        tx.add(createAssociatedTokenAccountInstruction(payer, ata, recipientPk, mintPk));
      }

      // Get mint info to know decimals
      const mintInfo = await connection.getAccountInfo(mintPk);
      if (!mintInfo) throw new Error("Mint account not found on devnet");
      // Decimals is at byte 44 in SPL Mint layout
      const mintDecimals = mintInfo.data[44];

      const amountRaw = BigInt(Math.floor(parseFloat(mintMoreAmount) * 10 ** mintDecimals));
      tx.add(createMintToInstruction(mintPk, ata, payer, amountRaw));

      const sig = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");

      setError(null);
      // Update result to show success
      setMintResult({
        mintAddress: existingMint,
        ataAddress: ata.toBase58(),
        supply: mintMoreAmount,
        decimals: mintDecimals,
        signatures: [sig],
      });
    } catch (e: any) {
      setError(e?.message || "Failed to mint tokens");
    } finally {
      setMintingMore(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Explorer URL                                                       */
  /* ------------------------------------------------------------------ */

  const explorerUrl = (addr: string) =>
    `https://explorer.solana.com/address/${addr}?cluster=devnet`;

  /* ------------------------------------------------------------------ */
  /*  Render                                                              */
  /* ------------------------------------------------------------------ */

  return (
    <div className="flex-1 overflow-auto">
      <div className="w-full max-w-none px-4 lg:px-6 py-6">
        {showHeader && (
          <div className="mb-6">
            <h1 className="text-base font-semibold text-foreground tracking-tight mb-1">Token Factory</h1>
            <p className="text-sm text-muted-foreground">
              Create SPL tokens for testing. Use as collateral in the{" "}
              <Link href="/app/devnet/launch" className="text-primary hover:underline">Launch Wizard</Link>.
            </p>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-5">
          {/* Left: Main form */}
          <div className="lg:col-span-3 space-y-4">
            <Section title="1. Wallet">
              {wallet.publicKey ? (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <code className="text-sm text-foreground font-mono">{wallet.publicKey.toBase58().slice(0, 8)}…{wallet.publicKey.toBase58().slice(-6)}</code>
                  {solBalance !== null && (
                    <span className="text-xs text-muted-foreground ml-auto">{solBalance.toFixed(4)} SOL</span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Connect your wallet to continue.</p>
              )}
            </Section>

            <Section title="2. New Token">
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Token Name" value={tokenName} onChange={setTokenName} placeholder="e.g. Test USDC" />
                <InputField label="Symbol" value={symbol} onChange={setSymbol} placeholder="e.g. tUSDC" />
                <InputField label="Decimals" value={String(decimals)} onChange={(v) => { const n = parseInt(v); setDecimals(isNaN(n) ? 6 : n); }} type="number" />
                <InputField label="Supply (tokens)" value={supply} onChange={setSupply} type="number" />
              </div>
              <InputField label="Recipient Address" value={recipient} onChange={setRecipient} mono placeholder="Defaults to your wallet" />
              <p className="text-xs text-muted-foreground mt-2">
                You will be the mint authority. Tokens will be sent to the recipient address (your wallet by default).
              </p>

              <button
                onClick={handleCreate}
                disabled={creating || !wallet.publicKey}
                className="w-full mt-4 py-2.5 rounded-md bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-primary-foreground transition"
              >
                {creating ? "Creating…" : `Create Mint + Mint ${formatAmount(supply, decimals)} Tokens`}
              </button>
            </Section>

            <Section title="3. Mint More (Existing Token)">
              <p className="text-xs text-muted-foreground mb-3">
                Already created a token? Mint more supply. You must be the mint authority.
              </p>
              <InputField label="Existing Mint Address" value={existingMint} onChange={setExistingMint} mono placeholder="Paste mint pubkey…" />
              <InputField label="Amount to Mint" value={mintMoreAmount} onChange={setMintMoreAmount} type="number" />
              <button
                onClick={handleMintMore}
                disabled={mintingMore || !wallet.publicKey || !existingMint}
                className="w-full mt-3 py-2 rounded-md border border-border bg-surface hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-foreground transition"
              >
                {mintingMore ? "Minting…" : `Mint ${formatAmount(mintMoreAmount)} More Tokens`}
              </button>
            </Section>

            {error && (
              <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                <p className="text-sm font-semibold text-destructive">Error</p>
                <p className="text-xs text-destructive/90 mt-0.5 break-all">{error}</p>
              </div>
            )}

            {mintResult && (
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                <p className="text-sm font-semibold text-primary mb-3">Token Created Successfully</p>
                <div className="space-y-2">
                  <ResultRow label="Mint Address" value={mintResult.mintAddress} copyable explorerUrl={explorerUrl(mintResult.mintAddress)} />
                  <ResultRow label="Your Token Account" value={mintResult.ataAddress} copyable explorerUrl={explorerUrl(mintResult.ataAddress)} />
                  <ResultRow label="Supply" value={`${formatAmount(mintResult.supply, mintResult.decimals)} tokens (${mintResult.decimals} decimals)`} />
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => navigator.clipboard.writeText(mintResult.mintAddress)}
                    className="px-3 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-xs font-semibold text-primary-foreground transition"
                  >
                    Copy Mint Address
                  </button>
                  <Link
                    href="/app/devnet/launch"
                    className="px-3 py-1.5 rounded-md border border-border bg-surface hover:bg-surface-hover text-xs font-semibold text-foreground transition"
                  >
                    Use in Launch Wizard &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right: Info panel */}
          <div className="lg:col-span-2 space-y-3">
            <div className="p-4 rounded-lg border border-border bg-surface">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">How It Works</p>
              <div className="space-y-2.5 text-xs text-muted-foreground">
                <Step n={1}>Create an SPL token mint on devnet (you become the mint authority)</Step>
                <Step n={2}>Tokens are minted and sent to your wallet automatically</Step>
                <Step n={3}>Use the mint address as the <b className="text-foreground">Collateral Mint</b> in the Launch Wizard</Step>
                <Step n={4}>When trading, you deposit these tokens as collateral</Step>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-border bg-surface">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">FAQ</p>
              <div className="space-y-3">
                <Faq q="Do I need a custom token?">
                  Not necessarily. You can use <b className="text-foreground">Wrapped SOL</b> (default) as collateral — just wrap SOL when depositing. Custom tokens are useful for testing stablecoin-margined markets.
                </Faq>
                <Faq q="Do I need tokens in my wallet?">
                  Yes. To deposit into a Percolator market, you need tokens of the collateral mint in your wallet. This page mints them directly to you.
                </Faq>
                <Faq q="What about Wrapped SOL?">
                  If your market uses Wrapped SOL as collateral (the default), you don't need to mint anything — the Launch Wizard handles wrapping SOL automatically.
                </Faq>
                <Faq q="Can I mint more later?">
                  Yes, use the "Mint More" section below. You must be the mint authority (the wallet that created the token).
                </Faq>
              </div>
            </div>

            {recentMints.length > 0 && (
              <div className="p-4 rounded-lg border border-border bg-surface">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Your Recent Mints</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {recentMints.map((m) => (
                    <button
                      key={m.mintAddress}
                      onClick={() => {
                        setExistingMint(m.mintAddress);
                        navigator.clipboard.writeText(m.mintAddress);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-surface-hover transition text-left border border-transparent hover:border-border"
                    >
                      <div>
                        <code className="text-xs text-foreground font-mono">{m.mintAddress.slice(0, 8)}…{m.mintAddress.slice(-6)}</code>
                        <span className="text-[10px] text-muted-foreground ml-1.5">{m.decimals}d</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">Click to copy</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Link
                href="/app/devnet/launch"
                className="flex items-center justify-between px-3 py-2.5 rounded-md border border-border bg-surface hover:bg-surface-hover transition"
              >
                <span className="text-xs text-foreground">Launch Perp Market</span>
                <span className="text-xs text-muted-foreground">&rarr;</span>
              </Link>
              <Link
                href="/app/devnet"
                className="flex items-center justify-between px-3 py-2.5 rounded-md border border-border bg-surface hover:bg-surface-hover transition"
              >
                <span className="text-xs text-foreground">Markets Directory</span>
                <span className="text-xs text-muted-foreground">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-lg border border-border bg-surface">
      <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">{title}</h2>
      {children}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-md bg-background/60 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 transition ${mono ? "font-mono" : ""}`}
      />
    </div>
  );
}

function ResultRow({
  label,
  value,
  copyable = false,
  explorerUrl,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  explorerUrl?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
      <code className="text-xs text-foreground font-mono truncate flex-1">{value}</code>
      {copyable && (
        <button
          onClick={() => navigator.clipboard.writeText(value)}
          className="text-[10px] text-primary hover:underline transition shrink-0"
        >
          Copy
        </button>
      )}
      {explorerUrl && (
        <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline transition shrink-0">
          Explorer
        </a>
      )}
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0 mt-0.5">{n}</span>
      <span>{children}</span>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-foreground">{q}</p>
      <p className="text-xs text-muted-foreground mt-1">{children}</p>
    </div>
  );
}

function formatAmount(amount: string, decimals?: number): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return num.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
