export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

export type TxStatus = "idle" | "pending" | "confirming" | "confirmed" | "failed";

export type RecurringFrequency = "weekly" | "monthly";

export type ChallengeFrequency = "daily" | "weekly" | "monthly";

export type TransactionType = "deposit" | "withdraw" | "borrow" | "repay" | "yield";

export type GasStrategy = "native" | "paymaster" | "fallback";

// ─── API Types ───────────────────────────────────────────────

export interface NimiqProfile {
  name?: string;
  address: string;
  avatarUrl?: string;
}

export interface TransactionRecord {
  id: string;
  type: TransactionType;
  amount: string;
  timestamp: string;
  status: TxStatus;
  txHash?: string;
  error?: string;
}

// ─── Auth Types ──────────────────────────────────────────────

export interface AuthNonceResponse {
  nonce: string;
  message: string;
}

export interface AuthVerifyRequest {
  address: string;
  signature: string;
  nonce: string;
}

export interface AuthVerifyResponse {
  token: string;
  address: string;
  user: UserProfile;
}

export interface UserProfile {
  address: string;
  nimiqAddress?: string;
  displayName?: string;
  createdAt: string;
  lastSeenAt: string;
}

// ─── Goals Types ─────────────────────────────────────────────

export interface Goal {
  id: string;
  userAddress: string;
  title: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalRequest {
  title: string;
  targetAmount: string;
  targetDate?: string;
}

export interface UpdateGoalRequest {
  title?: string;
  targetAmount?: string;
  targetDate?: string;
}

export interface AllocateFundsRequest {
  amount: string;
}

export interface TransferFundsRequest {
  toGoalId: string;
  amount: string;
}

// ─── Challenges Types ────────────────────────────────────────

export interface Challenge {
  id: string;
  ownerAddress: string;
  title: string;
  target: string;
  frequency: ChallengeFrequency;
  duration: number;
  streak: number;
  inviteCode: string;
  createdAt: string;
  members?: ChallengeMember[];
}

export interface ChallengeMember {
  userAddress: string;
  savedAmount: string;
  joinedAt: string;
  displayName?: string;
}

export interface CreateChallengeRequest {
  title: string;
  target: string;
  frequency: ChallengeFrequency;
  duration: number;
}

export interface UpdateProgressRequest {
  amount: string;
}

// ─── Recurring Types ─────────────────────────────────────────

export interface RecurringSchedule {
  id: string;
  userAddress: string;
  amount: string;
  frequency: RecurringFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  goalId?: string;
  paused: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
}

export interface CreateRecurringRequest {
  amount: string;
  frequency: RecurringFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  goalId?: string;
}

export interface UpdateRecurringRequest {
  amount?: string;
  frequency?: RecurringFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  goalId?: string;
}

// ─── Analytics Types ─────────────────────────────────────────

export type AnalyticsEventType =
  | "deposit"
  | "withdraw"
  | "borrow"
  | "repay"
  | "goal_created"
  | "challenge_joined"
  | "yield_toggled"
  | "recurring_created"
  | "wallet_connected";

export interface AnalyticsEvent {
  event: AnalyticsEventType;
  data?: Record<string, unknown>;
  timestamp: string;
  url: string;
}

export interface ErrorLogEntry {
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: Record<string, unknown>;
  timestamp: string;
}

// ─── API Response Types ──────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
