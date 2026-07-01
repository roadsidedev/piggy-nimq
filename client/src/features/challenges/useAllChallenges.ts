import { useEffect, useRef } from "react";
import { useChallengesStore, type Challenge } from "@/stores/challengesStore";
import { piggyChallengeManagerService } from "@/integrations/contracts";

const FREQ_MAP: Record<number, "daily" | "weekly" | "monthly"> = {
  0: "daily",
  1: "weekly",
  2: "monthly",
};

export function useAllChallenges() {
  const { challenges, addChallenge } = useChallengesStore();
  const syncing = useRef(false);

  useEffect(() => {
    if (syncing.current) return;

    const sync = async () => {
      syncing.current = true;
      try {
        const count = await piggyChallengeManagerService.challengeCount();
        if (count === 0n) return;

        const existingIds = new Set(challenges.map((c) => c.id));
        const limit = Number(count) > 200 ? 200 : Number(count);

        for (let i = 0n; i < BigInt(limit); i++) {
          const localId = `onchain-${i.toString()}`;
          if (existingIds.has(localId)) continue;

          try {
            const c = await piggyChallengeManagerService.getChallenge(i);
            if (!c.isActive || !c.isPublic) continue;

            const newChallenge: Challenge = {
              id: localId,
              title: c.name ?? "Untitled",
              target: c.targetAmount?.toString() ?? "0",
              frequency: FREQ_MAP[c.frequency] ?? "daily",
              duration: Number(c.durationDays ?? 0),
              owner: c.owner,
              members: [],
              memberProgress: {},
              streak: 0,
              createdAt: c.startDate
                ? new Date(Number(c.startDate) * 1000).toISOString()
                : new Date().toISOString(),
            };
            addChallenge(newChallenge);
          } catch {
            // skip challenges that error (e.g. not created yet)
          }
        }
      } finally {
        syncing.current = false;
      }
    };

    sync();
    const interval = setInterval(sync, 60000);
    return () => clearInterval(interval);
  }, [challenges, addChallenge]);
}
