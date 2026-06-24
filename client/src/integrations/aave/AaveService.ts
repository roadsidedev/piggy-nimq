import { type Address, type PublicClient, type TransactionReceipt, parseUnits, formatUnits, maxUint256 } from "viem";
import { AAVE_ABI, ERC20_ABI, INTEREST_RATE_MODE, POLYGON_MAINNET, POLYGON_AMOY } from "./constants";
import { createPublicViemClient, createWalletViemClient } from "./client";

export interface ReserveData {
  liquidityRate: bigint;
  variableBorrowRate: bigint;
  stableBorrowRate: bigint;
  aTokenAddress: Address;
}

export interface UserAccountData {
  totalCollateralBase: bigint;
  totalDebtBase: bigint;
  availableBorrowsBase: bigint;
  currentLiquidationThreshold: bigint;
  ltv: bigint;
  healthFactor: bigint;
}

export class AaveService {
  private publicClient: PublicClient;
  private useTestnet: boolean;

  constructor(useTestnet = false) {
    this.useTestnet = useTestnet;
    this.publicClient = createPublicViemClient(useTestnet);
  }

  getPoolAddress(): Address {
    return this.useTestnet ? POLYGON_AMOY.AAVE_POOL as Address : POLYGON_MAINNET.AAVE_POOL as Address;
  }

  getUsdcAddress(): Address {
    return this.useTestnet ? POLYGON_AMOY.USDC as Address : POLYGON_MAINNET.USDC as Address;
  }

