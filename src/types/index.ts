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
