#!/usr/bin/env node
/**
 * Write a Solana keypair JSON file from LAUNCH_SPONSOR_PRIVATE_KEY (base58).
 * Used by deploy-tiered-devnet.sh so the sponsor wallet pays for deploys.
 * Run from apps/web so node_modules/bs58 is available:
 *   LAUNCH_SPONSOR_PRIVATE_KEY=... node scripts/write-deployer-keypair.js /path/to/output.json
 */

const fs = require("fs");
const path = require("path");

const keyB58 = process.env.LAUNCH_SPONSOR_PRIVATE_KEY?.trim();
const outPath = process.argv[2];

if (!keyB58 || !outPath) {
  process.stderr.write("Usage: LAUNCH_SPONSOR_PRIVATE_KEY=<base58> node write-deployer-keypair.js <output.json>\n");
  process.exit(1);
}

let bs58;
try {
  bs58 = require("bs58");
} catch (_) {
  const webRoot = path.resolve(__dirname, "../../../../..");
  bs58 = require(path.join(webRoot, "node_modules/bs58"));
}

const bytes = bs58.decode(keyB58);
if (bytes.length !== 64) {
  process.stderr.write("Expected 64-byte keypair (got " + bytes.length + "). Check LAUNCH_SPONSOR_PRIVATE_KEY.\n");
  process.exit(1);
}
fs.writeFileSync(outPath, JSON.stringify(Array.from(bytes)), "utf8");
process.stderr.write("Wrote deployer keypair to " + outPath + "\n");
