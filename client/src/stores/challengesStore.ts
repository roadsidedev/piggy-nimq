import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Challenge {
  id: string;
  title: string;
  target: string;
  frequency: "daily" | "weekly" | "monthly";
  duration: number;
  owner: string;
  members: string[];
  memberProgress: Record<string, string>;
  streak: number;
  createdAt: string;
}

interface ChallengesState {
  challenges: Challenge[];
  addChallenge: (challenge: Challenge) => void;
  joinChallenge: (id: string, address: string) => void;
  leaveChallenge: (id: string, address: string) => void;
  updateProgress: (id: string, address: string, amount: string) => void;
  reset: () => void;
}

export const useChallengesStore = create<ChallengesState>()(
  persist(
    (set) => ({
      challenges: [],

      addChallenge: (challenge) =>
        set((state) => ({
          challenges: state.challenges.some((c) => c.id === challenge.id)
            ? state.challenges
            : [...state.challenges, challenge],
        })),

      joinChallenge: (id, address) =>
        set((state) => ({
          challenges: state.challenges.map((c) =>
            c.id === id && !c.members.includes(address)
              ? { ...c, members: [...c.members, address] }
              : c,
          ),
        })),

      leaveChallenge: (id, address) =>
        set((state) => ({
          challenges: state.challenges.map((c) =>
            c.id === id
              ? { ...c, members: c.members.filter((m) => m !== address) }
              : c,
          ),
        })),

      updateProgress: (id, address, amount) =>
        set((state) => ({
          challenges: state.challenges.map((c) => {
            if (c.id !== id) return c;
            const current = c.memberProgress[address] ?? "0";
            const updated = (BigInt(Math.round(Number(current) * 1e6)) + BigInt(Math.round(Number(amount) * 1e6))).toString();
            return {
              ...c,
              memberProgress: { ...c.memberProgress, [address]: (Number(updated) / 1e6).toFixed(2) },
              streak: c.streak + 1,
            };
          }),
        })),
      reset: () => set({ challenges: [] }),
    }),
    { name: "piggy-challenges" },
  ),
);
