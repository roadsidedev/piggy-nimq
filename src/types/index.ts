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

export interface Transaction {
  id: string;
  type: "deposit" | "withdraw" | "borrow" | "repay" | "yield";
  amount: bigint;
  timestamp: Date;
  status: "pending" | "confirming" | "confirmed" | "failed";
  txHash?: string;
}
