import { NextResponse } from "next/server";

/**
 * Gasless mainnet relay — Neptune sponsors tx fees.
 * When implemented: client sends signed tx (user signed, fee payer placeholder or missing),
 * server verifies tx message matches allowlist of programs/instructions, applies per-wallet
 * and per-IP rate limits, signs as fee payer, broadcasts.
 * Safety: instruction allowlist, verify tx before fee payer signs, cap compute units / priority fee.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { serializedTx, wallet } = body;

    if (!wallet || !serializedTx) {
      return NextResponse.json(
        { error: "Missing serializedTx or wallet" },
        { status: 400 }
      );
    }

    // Stub: gasless relay not yet implemented.
    return NextResponse.json(
      {
        error: "Gasless relay is in beta",
        message:
          "$0 network fees are rolling out. Trade with your wallet SOL for now. Gasless will be enabled soon.",
        code: "RELAY_NOT_READY",
      },
      { status: 501 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
