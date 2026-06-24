import { useCallback } from "react";
import { useRecurringStore, type RecurringFrequency, type RecurringSchedule } from "@/stores/recurringStore";
import { useGoalsStore } from "@/stores/goalsStore";

export function useRecurring() {
  const { schedules, addSchedule, updateSchedule, deleteSchedule, togglePause } = useRecurringStore();
  const goals = useGoalsStore((s) => s.goals);

  const createSchedule = useCallback(
    (
      amount: string,
      frequency: RecurringFrequency,
      goalId?: string,
    ) => {
      const schedule: RecurringSchedule = {
        id: crypto.randomUUID(),
        amount,
        frequency,
        paused: false,
        createdAt: new Date().toISOString(),
        ...(frequency === "weekly" ? { dayOfWeek: new Date().getDay() } : { dayOfMonth: new Date().getDate() }),
        ...(goalId ? { goalId } : {}),
      };
      addSchedule(schedule);
    },
    [addSchedule],
  );

  return {
    schedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    togglePause,
    goals,
  };
}
