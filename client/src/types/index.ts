export interface VaultState {
  balance: bigint;
  yieldEnabled: boolean;
  apy: number;
  earnings: bigint;
  vaultAge: number;
}

export interface BorrowState {
  availableBorrow: bigint;
  borrowedAmount: bigint;
  healthFactor: number;
  liquidationThreshold: number;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: bigint;
  currentAmount: bigint;
  targetDate?: Date;
  createdAt: Date;
}

export interface Challenge {
  id: string;
  owner: string;
  members: string[];
  target: bigint;
  frequency: "daily" | "weekly" | "monthly";
  duration: number;
  leaderboard: LeaderboardEntry[];
  streak: number;
}

export interface LeaderboardEntry {
  address: string;
  savedAmount: bigint;
  streak: number;
}

export type TxStatus = "idle" | "pending" | "confirming" | "confirmed" | "failed";

export interface TransactionRecord {
  id: string;
  type: "deposit" | "withdraw" | "borrow" | "repay" | "yield";
  amount: string;
  timestamp: Date;
  status: TxStatus;
  txHash?: string;
  error?: string;
}
