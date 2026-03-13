#!/usr/bin/env bash
# Print SLAB_LEN for each tier (Small / Medium / Large) from the Rust build.
# Run from repo root (apps/web) or from percolator:
#   cd apps/web/src/sdk/vendor/percolator && ./scripts/print-slab-len.sh
#
# Use the printed values to update:
#   - sdk/config/devnet.ts (percolatorTiers.small.slabBytes, etc.)
#   - sdk/packages/percolator-sdk/src/instructions.ts (SLAB_TIERS[].bytes)
# so the app allocates the exact size the deployed program expects (avoids InvalidSlabLen).

set -e
[[ -f "$HOME/.cargo/env" ]] && source "$HOME/.cargo/env"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROG_DIR="$(cd "$SCRIPT_DIR/../percolator-prog" && pwd)"
cd "$PROG_DIR"

run_test() {
  local features="$1"
  cargo test test_struct_sizes --features "$features" --no-run 2>/dev/null
  cargo test test_struct_sizes --features "$features" -- --nocapture 2>&1 | grep "SLAB_LEN:" || true
}

echo "Building and running test for each tier to get SLAB_LEN..."
echo ""

echo "Small (max_accounts_256):"
run_test "devnet,small" || echo "  (run: cargo test test_struct_sizes --features devnet,small -- --nocapture)"

echo "Medium (max_accounts_1024):"
run_test "devnet,medium" || echo "  (run: cargo test test_struct_sizes --features devnet,medium -- --nocapture)"

echo "Large (default 4096):"
run_test "devnet" || echo "  (run: cargo test test_struct_sizes --features devnet -- --nocapture)"

echo ""
echo "Update sdk/config/devnet.ts and sdk/packages/percolator-sdk/src/instructions.ts"
echo "with the SLAB_LEN values above so slab account size matches the deployed program."
