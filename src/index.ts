import "dotenv/config";
import { Keypair } from "@stellar/stellar-sdk";
import { getLatestLedger, filterReadyJobs } from "./services/ledgerStream.js";
import { submitExecuteJob } from "./services/txSubmitter.js";
import { sleep } from "./utils.js";
import { Job, KeeperConfig, DEFAULT_HORIZON_URL, DEFAULT_NETWORK_PASSPHRASE, DEFAULT_POLL_INTERVAL_MS } from "./types/index.js";

const config: KeeperConfig = {
  horizonUrl: process.env.HORIZON_URL ?? DEFAULT_HORIZON_URL,
  networkPassphrase: process.env.NETWORK_PASSPHRASE ?? DEFAULT_NETWORK_PASSPHRASE,
  keeperSecret: process.env.KEEPER_SECRET ?? "",
  contractId: process.env.CONTRACT_ID ?? "",
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS ?? DEFAULT_POLL_INTERVAL_MS),
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
  console.log("keeper public key:", Keypair.fromSecret(config.keeperSecret).publicKey());
  process.on("SIGINT", () => {
    console.log("\nshutdown signal received — exiting cleanly");
    process.exit(0);
  });
  while (true) {
    await tick().catch((err: Error) => console.error("tick:", err.message));
    await sleep(config.pollIntervalMs);
  }
}

main();
