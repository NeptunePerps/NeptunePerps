#!/usr/bin/env node
/**
 * Update devnet config and percolator-sdk SLAB_TIERS with three program IDs (and optionally slab sizes).
 * Run after deploy-tiered-devnet.sh.
 *
 * Usage:
 *   node scripts/update-tiered-program-ids.js <smallId> <mediumId> <largeId>
 *   node scripts/update-tiered-program-ids.js --from-keys [keysDir]
 *   node scripts/update-tiered-program-ids.js --from-keys --slab-lens <smallBytes> <mediumBytes> <largeBytes>
 *
 * With --from-keys, reads keypairs from keysDir (default: ../keys).
 * With --slab-lens, also updates slabBytes in devnet.ts and bytes in instructions.ts (use values from print-slab-len.sh).
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const scriptDir = __dirname;
const sdkRoot = path.resolve(scriptDir, "../../..");
const devnetTs = path.join(sdkRoot, "config/devnet.ts");
const instructionsTs = path.join(sdkRoot, "packages/percolator-sdk/src/instructions.ts");

function getPubkey(keypairPath) {
  const out = execSync(`solana-keygen pubkey "${keypairPath}"`, { encoding: "utf8" });
  return out.trim();
}

function main() {
  let smallId, mediumId, largeId;
  let slabLens = null; // [smallBytes, mediumBytes, largeBytes] or null
  const args = process.argv.slice(2);
  let i = 0;
  if (args[i] === "--from-keys") {
    i++;
    const keysDir = path.resolve(scriptDir, args[i] || "../keys");
    if (args[i] && !args[i].startsWith("--") && !args[i].startsWith("-")) i++;
    smallId = getPubkey(path.join(keysDir, "percolator-small.json"));
    mediumId = getPubkey(path.join(keysDir, "percolator-medium.json"));
    largeId = getPubkey(path.join(keysDir, "percolator-large.json"));
    console.log("From keys:", { smallId, mediumId, largeId });
  } else if (args.length >= 3 && !args[0].startsWith("--")) {
    [smallId, mediumId, largeId] = args;
    i = 3;
  } else {
    console.error("Usage: node update-tiered-program-ids.js <smallId> <mediumId> <largeId>");
    console.error("   or: node update-tiered-program-ids.js --from-keys [keysDir]");
    console.error("   Optional: --slab-lens <smallBytes> <mediumBytes> <largeBytes> (from print-slab-len.sh)");
    process.exit(1);
  }
  if (args[i] === "--slab-lens" && args.length >= i + 4) {
    slabLens = [args[i + 1], args[i + 2], args[i + 3]].map(Number);
    if (slabLens.some((n) => !Number.isInteger(n) || n <= 0)) {
      console.error("--slab-lens requires three positive integers");
      process.exit(1);
    }
    console.log("Slab sizes:", slabLens);
  }

  let devnet = fs.readFileSync(devnetTs, "utf8");
  devnet = devnet.replace(/percolatorProgramId:\s*"[^"]+"/, () => `percolatorProgramId: "${largeId}"`);
  devnet = devnet.replace(
    /small:\s*\{[^}]*programId:\s*"[^"]+"/,
    (m) => m.replace(/programId:\s*"[^"]+"/, `programId: "${smallId}"`)
  );
  devnet = devnet.replace(
    /medium:\s*\{[^}]*programId:\s*"[^"]+"/,
    (m) => m.replace(/programId:\s*"[^"]+"/, `programId: "${mediumId}"`)
  );
  devnet = devnet.replace(
    /large:\s*\{[^}]*programId:\s*"[^"]+"/,
    (m) => m.replace(/programId:\s*"[^"]+"/, `programId: "${largeId}"`)
  );
  if (slabLens) {
    devnet = devnet.replace(
      /(small:\s*\{[\s\S]*?)slabBytes:\s*\d+/,
      `$1slabBytes: ${slabLens[0]}`
    );
    devnet = devnet.replace(
      /(medium:\s*\{[\s\S]*?)slabBytes:\s*\d+/,
      `$1slabBytes: ${slabLens[1]}`
    );
    devnet = devnet.replace(
      /(large:\s*\{[\s\S]*?)slabBytes:\s*\d+/,
      `$1slabBytes: ${slabLens[2]}`
    );
  }
  fs.writeFileSync(devnetTs, devnet);
  console.log("Updated", devnetTs);

  let instructions = fs.readFileSync(instructionsTs, "utf8");
  // Match any bytes value (digits with optional underscores) and replace programId; optionally replace bytes if --slab-lens
  instructions = instructions.replace(
    /\{ label: "Small", maxAccounts: 256, bytes: ([\d_]+), programId: "[^"]+" \}/,
    (_, bytes) => `{ label: "Small", maxAccounts: 256, bytes: ${slabLens ? slabLens[0] : bytes}, programId: "${smallId}" }`
  );
  instructions = instructions.replace(
    /\{ label: "Medium", maxAccounts: 1024, bytes: ([\d_]+), programId: "[^"]+" \}/,
    (_, bytes) => `{ label: "Medium", maxAccounts: 1024, bytes: ${slabLens ? slabLens[1] : bytes}, programId: "${mediumId}" }`
  );
  instructions = instructions.replace(
    /\{ label: "Large", maxAccounts: 4096, bytes: ([\d_]+), programId: "[^"]+" \}/,
    (_, bytes) => `{ label: "Large", maxAccounts: 4096, bytes: ${slabLens ? slabLens[2] : bytes}, programId: "${largeId}" }`
  );
  fs.writeFileSync(instructionsTs, instructions);
  console.log("Updated", instructionsTs);
  console.log("Done. Small=%s Medium=%s Large=%s", smallId, mediumId, largeId);
}

main();
