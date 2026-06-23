import { useCallback } from "react";
import { useChallengesStore, type Challenge } from "@/stores/challengesStore";
import { useWalletStore } from "@/stores/walletStore";

export function useChallenges() {
  const address = useWalletStore((s) => s.address);
  const { challenges, addChallenge, joinChallenge, leaveChallenge, updateProgress } =
    useChallengesStore();

  const createChallenge = useCallback(
    (
      title: string,
      target: string,
      frequency: "daily" | "weekly" | "monthly",
      duration: number,
    ) => {
      if (!address) return;
      const challenge: Challenge = {
        id: crypto.randomUUID(),
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
    },
    [address, addChallenge],
  );

  const handleJoin = useCallback(
    (id: string) => {
      if (!address) return;
      joinChallenge(id, address);
    },
    [address, joinChallenge],
  );

  const handleLeave = useCallback(
    (id: string) => {
      if (!address) return;
      leaveChallenge(id, address);
    },
    [address, leaveChallenge],
  );

  return {
    challenges,
    createChallenge,
    joinChallenge: handleJoin,
    leaveChallenge: handleLeave,
    updateProgress,
  };
}
