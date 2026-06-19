# Contributing to sorobanchron-keeper

## Ecosystem Repos

This repo is one of three that form the full SorobanChron protocol. They are **designed to work together** — changes in one often require coordination with another.

| Repo | What it does | Link |
|---|---|---|
| `sorobanchron-contracts` | On-chain Soroban job registry, reward payouts | [→ repo](https://github.com/Soroban-Chron/sorobanchron-contracts) |
| `sorobanchron-keeper` | Off-chain daemon — you are here | [→ repo](https://github.com/Soroban-Chron/sorobanchron-keeper) |
| `sorobanchron-frontend` | Next.js dApp UI for registering and monitoring jobs | [→ repo](https://github.com/Soroban-Chron/sorobanchron-frontend) |

## How They Link

```
sorobanchron-contracts  ──►  deploys CONTRACT_ID
        │                         │
        │                         ▼
        │              sorobanchron-keeper
        │              reads CONTRACT_ID from .env
        │              calls execute_job() on-chain
        │
        └──────────────sorobanchron-frontend
                       reads CONTRACT_ID from env
                       calls register_job() via Freighter
```

## Integration Points

### keeper ↔ contracts
- `CONTRACT_ID` in keeper `.env` must match the deployed contract from `sorobanchron-contracts`
- The keeper calls `execute_job(job_id)` — that entry point must exist in `src/lib.rs`
- To generate TypeScript bindings from the contract WASM:
  ```bash
  soroban contract bindings ts \
    --wasm ../sorobanchron-contracts/target/wasm32-unknown-unknown/release/sorobanchron_contracts.wasm \
    --out ./src/bindings
  ```

### keeper ↔ frontend (indirect)
- Both read from the same on-chain registry — no direct API between them
- The `Job` type in `src/types/index.ts` (this repo) should stay in sync with `src/types/index.ts` in the frontend repo

## Open Issues (60% remaining)

| Issue | Affects |
|---|---|
| Implement `submitExecuteJob` with Soroban RPC simulation | keeper + contracts |
| Fetch live job list from on-chain registry | keeper + contracts |
| Add fee-bump for surge pricing | keeper |
| Graceful SIGINT/SIGTERM shutdown | keeper |
| SorobanRpc simulation step before submission | keeper + contracts |
| Unit tests for `filterReadyJobs` and `ledgerStream` | keeper |
