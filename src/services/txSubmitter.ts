import { Job } from "../types/index.js";

/**
 * TODO: Build, sign, and submit an execute_job Soroban transaction.
 * Returns the transaction hash.
 */
export async function submitExecuteJob(
  job: Job,
  _keeperSecret: string,
  _networkPassphrase: string,
  _horizonUrl: string
): Promise<string> {
  // Stub — implementation pending
  throw new Error(`submitExecuteJob not implemented for job ${job.jobId}`);
}
