# Percolator vendor (upstream)

Cloned from [aeyakovenko](https://github.com/aeyakovenko) for reference and ABI alignment.

| Repo | Description |
|------|-------------|
| **percolator-meta** | Meta repo, spec, program layout |
| **percolator** | Risk engine crate (withdrawal-window model) |
| **percolator-prog** | Solana program (InitMarket, TradeCpi, etc.) — [Devnet deployments](https://github.com/aeyakovenko/percolator-prog#devnet-deployments) in README |
| **percolator-match** | Passive LP matcher (50 bps spread) |

The app uses `@sov/percolator-sdk` for instruction building; its ABI lives inside the package and is kept in sync with this program ABI.
