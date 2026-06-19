import { Job } from "../types/index.js";

/**
 * Builds, signs, and submits an execute_job Soroban transaction for the given job.
 * @param job - the job to execute
 * @param _keeperSecret - Ed25519 seed phrase of the keeper wallet
 * @param _networkPassphrase - Stellar network passphrase
 * @param _horizonUrl - Horizon REST endpoint
 * @returns transaction hash on success
 * @todo implement with SorobanRpc simulation + TransactionBuilder
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
