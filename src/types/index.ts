export const DEFAULT_HORIZON_URL = "https://horizon-testnet.stellar.org";
export const DEFAULT_NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const DEFAULT_POLL_INTERVAL_MS = 5000;

export interface Job {
  jobId: string;
  contractId: string;
  activeLedger: number;
}

export interface LedgerInfo {
  sequence: number;
  closedAt: string;
}

export interface KeeperConfig {
  horizonUrl: string;
  networkPassphrase: string;
  keeperSecret: string;
  contractId: string;
  pollIntervalMs: number;
}

export type KeeperErrorCode =
  | "tx_bad_auth"
  | "op_already_exists"
  | "tx_insufficient_fee"
  | "horizon_connection"
  | "missing_env";

export class KeeperError extends Error {
  constructor(public readonly code: KeeperErrorCode, message: string) {
    super(message);
    this.name = "KeeperError";
  }
}
