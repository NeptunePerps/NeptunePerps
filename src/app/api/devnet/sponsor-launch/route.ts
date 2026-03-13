import { NextResponse } from "next/server";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bs58 = require("bs58") as { decode(s: string): Uint8Array };

const DEVNET_RPC = "https://api.devnet.solana.com";

/** CORS headers so custom/origin requests don't hit CORS errors */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/** Min/max SOL we allow to send per sponsor request (abuse protection). */
const MIN_SPONSOR_SOL = 0.05;
const MAX_SPONSOR_SOL = 2;

/**
 * Devnet Free Launch — Neptune sponsors rent + tx fees.
 * Transfers SOL from the sponsor wallet (LAUNCH_SPONSOR_PRIVATE_KEY) to the user's wallet
 * so they can run the normal launch flow. Server-only; key never exposed.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      wallet,
      marketName,
      collateralMint,
      initialPrice,
      estimatedTotalSol,
      estimatedSol,
    } = body;

    if (!wallet) {
      return NextResponse.json(
        { error: "Missing wallet public key" },
        { status: 400, headers: corsHeaders }
      );
    }

    const privateKeyB58 = process.env.LAUNCH_SPONSOR_PRIVATE_KEY?.trim();
    if (!privateKeyB58) {
      return NextResponse.json(
        {
          error: "Sponsor launch is not configured",
          message:
            "Free devnet launch is rolling out. Use the airdrop button to get SOL and launch with the normal flow for now.",
          code: "SPONSOR_NOT_READY",
        },
        { status: 501, headers: corsHeaders }
      );
    }

    let sponsorKeypair: Keypair;
    try {
      const secret = bs58.decode(privateKeyB58);
      sponsorKeypair = Keypair.fromSecretKey(new Uint8Array(secret));
    } catch {
      return NextResponse.json(
        { error: "Invalid sponsor key configuration" },
        { status: 500, headers: corsHeaders }
      );
    }

    const solAmount =
      typeof estimatedTotalSol === "number"
        ? estimatedTotalSol
        : typeof estimatedSol === "number"
          ? estimatedSol
          : 0.5;
    const clamped = Math.min(
      MAX_SPONSOR_SOL,
      Math.max(MIN_SPONSOR_SOL, solAmount)
    );
    const lamports = Math.floor(clamped * LAMPORTS_PER_SOL);

    const connection = new Connection(DEVNET_RPC, "confirmed");
    const toPubkey = new PublicKey(wallet);

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: sponsorKeypair.publicKey,
        toPubkey,
        lamports,
      })
    );

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;
    tx.feePayer = sponsorKeypair.publicKey;

    tx.sign(sponsorKeypair);

    const signature = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed"
    );

    return NextResponse.json(
      { success: true, signature, lamports, sol: clamped },
      { headers: corsHeaders }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Transfer failed";
    return NextResponse.json(
      { error: "Sponsor transfer failed", message },
      { status: 500, headers: corsHeaders }
    );
  }
}
