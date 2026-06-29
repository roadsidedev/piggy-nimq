import { type Address, type PublicClient, type TransactionReceipt, createPublicClient, createWalletClient, custom, http } from "viem";
import { baseSepolia } from "viem/chains";
import { PIGGY_CONTRACTS, PIGGY_GOAL_MANAGER_ABI, RPC_URL } from "./constants";
import { getEthereumProvider } from "@/integrations/nimiq";

export interface OnChainGoalInfo {
  targetAmount: bigint;
  targetDate: bigint;
  allocated: bigint;
  active: boolean;
}

export class PiggyGoalManagerService {
  private publicClient: PublicClient;

  constructor() {
    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(RPC_URL),
    }) as unknown as PublicClient;
  }

  getManagerAddress(): Address {
    return PIGGY_CONTRACTS.goalManager as Address;
  }

  // ─── Read ──────────────────────────────────────────────────────────────

  async getGoal(user: Address, goalId: bigint): Promise<OnChainGoalInfo> {
    const data = await this.publicClient.readContract({
      address: this.getManagerAddress(),
      abi: PIGGY_GOAL_MANAGER_ABI,
      functionName: "getGoal",
      args: [user, goalId],
    }) as OnChainGoalInfo;
    return data;
  }

  async nextGoalId(user: Address): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.getManagerAddress(),
      abi: PIGGY_GOAL_MANAGER_ABI,
      functionName: "nextGoalId",
      args: [user],
    }) as Promise<bigint>;
  }

  // ─── Write ─────────────────────────────────────────────────────────────

  private async ensureCorrectChain(): Promise<void> {
    const provider = getEthereumProvider();
    if (!provider) throw new Error("No EVM provider available");

    const currentChainId = await provider.request({ method: "eth_chainId" }) as string;
    const targetChainId = `0x${baseSepolia.id.toString(16)}`;

    if (currentChainId === targetChainId) return;

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetChainId }],
      });
    } catch (error: unknown) {
      const err = error as { code?: number };
      if (err.code === 4902) {
        throw new Error("Base Sepolia is not available in your wallet. Please add it manually.");
      }
      throw error;
    }
  }

  private async getAccount(): Promise<Address> {
    const provider = getEthereumProvider();
    if (!provider) throw new Error("No EVM provider available");
    const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
    if (!accounts.length) throw new Error("No accounts available");
    return accounts[0] as Address;
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
      chain: baseSepolia,
      transport: custom(provider),
    });

    const hash = await walletClient.writeContract({
      address: this.getManagerAddress() as `0x${string}`,
      abi: PIGGY_GOAL_MANAGER_ABI,
      functionName: functionName as never,
      args: args as never,
    } as never);

    if (!hash) throw new Error("Transaction submission returned no hash");
    return hash;
  }

  private async waitForTx(hash: `0x${string}`): Promise<TransactionReceipt> {
    return this.publicClient.waitForTransactionReceipt({ hash });
  }

  async createGoal(
    name: string,
    targetAmount: bigint,
    targetDate: bigint = 0n,
  ): Promise<{ goalId: bigint; hash: `0x${string}` }> {
    const account = await this.getAccount();
    const hash = await this.writeContract("createGoal", [account, targetAmount, targetDate, name]);
    const receipt = await this.waitForTx(hash);
    if (receipt.status !== "success") throw new Error("Create goal transaction failed on-chain");

    // Derive goalId from nextGoalId after creation
    const goalId = (await this.nextGoalId(account)) - 1n;
    return { goalId, hash };
  }

  async allocateToGoal(goalId: bigint, amount: bigint): Promise<`0x${string}`> {
    const account = await this.getAccount();
    return this.writeContract("allocateToGoal", [account, goalId, amount]);
  }

  async closeGoal(goalId: bigint): Promise<`0x${string}`> {
    const account = await this.getAccount();
    return this.writeContract("closeGoal", [account, goalId]);
  }
}

export const piggyGoalManagerService = new PiggyGoalManagerService();
