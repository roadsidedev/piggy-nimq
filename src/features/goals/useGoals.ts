import { useCallback } from "react";
import { useGoalsStore, type StoredGoal } from "@/stores/goalsStore";

export function useGoals() {
  const { goals, addGoal, updateGoal, deleteGoal, allocateFunds, transferFunds } = useGoalsStore();

  const createGoal = useCallback(
    (title: string, targetAmount: string, targetDate?: string) => {
      const goal: StoredGoal = {
        id: crypto.randomUUID(),
        title,
        targetAmount,
        currentAmount: "0",
        targetDate: targetDate ?? null,
        createdAt: new Date().toISOString(),
      };
      addGoal(goal);
    },
    [addGoal],
  );

  return {
    goals,
    createGoal,
    updateGoal,
    deleteGoal,
    allocateFunds,
    transferFunds,
  };
}
