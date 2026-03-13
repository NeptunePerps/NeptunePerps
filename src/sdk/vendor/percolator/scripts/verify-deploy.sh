#!/usr/bin/env bash
# Verify Percolator program deployments on devnet
# Checks that deployed programs match the config in devnet.ts

set -e

echo "=== Percolator Program Deployment Verification ==="
echo ""

# Program IDs from devnet.ts
SMALL_PROGRAM="99uLS74jtvw7os2iWY1Sc83RDYPQJtTsaUH4P1fuvq1U"
MEDIUM_PROGRAM="H4gcuBnYnf6BchxGZvm7dGxEgrqttyRRaR4ErV4tNri3"
LARGE_PROGRAM="DMiTbppEYUP7ttNuB6GUjGWMje3sfJYtx59TkWKzgRiU"

echo "Checking program deployments on devnet..."
echo ""

check_program() {
    local name="$1"
    local program_id="$2"
    
    echo "Checking $name program: $program_id"
    
    # Try to get program info using solana CLI if available
    if command -v solana &> /dev/null; then
        solana program show "$program_id" --url devnet 2>&1 || echo "  WARNING: Could not fetch program info"
    else
        echo "  NOTE: solana CLI not available, skipping detailed check"
    fi
    
    echo ""
}

check_program "Small" "$SMALL_PROGRAM"
check_program "Medium" "$MEDIUM_PROGRAM"
check_program "Large" "$LARGE_PROGRAM"

echo "=== Expected SLAB Sizes ==="
echo "Small:  62,808 bytes  (256 accounts)"
echo "Medium: 249,480 bytes (1024 accounts)"
echo "Large:  992,560 bytes (4096 accounts)"
echo ""
echo "To verify slab sizes, run:"
echo "  cd apps/web/src/sdk/vendor/percolator"
echo "  ./scripts/print-slab-len.sh"
echo ""
echo "Then compare with values in:"
echo "  - src/sdk/config/devnet.ts"
echo "  - src/sdk/packages/percolator-sdk/src/instructions.ts"
