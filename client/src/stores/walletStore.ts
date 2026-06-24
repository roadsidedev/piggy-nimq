import { create } from "zustand";
import type { NimiqProfile, WalletStatus } from "@/types/nimiq";

interface WalletState {
  status: WalletStatus;
  profile: NimiqProfile | null;
  address: `0x${string}` | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  setProfile: (profile: NimiqProfile) => void;
  setAddress: (address: `0x${string}`) => void;
  setError: (error: string) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  status: "disconnected",
  profile: null,
  address: null,
  error: null,

  connect: async () => {
    set({ status: "connecting", error: null });
  },

  disconnect: () => {
    set({
      status: "disconnected",
      profile: null,
      address: null,
      error: null,
    });
  },

  setProfile: (profile) => set({ profile, status: "connected" }),
  setAddress: (address) => set({ address }),
  setError: (error) => set({ error, status: "error" }),
  reset: () =>
    set({
      status: "disconnected",
      profile: null,
      address: null,
      error: null,
    }),
}));
