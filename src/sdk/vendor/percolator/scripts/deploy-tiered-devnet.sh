#!/usr/bin/env bash
# Build and deploy tiered Percolator programs to devnet.
# Requires: Rust, Solana CLI (provides cargo build-sbf), and for deploy a funded devnet wallet.
#
# Run from repo root (apps/web):
#   cd src/sdk/vendor/percolator && ./scripts/deploy-tiered-devnet.sh [build-only]
# Or if you're already in percolator:
#   ./scripts/deploy-tiered-devnet.sh [build-only]
#
# Env (optional):
#   KEYPAIR_SMALL   path to keypair for Small tier program (default: keys/percolator-small.json)
#   KEYPAIR_MEDIUM  path to keypair for Medium tier program
#   KEYPAIR_LARGE   path to keypair for Large tier program
#   DEPLOYER_KEYPAIR  path to wallet keypair that pays for deploy (default: ~/.config/solana/id.json)
#   RPC_URL         devnet RPC (default: https://api.devnet.solana.com)
#
# After deploy, update apps/web/src/sdk/config/devnet.ts and
# apps/web/src/sdk/packages/percolator-sdk/src/instructions.ts with the three program IDs.

set -e
# Load Rust env (rustup) so cargo is on PATH
[[ -f "$HOME/.cargo/env" ]] && source "$HOME/.cargo/env"
# Common Solana CLI install locations
for d in "$HOME/.local/share/solana/install/active_release/bin" \
         "$HOME/solana/bin" \
         "/opt/homebrew/bin" \
         "/usr/local/bin"; do
  [[ -x "$d/solana" ]] && export PATH="$d:$PATH" && break
done
export PATH="$HOME/.cargo/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROG_DIR="$(cd "$SCRIPT_DIR/../percolator-prog" && pwd)"
KEYS_DIR="$SCRIPT_DIR/../keys"
DEPLOY_DIR="$PROG_DIR/target/deploy"
BUILD_ONLY="${1:-}"
mkdir -p "$KEYS_DIR"
KEYS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)/keys"

KEYPAIR_SMALL="${KEYPAIR_SMALL:-$KEYS_DIR/percolator-small.json}"
KEYPAIR_MEDIUM="${KEYPAIR_MEDIUM:-$KEYS_DIR/percolator-medium.json}"
KEYPAIR_LARGE="${KEYPAIR_LARGE:-$KEYS_DIR/percolator-large.json}"
RPC_URL="${RPC_URL:-https://api.devnet.solana.com}"

# Deployer: 1) LAUNCH_SPONSOR_PRIVATE_KEY from apps/web/.env.local (sponsor wallet), 2) DEPLOYER_KEYPAIR env, 3) Solana CLI default
if [[ -n "$DEPLOYER_KEYPAIR" && -f "$DEPLOYER_KEYPAIR" ]]; then
  : # use explicit DEPLOYER_KEYPAIR
else
  DEPLOYER_KEYPAIR=""
  WEB_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"
  ENV_LOCAL="$WEB_ROOT/.env.local"
  if [[ -f "$ENV_LOCAL" ]]; then
    LAUNCH_SPONSOR_PRIVATE_KEY="$(grep -E '^LAUNCH_SPONSOR_PRIVATE_KEY=' "$ENV_LOCAL" | cut -d= -f2- | tr -d '"'"' '"'"' | head -1)"
    if [[ -n "$LAUNCH_SPONSOR_PRIVATE_KEY" ]]; then
      export LAUNCH_SPONSOR_PRIVATE_KEY
      if (cd "$WEB_ROOT" && node "$SCRIPT_DIR/write-deployer-keypair.js" "$KEYS_DIR/deployer-from-env.json" 2>/dev/null); then
        DEPLOYER_KEYPAIR="$KEYS_DIR/deployer-from-env.json"
      fi
    fi
  fi
  if [[ -z "$DEPLOYER_KEYPAIR" && -f "$HOME/.config/solana/id.json" ]]; then
    DEPLOYER_KEYPAIR="$HOME/.config/solana/id.json"
  fi
fi

ensure_keypair() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    echo "Generating keypair: $path"
    solana-keygen new --no-bip39-passphrase -o "$path" --force
  fi
}

if ! command -v cargo &>/dev/null; then
  echo "cargo not found. Install Rust, then re-run:"
  echo "  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
  echo "  source ~/.cargo/env"
  exit 1
fi
# cargo build-sbf comes from Solana/Agave CLI install (SBF toolchain)
if ! cargo build-sbf --version &>/dev/null; then
  echo "cargo build-sbf not found. Solana CLI installs the SBF toolchain. Run one of:"
  echo "  # Agave (recommended):"
  echo "  sh -c \"\$(curl -sSfL https://release.anza.xyz/stable/install)\""
  echo "  # Or classic Solana:"
  echo "  sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
  echo "Then add to PATH and re-run this script:"
  echo "  export PATH=\"\$HOME/.local/share/solana/install/active_release/bin:\$PATH\""
  exit 1
