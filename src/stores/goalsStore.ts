import { create } from "zustand";
import { persist } from "zustand/middleware";

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
              ? { ...g, currentAmount: (Number(g.currentAmount) + Number(amount)).toString() }
              : g,
          ),
        })),

      transferFunds: (fromId, toId, amount) =>
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id === fromId) {
              return { ...g, currentAmount: (Number(g.currentAmount) - Number(amount)).toString() };
            }
            if (g.id === toId) {
              return { ...g, currentAmount: (Number(g.currentAmount) + Number(amount)).toString() };
            }
            return g;
          }),
        })),
    }),
    { name: "piggy-goals" },
  ),
);
