import { type Address, type PublicClient, type TransactionReceipt, createPublicClient, createWalletClient, custom, http, parseUnits, formatUnits, maxUint256 } from "viem";
import { polygonAmoy } from "viem/chains";
import { PIGGY_CONTRACTS, PIGGY_VAULT_ABI, RPC_URL } from "./constants";
import { ERC20_ABI } from "@/integrations/aave/constants";
import { getEthereumProvider } from "@/integrations/nimiq";
import { ensureCorrectChain } from "@/integrations/wallet/chain";

export interface UserPosition {
  idle: bigint;
  unallocated: bigint;
  yieldValue: bigint;
  debtValue: bigint;
  allocatedToGoals: bigint;
}

export class PiggyVaultService {
  private publicClient: PublicClient;

  constructor() {
    this.publicClient = createPublicClient({
      chain: polygonAmoy,
      transport: http(RPC_URL),
    }) as unknown as PublicClient;
  }

  getVaultAddress(): Address {
    return PIGGY_CONTRACTS.vault as Address;
  }

  getAssetAddress(): Address {
    return PIGGY_CONTRACTS.usdt as Address;
  }

  // ─── Read ──────────────────────────────────────────────────────────────

  async getUserPosition(user: Address): Promise<UserPosition> {
    const data = await this.publicClient.readContract({
      address: this.getVaultAddress(),
      abi: PIGGY_VAULT_ABI,
      functionName: "getUserPosition",
      args: [user],
    }) as readonly [bigint, bigint, bigint, bigint, bigint];
    return {
      idle: data[0],
      unallocated: data[1],
      yieldValue: data[2],
      debtValue: data[3],
      allocatedToGoals: data[4],
    };
  }

