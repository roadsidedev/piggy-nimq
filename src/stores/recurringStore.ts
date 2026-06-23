import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RecurringFrequency = "weekly" | "monthly";

export interface RecurringSchedule {
  id: string;
  amount: string;
  frequency: RecurringFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  goalId?: string;
  paused: boolean;
  createdAt: string;
}

interface RecurringState {
  schedules: RecurringSchedule[];
  addSchedule: (schedule: RecurringSchedule) => void;
  updateSchedule: (id: string, updates: Partial<RecurringSchedule>) => void;
  deleteSchedule: (id: string) => void;
  togglePause: (id: string) => void;
  reset: () => void;
}

export const useRecurringStore = create<RecurringState>()(
  persist(
    (set) => ({
      schedules: [],

      addSchedule: (schedule) =>
        set((state) => ({ schedules: [...state.schedules, schedule] })),

      updateSchedule: (id, updates) =>
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === id ? { ...s, ...updates } : s,
          ),
        })),

      deleteSchedule: (id) =>
        set((state) => ({
          schedules: state.schedules.filter((s) => s.id !== id),
        })),

      togglePause: (id) =>
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === id ? { ...s, paused: !s.paused } : s,
          ),
        })),
      reset: () => set({ schedules: [] }),
    }),
    { name: "piggy-recurring" },
  ),
);
