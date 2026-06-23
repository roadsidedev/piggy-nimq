import { config } from "@/config/env";

export const POLYGON_MAINNET = {
  CHAIN_ID: 137,
  RPC_URL: config.rpc.polygon,
  AAVE_POOL: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
  USDC: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  AAVE_POOL_DATA_PROVIDER: "0x69eE097F950Dc98eBdA62d8E3A5Bf0b0cA1dF3a1",
};

export const POLYGON_AMOY = {
  CHAIN_ID: 80002,
  RPC_URL: config.rpc.polygonAmoy,
  AAVE_POOL: "0x7626DDe8177D83D1fE4E1aF3842D6E1BBc1B4d9C",
  USDC: "0x41e94EB019C4542b49Ff39b7EA35CD5cB47b3c8B",
};

export const AAVE_ABI = [
  {
    type: "function",
    name: "supply",
    inputs: [
      { name: "asset", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "onBehalfOf", type: "address", internalType: "address" },
      { name: "referralCode", type: "uint16", internalType: "uint16" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [
      { name: "asset", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "to", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "borrow",
    inputs: [
      { name: "asset", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "interestRateMode", type: "uint256", internalType: "uint256" },
      { name: "referralCode", type: "uint16", internalType: "uint16" },
      { name: "onBehalfOf", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "repay",
    inputs: [
      { name: "asset", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "interestRateMode", type: "uint256", internalType: "uint256" },
      { name: "onBehalfOf", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getUserAccountData",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [
      { name: "totalCollateralBase", type: "uint256", internalType: "uint256" },
      { name: "totalDebtBase", type: "uint256", internalType: "uint256" },
      { name: "availableBorrowsBase", type: "uint256", internalType: "uint256" },
      { name: "currentLiquidationThreshold", type: "uint256", internalType: "uint256" },
      { name: "ltv", type: "uint256", internalType: "uint256" },
      { name: "healthFactor", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getReserveData",
    inputs: [{ name: "asset", type: "address", internalType: "address" }],
    outputs: [
      { name: "unused", type: "uint256", internalType: "uint256" },
      { name: "configuration", type: "uint256", internalType: "uint256" },
      { name: "liquidityIndex", type: "uint128", internalType: "uint128" },
      { name: "variableBorrowIndex", type: "uint128", internalType: "uint128" },
      { name: "currentLiquidityRate", type: "uint128", internalType: "uint128" },
      { name: "currentVariableBorrowRate", type: "uint128", internalType: "uint128" },
      { name: "currentStableBorrowRate", type: "uint128", internalType: "uint128" },
      { name: "lastUpdateTimestamp", type: "uint40", internalType: "uint40" },
      { name: "id", type: "uint16", internalType: "uint16" },
      { name: "aTokenAddress", type: "address", internalType: "address" },
      { name: "stableDebtTokenAddress", type: "address", internalType: "address" },
      { name: "variableDebtTokenAddress", type: "address", internalType: "address" },
      { name: "interestRateStrategyAddress", type: "address", internalType: "address" },
      { name: "accruedToTreasury", type: "uint128", internalType: "uint128" },
    ],
    stateMutability: "view",
  },
] as const;

export const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "spender", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8", internalType: "uint8" }],
    stateMutability: "view",
  },
] as const;

export const INTEREST_RATE_MODE = {
  STABLE: 1n,
  VARIABLE: 2n,
} as const;