fi

echo "== Building tiered programs (devnet) =="
cd "$PROG_DIR"

# Small tier (MAX_ACCOUNTS=256)
echo "Building Small tier..."
cargo build-sbf --features "devnet,small"
cp -f "$DEPLOY_DIR/percolator_prog.so" "$DEPLOY_DIR/percolator_prog_small.so"

# Medium tier (MAX_ACCOUNTS=1024)
echo "Building Medium tier..."
cargo build-sbf --features "devnet,medium"
cp -f "$DEPLOY_DIR/percolator_prog.so" "$DEPLOY_DIR/percolator_prog_medium.so"

# Large tier (MAX_ACCOUNTS=4096)
echo "Building Large tier..."
cargo build-sbf --features devnet
cp -f "$DEPLOY_DIR/percolator_prog.so" "$DEPLOY_DIR/percolator_prog_large.so"

echo ""
echo "Built:"
echo "  Small  $DEPLOY_DIR/percolator_prog_small.so"
echo "  Medium $DEPLOY_DIR/percolator_prog_medium.so"
echo "  Large  $DEPLOY_DIR/percolator_prog_large.so"

if [[ "$BUILD_ONLY" == "build-only" ]]; then
  echo ""
  echo "Build-only done. To deploy later (need Solana CLI + funded devnet wallet):"
  echo "  ./scripts/deploy-tiered-devnet.sh"
  echo "  Or install Solana: sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
  exit 0
fi

if ! command -v solana &>/dev/null; then
  echo ""
  echo "Solana CLI not installed — needed for deploy. Either:"
  echo "  1) Install: sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
  echo "     Then: export PATH=\$HOME/.local/share/solana/install/active_release/bin:\$PATH"
  echo "  2) Or you already built; deploy later with: ./scripts/deploy-tiered-devnet.sh"
  exit 1
fi

ensure_keypair "$KEYPAIR_SMALL"
ensure_keypair "$KEYPAIR_MEDIUM"
ensure_keypair "$KEYPAIR_LARGE"

if [[ -z "$DEPLOYER_KEYPAIR" || ! -f "$DEPLOYER_KEYPAIR" ]]; then
  echo "Deployer keypair not found."
  echo "  Option 1: Set DEPLOYER_KEYPAIR to a keypair file path (wallet with devnet SOL)."
  echo "  Option 2: Put LAUNCH_SPONSOR_PRIVATE_KEY in apps/web/.env.local (sponsor wallet with SOL)."
  echo "  Option 3: solana config set --keypair <path>  (uses ~/.config/solana/id.json)"
  exit 1
fi
echo "Using deployer keypair: $DEPLOYER_KEYPAIR"

echo ""
echo "== Deploying to devnet =="
solana config set --url "$RPC_URL"

echo "Deploying Small tier..."
solana program deploy "$DEPLOY_DIR/percolator_prog_small.so" --program-id "$KEYPAIR_SMALL" --keypair "$DEPLOYER_KEYPAIR"
SMALL_ID=$(solana-keygen pubkey "$KEYPAIR_SMALL")
echo "  Small program ID: $SMALL_ID"

echo "Deploying Medium tier..."
solana program deploy "$DEPLOY_DIR/percolator_prog_medium.so" --program-id "$KEYPAIR_MEDIUM" --keypair "$DEPLOYER_KEYPAIR"
MEDIUM_ID=$(solana-keygen pubkey "$KEYPAIR_MEDIUM")
echo "  Medium program ID: $MEDIUM_ID"

echo "Deploying Large tier..."
solana program deploy "$DEPLOY_DIR/percolator_prog_large.so" --program-id "$KEYPAIR_LARGE" --keypair "$DEPLOYER_KEYPAIR"
LARGE_ID=$(solana-keygen pubkey "$KEYPAIR_LARGE")
echo "  Large program ID: $LARGE_ID"

echo ""
echo "== Update app config =="
UPDATE_SCRIPT="$SCRIPT_DIR/update-tiered-program-ids.js"
SDK_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
if [[ -f "$UPDATE_SCRIPT" ]] && command -v node &>/dev/null; then
  (cd "$SDK_ROOT" && node "$SCRIPT_DIR/update-tiered-program-ids.js" --from-keys "$KEYS_DIR") && echo "App config updated."
else
  echo "Run from apps/web/src/sdk: node vendor/percolator/scripts/update-tiered-program-ids.js --from-keys vendor/percolator/keys"
  echo "Or: node vendor/percolator/scripts/update-tiered-program-ids.js $SMALL_ID $MEDIUM_ID $LARGE_ID"
  echo "Then set in sdk/config/devnet.ts and instructions.ts: small=$SMALL_ID medium=$MEDIUM_ID large=$LARGE_ID"
fi
echo "If launch wizard shows InvalidSlabLen: run print-slab-len.sh, then:"
echo "  node vendor/percolator/scripts/update-tiered-program-ids.js --from-keys vendor/percolator/keys --slab-lens <small> <medium> <large>"