  async getUnallocatedIdleBalance(user: Address): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.getVaultAddress(),
      abi: PIGGY_VAULT_ABI,
      functionName: "unallocatedIdleBalance",
      args: [user],
    }) as Promise<bigint>;
  }

  async getDecimals(): Promise<number> {
    return this.publicClient.readContract({
      address: this.getAssetAddress(),
      abi: ERC20_ABI,
      functionName: "decimals",
    }) as Promise<number>;
  }

  async getAllowance(owner: Address): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.getAssetAddress(),
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [owner, this.getVaultAddress()],
    }) as Promise<bigint>;
  }

  // ─── Chain helpers ─────────────────────────────────────────────────────

  private async ensureCorrectChain(): Promise<void> {
    await ensureCorrectChain();
  }

  // ─── Write helpers ─────────────────────────────────────────────────────

  private async getAccount(): Promise<Address> {
    const provider = getEthereumProvider();
    if (!provider) throw new Error("No EVM provider available");
    const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
    if (!accounts.length) throw new Error("No accounts available");
    return accounts[0] as Address;
  }

  private async estimateGas(
    address: `0x${string}`,
    abi: readonly unknown[],
    functionName: string,
    args: unknown[],
    account: `0x${string}`,
  ): Promise<bigint> {
    try {
      const gas = await this.publicClient.estimateContractGas({
        address,
        abi: abi as never,
        functionName: functionName as never,
        args: args as never,
        account,
      });
      return (gas * 130n) / 100n;
    } catch {
      return 300_000n;
    }
  }

  private async writeContract(
    functionName: string,
    args: unknown[],
  ): Promise<`0x${string}`> {
    const provider = getEthereumProvider();
    if (!provider) throw new Error("No EVM provider available");
    await this.ensureCorrectChain();
    const account = await this.getAccount();

    const walletClient = createWalletClient({
      account,
      chain: polygonAmoy,
      transport: custom(provider),
    });

    const gas = await this.estimateGas(
      this.getVaultAddress(),
      PIGGY_VAULT_ABI,
      functionName,
      args,
      account,
    );

    const hash = await walletClient.writeContract({
      address: this.getVaultAddress() as `0x${string}`,
      abi: PIGGY_VAULT_ABI,
      functionName: functionName as never,
      args: args as never,
      gas,
    } as never);

    if (!hash) throw new Error("Transaction submission returned no hash");
    return hash;
  }

  private async waitForTx(hash: `0x${string}`): Promise<TransactionReceipt> {
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") {
      let reason = "Transaction reverted on-chain";
      try {
        const tx = await this.publicClient.getTransaction({ hash });
        await this.publicClient.call({
          to: tx.to as `0x${string}` | undefined,
          data: tx.input as `0x${string}`,
        });
      } catch (callErr: unknown) {
        const err = callErr as { shortMessage?: string; message?: string };
        const msg = (err?.shortMessage ?? err?.message ?? "") as string;
        const match = msg.match(/reverted with reason string '([^']+)'/);
        if (match && match[1]) reason = match[1];
      }
      throw new Error(reason);
    }
    return receipt;
  }

  // ─── ERC20 approval ────────────────────────────────────────────────────

  async approveAsset(): Promise<`0x${string}`> {
    const provider = getEthereumProvider();
    if (!provider) throw new Error("No EVM provider available");
    await this.ensureCorrectChain();
    const account = await this.getAccount();

    const walletClient = createWalletClient({
      account,
      chain: polygonAmoy,
      transport: custom(provider),
    });

    const gas = await this.estimateGas(
      this.getAssetAddress(),
      ERC20_ABI,
      "approve",
      [this.getVaultAddress() as `0x${string}`, maxUint256],
      account,
    );

    const hash = await walletClient.writeContract({
      address: this.getAssetAddress() as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [this.getVaultAddress() as `0x${string}`, maxUint256],
      gas,
    } as never);

    if (!hash) throw new Error("Approval submission returned no hash");
    return hash;
  }

  async ensureAllowance(required: bigint): Promise<boolean> {
    const account = await this.getAccount();
    const current = await this.getAllowance(account);
    if (current >= required) return true;
    const hash = await this.approveAsset();
    await this.waitForTx(hash);
    return true;
  }

  // ─── Vault write operations ────────────────────────────────────────────

  async deposit(amount: bigint): Promise<`0x${string}`> {
    await this.ensureAllowance(amount);
    const hash = await this.writeContract("deposit", [amount]);
    await this.waitForTx(hash);
    return hash;
  }

  async withdraw(amount: bigint): Promise<`0x${string}`> {
    const hash = await this.writeContract("withdraw", [amount]);
    await this.waitForTx(hash);
    return hash;
  }

  async enableYield(amount: bigint): Promise<`0x${string}`> {
    const hash = await this.writeContract("enableYield", [amount]);
    await this.waitForTx(hash);
    return hash;
  }

  async disableYield(amount: bigint): Promise<`0x${string}`> {
    const hash = await this.writeContract("disableYield", [amount]);
    await this.waitForTx(hash);
    return hash;
  }

  async disableAllYield(): Promise<`0x${string}`> {
    const hash = await this.writeContract("disableAllYield", []);
    await this.waitForTx(hash);
    return hash;
  }

  async adjustYield(newAmount: bigint): Promise<`0x${string}`> {
    // Two-step on-chain: disable all current yield, then enable new amount
    const disableHash = await this.writeContract("disableAllYield", []);
    await this.waitForTx(disableHash);
    if (newAmount > 0n) {
      const enableHash = await this.writeContract("enableYield", [newAmount]);
      await this.waitForTx(enableHash);
      return enableHash;
    }
    return disableHash;
  }

  async allocateToGoal(goalId: bigint, amount: bigint): Promise<`0x${string}`> {
    const hash = await this.writeContract("allocateToGoal", [goalId, amount]);
    await this.waitForTx(hash);
    return hash;
  }

  async deallocateFromGoal(goalId: bigint, amount: bigint): Promise<`0x${string}`> {
    const hash = await this.writeContract("deallocateFromGoal", [goalId, amount]);
    await this.waitForTx(hash);
    return hash;
  }

  async withdrawFromGoal(goalId: bigint, amount: bigint): Promise<`0x${string}`> {
    const hash = await this.writeContract("withdrawFromGoal", [goalId, amount]);
    await this.waitForTx(hash);
    return hash;
  }

  async withdrawFromYield(amount: bigint): Promise<`0x${string}`> {
    const hash = await this.writeContract("withdrawFromYield", [amount]);
    await this.waitForTx(hash);
    return hash;
  }

  async withdrawAllYield(): Promise<`0x${string}`> {
    const hash = await this.writeContract("withdrawAllYield", []);
    await this.waitForTx(hash);
    return hash;
  }

  async borrow(amount: bigint): Promise<`0x${string}`> {
    const hash = await this.writeContract("borrow", [amount]);
    await this.waitForTx(hash);
    return hash;
  }

  async repay(amount: bigint, fromIdleBalance: boolean): Promise<`0x${string}`> {
    if (!fromIdleBalance) {
      await this.ensureAllowance(amount);
    }
    const hash = await this.writeContract("repay", [amount, fromIdleBalance]);
    await this.waitForTx(hash);
    return hash;
  }

  async repayAllDebt(fromIdleBalance: boolean): Promise<`0x${string}`> {
    const hash = await this.writeContract("repayAllDebt", [fromIdleBalance]);
    await this.waitForTx(hash);
    return hash;
  }

  async setRecurringSchedule(amount: bigint, intervalSeconds: bigint): Promise<`0x${string}`> {
    const hash = await this.writeContract("setRecurringSchedule", [amount, intervalSeconds]);
    await this.waitForTx(hash);
    return hash;
  }

  async cancelRecurringSchedule(): Promise<`0x${string}`> {
    const hash = await this.writeContract("cancelRecurringSchedule", []);
    await this.waitForTx(hash);
    return hash;
  }

  // ─── View helpers ──────────────────────────────────────────────────────

  async getMaxBorrowable(user: Address): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.getVaultAddress(),
      abi: PIGGY_VAULT_ABI,
      functionName: "maxBorrowable",
      args: [user],
    }) as Promise<bigint>;
  }

  async getDebtValueOf(user: Address): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.getVaultAddress(),
      abi: PIGGY_VAULT_ABI,
      functionName: "debtValueOf",
      args: [user],
    }) as Promise<bigint>;
  }

  async getYieldValueOf(user: Address): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.getVaultAddress(),
      abi: PIGGY_VAULT_ABI,
      functionName: "yieldValueOf",
      args: [user],
    }) as Promise<bigint>;
  }

  // ─── Format helpers ────────────────────────────────────────────────────

  toUnits(amount: string, decimals: number): bigint {
    return parseUnits(amount, decimals);
  }

  fromUnits(amount: bigint, decimals: number): string {
    return formatUnits(amount, decimals);
  }
}

export const piggyVaultService = new PiggyVaultService();
