import "dotenv/config";
import { getLatestLedger, filterReadyJobs } from "./services/ledgerStream.js";
import { submitExecuteJob } from "./services/txSubmitter.js";
import { Job, KeeperConfig } from "./types/index.js";

const config: KeeperConfig = {
  horizonUrl: process.env.HORIZON_URL ?? "https://horizon-testnet.stellar.org",
  networkPassphrase: process.env.NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015",
  keeperSecret: process.env.KEEPER_SECRET ?? "",
  contractId: process.env.CONTRACT_ID ?? "",
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS ?? 5000),
};

if (!config.keeperSecret || !config.contractId) {
  console.error("missing_env: KEEPER_SECRET and CONTRACT_ID must be set");
  process.exit(1);
}

// TODO: populate from on-chain registry query
const jobRegistry: Job[] = [];

async function tick(): Promise<void> {
  const { sequence, closedAt } = await getLatestLedger(config.horizonUrl);
  console.log(`[${closedAt}] ledger #${sequence}`);

  const ready = filterReadyJobs(jobRegistry, sequence);
  if (!ready.length) return;

  await Promise.allSettled(
    ready.map(async (job) => {
      try {
        const hash = await submitExecuteJob(job, config.keeperSecret, config.networkPassphrase, config.horizonUrl);
        console.log(`✓ job ${job.jobId} → ${hash}`);
        jobRegistry.splice(jobRegistry.indexOf(job), 1);
      } catch (err) {
        console.error(`✗ job ${job.jobId}:`, (err as Error).message);
      }
    })
  );
}

async function main(): Promise<void> {
  console.log("sorobanchron-keeper starting…");
  while (true) {
    await tick().catch((err: Error) => console.error("tick:", err.message));
    await new Promise((r) => setTimeout(r, config.pollIntervalMs));
  }
}

main();
