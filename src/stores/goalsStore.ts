import { create } from "zustand";
import { persist } from "zustand/middleware";

function addAmounts(a: string, b: string): string {
  const partsA = a.split(".");
  const partsB = b.split(".");
  const dA = partsA[1]?.length ?? 0;
  const dB = partsB[1]?.length ?? 0;
  const scale = Math.max(dA, dB);
  const factor = 10 ** scale;
  const result = (Math.round(Number(a) * factor) + Math.round(Number(b) * factor)) / factor;
  return result.toFixed(scale);
}

function negate(v: string): string {
  return v.startsWith("-") ? v.slice(1) : "-" + v;
}

export interface StoredGoal {
  id: string;
  title: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string | null;
  createdAt: string;
}

interface GoalsState {
  goals: StoredGoal[];
  addGoal: (goal: StoredGoal) => void;
  updateGoal: (id: string, updates: Partial<StoredGoal>) => void;
  deleteGoal: (id: string) => void;
  allocateFunds: (id: string, amount: string) => void;
  transferFunds: (fromId: string, toId: string, amount: string) => void;
  reset: () => void;
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set) => ({
      goals: [],

      addGoal: (goal) => set((state) => ({ goals: [...state.goals, goal] })),

      updateGoal: (id, updates) =>
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        })),

      deleteGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),

      allocateFunds: (id, amount) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id
              ? { ...g, currentAmount: addAmounts(g.currentAmount, amount) }
              : g,
          ),
        })),

      transferFunds: (fromId, toId, amount) =>
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id === fromId) {
              return { ...g, currentAmount: addAmounts(g.currentAmount, negate(amount)) };
            }
            if (g.id === toId) {
              return { ...g, currentAmount: addAmounts(g.currentAmount, amount) };
            }
            return g;
          }),
        })),
      reset: () => set({ goals: [] }),
    }),
    { name: "piggy-goals" },
  ),
);
