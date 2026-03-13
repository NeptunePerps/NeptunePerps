# Fork / Upstream Provenance

## Vendor (Upstream — aeyakovenko)

Cloned from official Percolator repos:

- `vendor/percolator/percolator-meta` — Meta repo (spec, program layout)
- `vendor/percolator/percolator` — Risk engine crate ([aeyakovenko/percolator](https://github.com/aeyakovenko/percolator))
- `vendor/percolator/percolator-prog` — Solana program ([aeyakovenko/percolator-prog](https://github.com/aeyakovenko/percolator-prog))
- `vendor/percolator/percolator-match` — Passive LP matcher ([aeyakovenko/percolator-match](https://github.com/aeyakovenko/percolator-match))

## App / SDK

- **SOV** is a frontend + wrapper. No modifications to vendor Rust.
- `packages/percolator-sdk`: TypeScript ABI (instruction encoding, accounts, slab parsing) lives inside the package; compatible with upstream program ABI.
- `config/devnet.ts`: Program IDs and slab size point to upstream devnet (Percolator `46iB4ET4Wpqf...`, Matcher `4HcGCsyjAqnFua5ccuXyt8KRRQzKFbGTJkVChpS7Yfzy`).
- `packages/proof`: TX parsing, program inspection, receipts (net-new).

## Upstream links

- [aeyakovenko/percolator](https://github.com/aeyakovenko/percolator) — Core risk engine
- [aeyakovenko/percolator-prog](https://github.com/aeyakovenko/percolator-prog) — Solana program (devnet deployments in README)
- [aeyakovenko/percolator-match](https://github.com/aeyakovenko/percolator-match) — Passive matcher
- [aeyakovenko/percolator-meta](https://github.com/aeyakovenko/percolator-meta) — Meta/spec
