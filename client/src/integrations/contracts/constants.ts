import { config } from "@/config/env";

// ─── Deployed contract addresses (Polygon Amoy) ─────────────────────────
export const PIGGY_CONTRACTS = {
  vault: "0x7008DCE2C72F2eb70A7179a2b400A1177a32FA6B" as const,
  goalManager: "0xa0826186E560DA3836621A16a2069a691D9fd234" as const,
  challengeManager: "0x678Ddf520766BD754c8af43802C0bdD2f2CeC253" as const,
  adapter: "0x196064333Efd80c06D0406ab49a4A756B4Ef2f44" as const,
  usdt: "0x95dFf7AF6FE38a2cF6F3448B829Dc278Ae33873e" as const,
  faucet: "0x4bD93bB444A9335cBFB52d9459a478C68F7DCe4B" as const,
} as const;

export const RPC_URL = config.rpc.polygonAmoy;
export const CHAIN_ID = 80002;

// ─── PiggyVault ABI ─────────────────────────────────────────────────────
export const PIGGY_VAULT_ABI = [
  {
    type: "function",
    name: "deposit",
    inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deposit",
    inputs: [
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "challengeId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "enableYield",
    inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "disableYield",
    inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "disableAllYield",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawFromYield",
    inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "received", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawAllYield",
    inputs: [],
    outputs: [{ name: "received", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "borrow",
    inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "repay",
    inputs: [
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "fromIdleBalance_", type: "bool", internalType: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "repayAllDebt",
    inputs: [{ name: "fromIdleBalance_", type: "bool", internalType: "bool" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allocateToGoal",
    inputs: [
      { name: "goalId", type: "uint256", internalType: "uint256" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deallocateFromGoal",
    inputs: [
      { name: "goalId", type: "uint256", internalType: "uint256" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawFromGoal",
    inputs: [
      { name: "goalId", type: "uint256", internalType: "uint256" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setRecurringSchedule",
    inputs: [
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "intervalSeconds", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancelRecurringSchedule",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // ─── Views ──────────────────────────────────────────────────────────
  {
    type: "function",
    name: "getUserPosition",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [
      { name: "idle", type: "uint256", internalType: "uint256" },
      { name: "unallocated", type: "uint256", internalType: "uint256" },
      { name: "yieldValue", type: "uint256", internalType: "uint256" },
      { name: "debtValue", type: "uint256", internalType: "uint256" },
      { name: "allocatedToGoals", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "idleBalance",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "unallocatedIdleBalance",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "yieldValueOf",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "debtValueOf",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "maxBorrowable",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "supplyShares",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "asset",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract IERC20" }],
    stateMutability: "view",
  },
] as const;

// ─── PiggyGoalManager ABI ───────────────────────────────────────────────
export const PIGGY_GOAL_MANAGER_ABI = [
  {
    type: "function",
    name: "createGoal",
    inputs: [
      { name: "user", type: "address", internalType: "address" },
      { name: "targetAmount", type: "uint256", internalType: "uint256" },
      { name: "targetDate", type: "uint64", internalType: "uint64" },
      { name: "name", type: "string", internalType: "string" },
    ],
    outputs: [{ name: "goalId", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allocateToGoal",
    inputs: [
      { name: "user", type: "address", internalType: "address" },
      { name: "goalId", type: "uint256", internalType: "uint256" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "closeGoal",
    inputs: [
      { name: "user", type: "address", internalType: "address" },
      { name: "goalId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getGoal",
    inputs: [
      { name: "user", type: "address", internalType: "address" },
      { name: "goalId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct IGoalManager.GoalInfo",
        components: [
          { name: "targetAmount", type: "uint256", internalType: "uint256" },
          { name: "targetDate", type: "uint64", internalType: "uint64" },
          { name: "allocated", type: "uint256", internalType: "uint256" },
          { name: "active", type: "bool", internalType: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalAllocated",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nextGoalId",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
] as const;

// ─── PiggyChallengeManager ABI ──────────────────────────────────────────
export const PIGGY_CHALLENGE_MANAGER_ABI = [
  {
    type: "function",
    name: "createChallenge",
    inputs: [
      { name: "name", type: "string", internalType: "string" },
      { name: "targetAmount", type: "uint256", internalType: "uint256" },
      { name: "durationDays", type: "uint256", internalType: "uint256" },
      { name: "frequency", type: "uint8", internalType: "enum IChallengeManager.Frequency" },
      { name: "maxMembers", type: "uint256", internalType: "uint256" },
      { name: "isPublic", type: "bool", internalType: "bool" },
    ],
    outputs: [{ name: "challengeId", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "joinChallenge",
    inputs: [{ name: "challengeId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "leaveChallenge",
    inputs: [{ name: "challengeId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "recordProgress",
    inputs: [
      { name: "user", type: "address", internalType: "address" },
      { name: "challengeId", type: "uint256", internalType: "uint256" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "endChallenge",
    inputs: [{ name: "challengeId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "addMember",
    inputs: [
      { name: "challengeId", type: "uint256", internalType: "uint256" },
      { name: "member", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getChallenge",
    inputs: [{ name: "challengeId", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "name", type: "string", internalType: "string" },
      { name: "targetAmount", type: "uint256", internalType: "uint256" },
      { name: "durationDays", type: "uint256", internalType: "uint256" },
      { name: "startDate", type: "uint64", internalType: "uint64" },
      { name: "endDate", type: "uint64", internalType: "uint64" },
      { name: "frequency", type: "uint8", internalType: "enum IChallengeManager.Frequency" },
      { name: "isActive", type: "bool", internalType: "bool" },
      { name: "isPublic", type: "bool", internalType: "bool" },
      { name: "maxMembers", type: "uint256", internalType: "uint256" },
      { name: "owner", type: "address", internalType: "address" },
      { name: "memberCount", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getMemberProgress",
    inputs: [
      { name: "challengeId", type: "uint256", internalType: "uint256" },
      { name: "member", type: "address", internalType: "address" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct IChallengeManager.MemberProgress",
        components: [
          { name: "isMember", type: "bool", internalType: "bool" },
          { name: "totalSaved", type: "uint96", internalType: "uint96" },
          { name: "lastActivity", type: "uint40", internalType: "uint40" },
          { name: "currentStreak", type: "uint16", internalType: "uint16" },
          { name: "longestStreak", type: "uint16", internalType: "uint16" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getLeaderboard",
    inputs: [{ name: "challengeId", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "members", type: "address[]", internalType: "address[]" },
      {
        name: "progress",
        type: "tuple[]",
        internalType: "struct IChallengeManager.MemberProgress[]",
        components: [
          { name: "isMember", type: "bool", internalType: "bool" },
          { name: "totalSaved", type: "uint96", internalType: "uint96" },
          { name: "lastActivity", type: "uint40", internalType: "uint40" },
          { name: "currentStreak", type: "uint16", internalType: "uint16" },
          { name: "longestStreak", type: "uint16", internalType: "uint16" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserChallenges",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "challengeCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
] as const;
