# SorobanChron Keeper Bot 🤖

The competitive execution engine. This node listens to Stellar ledger sequences, tracks when registered jobs become active, and races to trigger executions to earn fee rewards.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      sorobanchron-keeper                         │
│                                                                  │
│  main() ──► tick() loop                                          │
│    │                                                             │
│    ├── getLatestLedger(horizonUrl)                               │
│    │     └── Horizon REST  ──► LedgerInfo { sequence, closedAt } │
│    │                                                             │
│    ├── filterReadyJobs(jobs, sequence)                           │
│    │     └── job.activeLedger <= sequence ──► Job[]              │
│    │                                                             │
│    └── submitExecuteJob(job, secret, passphrase, horizonUrl)     │
│          ├── Keypair.fromSecret(KEEPER_SECRET)                   │
│          ├── TransactionBuilder                                  │
│          │     └── invokeContractFunction("execute_job", jobId)  │
│          └── server.submitTransaction(tx) ──► tx hash            │
│                                                                  │
│  Config ◄── .env                                                 │
│    KEEPER_SECRET · CONTRACT_ID · HORIZON_URL                     │
│    NETWORK_PASSPHRASE · POLL_INTERVAL_MS                         │
└──────────────────────────────────────────────────────────────────┘
                              │ Soroban RPC / Horizon
              ┌───────────────┴──────────────┐
              │      SorobanChron Contract   │
              │  execute_job(job_id)         │
              │  ──► reward ──► keeper wallet│
              └──────────────────────────────┘
```

## Flow

1. Daemon starts and loads config from `.env`.
2. Every `POLL_INTERVAL_MS` (default 5 s) it calls Horizon for the latest ledger sequence.
3. Any job in the local registry whose `activeLedger ≤ currentLedger` is considered **ready**.
4. For each ready job the daemon builds a Soroban `execute_job` transaction, signs it with `KEEPER_SECRET`, and submits it.
5. Successfully executed jobs are removed from the registry; failed submissions are logged and retried on the next tick.

## Modules

| Module | Responsibility |
|---|---|
| `src/index.ts` | Main daemon loop, config loading, orchestration |
| `src/services/ledgerStream.ts` | Fetch latest ledger from Horizon; filter ready jobs |
| `src/services/txSubmitter.ts` | Build, sign, and submit `execute_job` transactions |
| `src/types/index.ts` | Shared types: `Job`, `LedgerInfo`, `KeeperConfig` |

## Quick Start

**Prerequisites**
```
node >= 20
yarn
```

**Install**
```bash
yarn install
```

**Configure**
```bash
cp .env.example .env
# fill in KEEPER_SECRET and CONTRACT_ID
```

**Run**
```bash
yarn start        # compiled JS
yarn dev          # ts-node (development)
```

## Code Snippets

**Types**
```typescript
export interface Job {
  jobId: string;
  contractId: string;   // Soroban contract address
  activeLedger: number; // becomes executable at this ledger sequence
}
```

**Poll the latest ledger**
```typescript
import { getLatestLedger } from "./services/ledgerStream";

const { sequence, closedAt } = await getLatestLedger(horizonUrl);
// sequence: 54321, closedAt: "2026-06-19T13:10:00Z"
```

**Filter jobs that are ready to execute**
```typescript
import { filterReadyJobs } from "./services/ledgerStream";

const ready = filterReadyJobs(jobRegistry, sequence);
// returns jobs where job.activeLedger <= sequence
```

**Submit an execution transaction**
```typescript
import { submitExecuteJob } from "./services/txSubmitter";

const txHash = await submitExecuteJob(
  job,
  process.env.KEEPER_SECRET!,
  "Test SDF Network ; September 2015",
  "https://horizon-testnet.stellar.org"
);
console.log("executed →", txHash);
```

**Main daemon loop**
```typescript
while (true) {
  const { sequence } = await getLatestLedger(config.horizonUrl);
  const ready = filterReadyJobs(jobRegistry, sequence);
  await Promise.allSettled(ready.map((job) => submitExecuteJob(job, ...)));
  await sleep(config.pollIntervalMs);
}
```

## Storage Design

All runtime state is in-process. The keeper is stateless between restarts — it re-fetches the current ledger on each tick and rebuilds the job list from the on-chain registry.

```typescript
// KeeperConfig — loaded once from .env
interface KeeperConfig {
  horizonUrl: string;         // Horizon endpoint
  networkPassphrase: string;  // Stellar network passphrase
  keeperSecret: string;       // Ed25519 seed (never logged)
  contractId: string;         // SorobanChron registry contract
  pollIntervalMs: number;     // polling cadence
}

// Job — sourced from on-chain registry
interface Job {
  jobId: string;        // unique job identifier
  contractId: string;   // target Soroban contract
  activeLedger: number; // earliest executable ledger
}
```

## Error Codes

| Code | Meaning | Handling |
|---|---|---|
| `tx_bad_auth` | `KEEPER_SECRET` keypair not authorised on-chain | Check contract ACL |
| `op_already_exists` | Another keeper executed the job first | Log and discard — race expected |
| `tx_insufficient_fee` | Base fee too low during surge pricing | Increase `BASE_FEE` or use fee bump |
| `horizon_connection` | Horizon unreachable | Retry on next tick |
| `missing_env` | `KEEPER_SECRET` or `CONTRACT_ID` not set | Daemon exits immediately with error |

## Linkage

**To Contracts:** Uses `@stellar/stellar-sdk` to build and sign `invokeContractFunction` transactions targeting the SorobanChron on-chain registry. The contract verifies the caller, executes the scheduled job, and pays the keeper a fee reward.

## License

Apache-2.0
