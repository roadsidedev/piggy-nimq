import { useCallback, useEffect } from "react";
import { parseUnits } from "viem";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWalletStore } from "@/stores/walletStore";
import { useGoalsStore, type StoredGoal } from "@/stores/goalsStore";
import { piggyGoalManagerService, piggyVaultService, type OnChainGoalInfo } from "@/integrations/contracts";

export function useGoals() {
  const address = useWalletStore((s) => s.address);
  const qc = useQueryClient();
  const { goals, addGoal, updateGoal, deleteGoal, allocateFunds, transferFunds } = useGoalsStore();

  // Fetch goals from chain when address changes
  const { data: onChainGoalIds, isLoading } = useQuery({
    queryKey: ["onChainGoals", address],
    queryFn: async () => {
      if (!address) return [];
      const count = await piggyGoalManagerService.nextGoalId(address);
      const goalPromises: Promise<{ id: bigint; info: OnChainGoalInfo }>[] = [];
      for (let i = 0n; i < count; i++) {
        goalPromises.push(
          piggyGoalManagerService.getGoal(address, i).then((info) => ({ id: i, info }))
        );
      }
      return Promise.all(goalPromises);
    },
    enabled: !!address,
    refetchInterval: 60000,
  });

  // Sync on-chain goals into local store
  useEffect(() => {
    if (!onChainGoalIds || onChainGoalIds.length === 0) return;

    for (const og of onChainGoalIds) {
      const localId = `onchain-${og.id.toString()}`;
      const exists = goals.some((g) => g.id === localId);
      if (exists) continue;

      const localGoal: StoredGoal = {
        id: localId,
        title: `Goal #${og.id.toString()}`,
        targetAmount: og.info.active ? og.info.targetAmount.toString() : "0",
        currentAmount: og.info.allocated.toString(),
        targetDate: og.info.targetDate > 0n
          ? new Date(Number(og.info.targetDate) * 1000).toISOString()
          : null,
        createdAt: new Date().toISOString(),
      };
      addGoal(localGoal);
    }
  }, [onChainGoalIds, goals, addGoal]);

  const createGoal = useCallback(
    async (title: string, targetAmount: string, targetDate?: string) => {
      if (!address) throw new Error("Wallet not connected");

      const decimals = await piggyVaultService.getDecimals();
      const parsedTarget = parseUnits(targetAmount, decimals);
      const parsedDate = targetDate
        ? BigInt(Math.floor(new Date(targetDate).getTime() / 1000))
        : 0n;

      const { goalId } = await piggyGoalManagerService.createGoal(
        title,
        parsedTarget,
        parsedDate,
      );

      const goal: StoredGoal = {
        id: `onchain-${goalId.toString()}`,
        title,
        targetAmount,
        currentAmount: "0",
        targetDate: targetDate ?? null,
        createdAt: new Date().toISOString(),
      };
      addGoal(goal);
      qc.invalidateQueries({ queryKey: ["onChainGoals", address] });
    },
    [address, addGoal, qc],
  );

  return {
    goals,
    isLoading,
    createGoal,
    updateGoal,
    deleteGoal,
    allocateFunds,
    transferFunds,
  };
}
