# Multi-Repo Integration Plan

## The Four Repos

| Repo | Language | Role |
|---|---|---|
| `sorobanchron-contracts` | Rust / Soroban | On-chain job registry — stores jobs, pays keeper rewards |
| `sorobanchron-keeper` | TypeScript | Off-chain daemon — polls ledger, triggers `execute_job` |
| `sorobanchron-frontend` | TypeScript / React | UI — lets users register and monitor scheduled jobs |
| `vero-core-contracts` | Rust / Soroban | On-chain PR verification — Guardian consensus, reward streams |

---

## How They Connect

```
┌─────────────────────┐        register_job()        ┌──────────────────────────┐
│  sorobanchron-      │ ───────────────────────────► │  sorobanchron-contracts  │
│  frontend           │                               │  (Soroban job registry)  │
│  (React/TS UI)      │ ◄─────── job list / status ── │                          │
└─────────────────────┘                               └──────────┬───────────────┘
                                                                 │
                                                    job becomes active
                                                    (activeLedger reached)
                                                                 │
                                                                 ▼
┌─────────────────────┐    execute_job(jobId)        ┌──────────────────────────┐
│  sorobanchron-      │ ───────────────────────────► │  sorobanchron-contracts  │
│  keeper             │                               │  execute_job entry point │
│  (this repo)        │ ◄─────────── tx hash / fee ── │  ──► keeper reward paid  │
└─────────────────────┘                               └──────────────────────────┘
         │
         │  (optional) record_failure() on error
         ▼
┌─────────────────────┐
│  vero-core-         │
│  contracts          │
│  (circuit breaker / │
│   Guardian votes)   │
└─────────────────────┘
```

---

## Linkage Details

### keeper → sorobanchron-contracts
- **How:** `submitExecuteJob` in `src/services/txSubmitter.ts` calls `execute_job(job_id)` on the deployed contract address (`CONTRACT_ID` env var).
- **What you need:** The deployed contract address from `sorobanchron-contracts` after `soroban contract deploy`.
- **Config:**
  ```
  CONTRACT_ID=C...   # from sorobanchron-contracts deployment
  ```

### keeper → vero-core-contracts (optional circuit breaker)
- **How:** On repeated `tx_bad_auth` or `op_already_exists` errors, the keeper can call `record_failure()` on the Vero contract to increment the circuit breaker counter.
- **What you need:** Vero contract address.
- **Config:**
  ```
  VERO_CONTRACT_ID=C...   # from vero-core-contracts deployment
  ```

### frontend → sorobanchron-contracts
- **How:** The frontend calls `register_job` and reads job state directly via Soroban RPC.
- **Shared artifact:** ABI / contract bindings generated from `sorobanchron-contracts` WASM.

### frontend → keeper (indirect)
- No direct call. The frontend writes jobs on-chain; the keeper reads them. They are decoupled by the contract.

---

## Local Development Order

```
1. sorobanchron-contracts   →  cargo build + soroban contract deploy (testnet)
                                └─ copy CONTRACT_ID

2. vero-core-contracts      →  cargo build + soroban contract deploy (testnet)
                                └─ copy VERO_CONTRACT_ID

3. sorobanchron-keeper      →  cp .env.example .env
                                fill CONTRACT_ID, KEEPER_SECRET
                                yarn install && yarn dev

4. sorobanchron-frontend    →  fill CONTRACT_ID from step 1
                                yarn install && yarn dev
```

## Docker (keeper only)

```bash
docker build -t sorobanchron-keeper .
docker run --env-file .env sorobanchron-keeper
```

To run the full stack together, add a `docker-compose.yml` at the monorepo root once all four repos are co-located.

---

## Environment Variables Summary

| Var | Set in | Sourced from |
|---|---|---|
| `CONTRACT_ID` | keeper `.env` | `sorobanchron-contracts` deploy output |
| `VERO_CONTRACT_ID` | keeper `.env` | `vero-core-contracts` deploy output |
| `KEEPER_SECRET` | keeper `.env` | New Stellar keypair (`soroban keys generate`) |
| `HORIZON_URL` | keeper `.env` | Testnet or mainnet Horizon endpoint |
| `NETWORK_PASSPHRASE` | keeper `.env` | Matches the network used to deploy contracts |
