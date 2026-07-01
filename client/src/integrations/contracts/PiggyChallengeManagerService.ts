import { type Address, type PublicClient, type TransactionReceipt, createPublicClient, createWalletClient, custom, http } from "viem";
import { polygonAmoy } from "viem/chains";
import { PIGGY_CONTRACTS, PIGGY_CHALLENGE_MANAGER_ABI, RPC_URL } from "./constants";
import { getEthereumProvider } from "@/integrations/nimiq";
import { ensureCorrectChain } from "@/integrations/wallet/chain";

export type ChallengeFrequency = 0 | 1 | 2;

export interface OnChainChallenge {
  name: string;
  targetAmount: bigint;
  durationDays: bigint;
  startDate: bigint;
  endDate: bigint;
  frequency: number;
  isActive: boolean;
  isPublic: boolean;
  maxMembers: bigint;
  owner: Address;
  memberCount: bigint;
}

export interface MemberProgress {
  isMember: boolean;
  totalSaved: bigint;
  lastActivity: bigint;
  currentStreak: number;
  longestStreak: number;
}

export interface LeaderboardEntry {
  member: Address;
  totalSaved: bigint;
  currentStreak: number;
}

export class PiggyChallengeManagerService {
  private publicClient: PublicClient;

  constructor() {
    this.publicClient = createPublicClient({
      chain: polygonAmoy,
      transport: http(RPC_URL),
    }) as unknown as PublicClient;
  }

  getManagerAddress(): Address {
    return PIGGY_CONTRACTS.challengeManager as Address;
  }

  // ─── Read ──────────────────────────────────────────────────────────────

  async getChallenge(challengeId: bigint): Promise<OnChainChallenge> {
    const data = await this.publicClient.readContract({
      address: this.getManagerAddress(),
      abi: PIGGY_CHALLENGE_MANAGER_ABI,
      functionName: "getChallenge",
      args: [challengeId],
    }) as unknown as OnChainChallengeTuple;
    return {
      name: data.name,
      targetAmount: data.targetAmount,
      durationDays: data.durationDays,
      startDate: data.startDate,
      endDate: data.endDate,
      frequency: Number(data.frequency),
      isActive: data.isActive,
      isPublic: data.isPublic,
      maxMembers: data.maxMembers,
      owner: data.owner,
      memberCount: data.memberCount,
    };
  }

  async getMemberProgress(challengeId: bigint, member: Address): Promise<MemberProgress> {
    const data = await this.publicClient.readContract({
      address: this.getManagerAddress(),
      abi: PIGGY_CHALLENGE_MANAGER_ABI,
      functionName: "getMemberProgress",
      args: [challengeId, member],
    }) as unknown as MemberProgressTuple;
    return {
      isMember: data.isMember,
      totalSaved: data.totalSaved,
      lastActivity: BigInt(data.lastActivity),
      currentStreak: Number(data.currentStreak),
      longestStreak: Number(data.longestStreak),
    };
  }

  async getUserChallengeIds(user: Address): Promise<bigint[]> {
    const data = await this.publicClient.readContract({
      address: this.getManagerAddress(),
      abi: PIGGY_CHALLENGE_MANAGER_ABI,
      functionName: "getUserChallenges",
      args: [user],
    });
    return [...(data as unknown as bigint[])];
  }

  async getUserChallenges(user: Address): Promise<{ challengeId: bigint; challenge: OnChainChallenge; progress: MemberProgress }[]> {
    const ids = await this.getUserChallengeIds(user);
    return Promise.all(
      ids.map(async (id) => {
        const [challenge, progress] = await Promise.all([
          this.getChallenge(id),
          this.getMemberProgress(id, user),
        ]);
        return { challengeId: id, challenge, progress };
      }),
    );
  }

  // ─── Write ─────────────────────────────────────────────────────────────

  private async ensureCorrectChain(): Promise<void> {
    await ensureCorrectChain();
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
      chain: polygonAmoy,
      transport: custom(provider),
    });

    const hash = await walletClient.writeContract({
      address: this.getManagerAddress() as `0x${string}`,
      abi: PIGGY_CHALLENGE_MANAGER_ABI,
      functionName: functionName as never,
      args: args as never,
    } as never);

    if (!hash) throw new Error("Transaction submission returned no hash");
    return hash;
  }

  private async waitForTx(hash: `0x${string}`): Promise<TransactionReceipt> {
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") {
      throw new Error("Transaction reverted on-chain");
    }
    return receipt;
  }

  async createChallenge(
    name: string,
    targetAmount: bigint,
    durationDays: bigint,
    frequency: ChallengeFrequency,
    maxMembers: bigint = 100n,
    isPublic: boolean = true,
  ): Promise<bigint> {
    const hash = await this.writeContract("createChallenge", [
      name, targetAmount, durationDays, frequency, maxMembers, isPublic,
    ]);
    const receipt = await this.waitForTx(hash);
    if (receipt.status !== "success") throw new Error("Create challenge failed on-chain");
    const count = await this.challengeCount();
    return count - 1n;
  }

  async joinChallenge(challengeId: bigint): Promise<`0x${string}`> {
    const hash = await this.writeContract("joinChallenge", [challengeId]);
    await this.waitForTx(hash);
    return hash;
  }

  async leaveChallenge(challengeId: bigint): Promise<`0x${string}`> {
    const hash = await this.writeContract("leaveChallenge", [challengeId]);
    await this.waitForTx(hash);
    return hash;
  }

  async challengeCount(): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.getManagerAddress(),
      abi: PIGGY_CHALLENGE_MANAGER_ABI,
      functionName: "challengeCount",
    }) as Promise<bigint>;
  }
}

interface OnChainChallengeTuple {
  name: string;
  targetAmount: bigint;
  durationDays: bigint;
  startDate: bigint;
  endDate: bigint;
  frequency: number;
  isActive: boolean;
  isPublic: boolean;
  maxMembers: bigint;
  owner: Address;
  memberCount: bigint;
}

interface MemberProgressTuple {
  isMember: boolean;
  totalSaved: bigint;
  lastActivity: number | bigint;
  currentStreak: number | bigint;
  longestStreak: number | bigint;
}

export const piggyChallengeManagerService = new PiggyChallengeManagerService();
