import { Horizon } from "@stellar/stellar-sdk";
import { Job, LedgerInfo } from "../types/index.js";

/**
 * Fetches the most recent ledger sequence and close time from Stellar Horizon.
 * @throws if Horizon returns no records or the request fails
 */
export async function getLatestLedger(horizonUrl: string): Promise<LedgerInfo> {
  const server = new Horizon.Server(horizonUrl);
  const { records } = await server.ledgers().order("desc").limit(1).call();
  const record = records[0];
  if (!record) throw new Error("Horizon returned no ledger records");
  return { sequence: record.sequence, closedAt: record.closed_at };
}

export function filterReadyJobs(jobs: Job[], currentLedger: number): Job[] {
  return jobs.filter((j) => j.activeLedger <= currentLedger);
}