  async getUsdcBalance(userAddress: Address): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.getUsdcAddress(),
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [userAddress],
    });
  }

  async getAUsdcBalance(userAddress: Address): Promise<bigint> {
    const reserve = await this.getReserveData();
    return this.publicClient.readContract({
      address: reserve.aTokenAddress,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [userAddress],
    });
  }

  async getDecimals(): Promise<number> {
    return this.publicClient.readContract({
      address: this.getUsdcAddress(),
      abi: ERC20_ABI,
      functionName: "decimals",
    });
  }

  private async getAccount(): Promise<Address> {
    const walletClient = createWalletViemClient(this.useTestnet);
    const addresses = await walletClient.getAddresses();
    const account = addresses[0];
    if (!account) {
      throw new Error("No account available from wallet");
    }
    return account;
  }

  private async writeContract(
    address: Address,
    abi: typeof AAVE_ABI | typeof ERC20_ABI,
    functionName: string,
    args: unknown[],
  ): Promise<`0x${string}`> {
    const walletClient = createWalletViemClient(this.useTestnet);
    const account = await this.getAccount();

    const hash = await walletClient.writeContract({
      account,
      address,
      abi,
      functionName: functionName as never,
      args: args as never,
    } as never);

    if (!hash) {
      throw new Error("Transaction submission returned no hash");
    }
    return hash;
  }

  async waitForTx(hash: `0x${string}`): Promise<TransactionReceipt> {
    return this.publicClient.waitForTransactionReceipt({ hash });
  }

  async approveUsdc(spender: Address, amount: bigint): Promise<`0x${string}`> {
    return this.writeContract(this.getUsdcAddress(), ERC20_ABI, "approve", [spender, amount]);
  }

  async approveUsdcMax(spender: Address): Promise<`0x${string}`> {
    return this.approveUsdc(spender, maxUint256);
  }

  async ensureAllowance(owner: Address, amount: bigint): Promise<`0x${string}` | null> {
    const currentAllowance = await this.getAllowance(owner);
    if (currentAllowance >= amount) return null;
    const hash = await this.approveUsdcMax(this.getPoolAddress());
    await this.waitForTx(hash);
    return hash;
  }

  async getAllowance(owner: Address): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.getUsdcAddress(),
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [owner, this.getPoolAddress()],
    });
  }

  async supply(amount: bigint, userAddress: Address): Promise<`0x${string}`> {
    return this.writeContract(this.getPoolAddress(), AAVE_ABI, "supply", [
      this.getUsdcAddress(), amount, userAddress, 0,
    ]);
  }

  async supplyWithAllowanceCheck(amount: bigint, userAddress: Address): Promise<{ approveHash: `0x${string}` | null; supplyHash: `0x${string}` }> {
    const approveHash = await this.ensureAllowance(userAddress, amount);
    const supplyHash = await this.supply(amount, userAddress);
    const receipt = await this.waitForTx(supplyHash);
    if (receipt.status !== "success") {
      throw new Error("Supply transaction failed on-chain");
    }
    return { approveHash, supplyHash };
  }

  async withdraw(amount: bigint, to: Address): Promise<`0x${string}`> {
    return this.writeContract(this.getPoolAddress(), AAVE_ABI, "withdraw", [
      this.getUsdcAddress(), amount, to,
    ]);
  }

  async withdrawWithConfirm(amount: bigint, to: Address): Promise<`0x${string}`> {
    const hash = await this.withdraw(amount, to);
    const receipt = await this.waitForTx(hash);
    if (receipt.status !== "success") {
      throw new Error("Withdraw transaction failed on-chain");
    }
    return hash;
  }

  async borrow(amount: bigint, userAddress: Address): Promise<`0x${string}`> {
    return this.writeContract(this.getPoolAddress(), AAVE_ABI, "borrow", [
      this.getUsdcAddress(), amount, INTEREST_RATE_MODE.VARIABLE, 0, userAddress,
    ]);
  }

  async borrowWithConfirm(amount: bigint, userAddress: Address): Promise<`0x${string}`> {
    const hash = await this.borrow(amount, userAddress);
    const receipt = await this.waitForTx(hash);
    if (receipt.status !== "success") {
      throw new Error("Borrow transaction failed on-chain");
    }
    return hash;
  }

  async repay(amount: bigint, userAddress: Address, useMax = false): Promise<`0x${string}`> {
    return this.writeContract(this.getPoolAddress(), AAVE_ABI, "repay", [
      this.getUsdcAddress(), useMax ? maxUint256 : amount, INTEREST_RATE_MODE.VARIABLE, userAddress,
    ]);
  }

  async repayWithConfirm(amount: bigint, userAddress: Address, useMax = false): Promise<`0x${string}`> {
    const hash = await this.repay(amount, userAddress, useMax);
    const receipt = await this.waitForTx(hash);
    if (receipt.status !== "success") {
      throw new Error("Repay transaction failed on-chain");
    }
    return hash;
  }

  async getUserAccountData(userAddress: Address): Promise<UserAccountData> {
    const data = await this.publicClient.readContract({
      address: this.getPoolAddress(),
      abi: AAVE_ABI,
      functionName: "getUserAccountData",
      args: [userAddress],
    });

    return {
      totalCollateralBase: data[0],
      totalDebtBase: data[1],
      availableBorrowsBase: data[2],
      currentLiquidationThreshold: data[3],
      ltv: data[4],
      healthFactor: data[5],
    };
  }

  async getReserveData(): Promise<ReserveData> {
    const data = await this.publicClient.readContract({
      address: this.getPoolAddress(),
      abi: AAVE_ABI,
      functionName: "getReserveData",
      args: [this.getUsdcAddress()],
    });

    return {
      liquidityRate: data[4] as bigint,
      variableBorrowRate: data[5] as bigint,
      stableBorrowRate: data[6] as bigint,
      aTokenAddress: data[9] as Address,
    };
  }

  getLiquidityRatePercent(liquidityRate: bigint): number {
    return Number(liquidityRate) / 1e25;
  }

  getVariableBorrowRatePercent(variableBorrowRate: bigint): number {
    return Number(variableBorrowRate) / 1e25;
  }

  toUSDC(amount: string, decimals: number): bigint {
    return parseUnits(amount, decimals);
  }

  fromUSDC(amount: bigint, decimals: number): string {
    return formatUnits(amount, decimals);
  }
}

export const aaveService = new AaveService(true);
