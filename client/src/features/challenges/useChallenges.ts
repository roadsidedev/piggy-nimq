import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWalletStore } from "@/stores/walletStore";
import { useChallengesStore, type Challenge } from "@/stores/challengesStore";
import { parseUnits } from "viem";
import { piggyChallengeManagerService, piggyVaultService, type ChallengeFrequency } from "@/integrations/contracts";
import { useAllChallenges } from "./useAllChallenges";

const FREQ_MAP: Record<number, "daily" | "weekly" | "monthly"> = {
  0: "daily",
  1: "weekly",
  2: "monthly",
};

export function useChallenges() {
  const address = useWalletStore((s) => s.address);
  const qc = useQueryClient();
  const { challenges, addChallenge, joinChallenge, leaveChallenge, updateProgress } =
    useChallengesStore();

  // Discover all public challenges on-chain so they appear in Browse
  useAllChallenges();

  // Fetch on-chain challenges the user is part of
  const { data: onChainChallenges, isLoading } = useQuery({
    queryKey: ["onChainChallenges", address],
    queryFn: async () => {
      if (!address) return [];
      return piggyChallengeManagerService.getUserChallenges(address);
    },
    enabled: !!address,
    refetchInterval: 30000,
  });

  // Sync on-chain challenges into local store when fetched
  useEffect(() => {
    if (!onChainChallenges) return;
    for (const occ of onChainChallenges) {
      const localId = `onchain-${occ.challengeId.toString()}`;
      const exists = challenges.some((c) => c.id === localId);
      if (exists) continue;

      const localChallenge: Challenge = {
        id: localId,
        title: occ.challenge.name ?? "Untitled",
        target: occ.challenge.targetAmount?.toString() ?? "0",
        frequency: FREQ_MAP[occ.challenge.frequency] ?? "daily",
        duration: Number(occ.challenge.durationDays ?? 0),
        owner: occ.challenge.owner,
        members: [],
        memberProgress: {},
        streak: occ.progress?.currentStreak ?? 0,
        createdAt: occ.challenge.startDate
          ? new Date(Number(occ.challenge.startDate) * 1000).toISOString()
          : new Date().toISOString(),
      };
      addChallenge(localChallenge);
    }
  }, [onChainChallenges, challenges, addChallenge]);

  const createChallenge = useCallback(
    async (
      title: string,
      target: string,
      frequency: "daily" | "weekly" | "monthly",
      duration: number,
    ) => {
      if (!address) throw new Error("Wallet not connected");

      const freqMap: Record<string, ChallengeFrequency> = {
        daily: 0,
        weekly: 1,
        monthly: 2,
      };

      const decimals = await piggyVaultService.getDecimals();
      const parsedTarget = parseUnits(target, decimals);

      const challengeId = await piggyChallengeManagerService.createChallenge(
        title,
        parsedTarget,
        BigInt(duration),
        freqMap[frequency] ?? 0,
      );

      const challenge: Challenge = {
        id: `onchain-${challengeId.toString()}`,
        title,
        target,
        frequency,
        duration,
        owner: address,
        members: [address],
        memberProgress: { [address]: "0" },
        streak: 0,
        createdAt: new Date().toISOString(),
      };
      addChallenge(challenge);
      qc.invalidateQueries({ queryKey: ["onChainChallenges", address] });
    },
    [address, addChallenge, qc],
  );

  const handleJoin = useCallback(
    async (id: string) => {
      if (!address) return;
      if (id.startsWith("onchain-")) {
        const challengeId = BigInt(id.replace("onchain-", ""));
        await piggyChallengeManagerService.joinChallenge(challengeId);
        qc.invalidateQueries({ queryKey: ["onChainChallenges", address] });
      }
      joinChallenge(id, address);
    },
    [address, joinChallenge, qc],
  );

  const handleLeave = useCallback(
    async (id: string) => {
      if (!address) return;
      if (id.startsWith("onchain-")) {
        const challengeId = BigInt(id.replace("onchain-", ""));
        try {
          await piggyChallengeManagerService.leaveChallenge(challengeId);
        } catch {
          // Owner cannot leave - expected
        }
        qc.invalidateQueries({ queryKey: ["onChainChallenges", address] });
      }
      leaveChallenge(id, address);
    },
    [address, leaveChallenge, qc],
  );

  return {
    challenges,
    isLoading,
    createChallenge,
    joinChallenge: handleJoin,
    leaveChallenge: handleLeave,
    updateProgress,
  };
}
