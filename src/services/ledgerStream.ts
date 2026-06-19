import { Horizon } from "@stellar/stellar-sdk";
import { Job, LedgerInfo } from "../types/index.js";

export async function getLatestLedger(horizonUrl: string): Promise<LedgerInfo> {
  const server = new Horizon.Server(horizonUrl);
  const { records } = await server.ledgers().order("desc").limit(1).call();
  return { sequence: records[0].sequence, closedAt: records[0].closed_at };
}

export function filterReadyJobs(jobs: Job[], currentLedger: number): Job[] {
  return jobs.filter((j) => j.activeLedger <= currentLedger);
}
