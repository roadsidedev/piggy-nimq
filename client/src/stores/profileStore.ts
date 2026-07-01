import { create } from "zustand";
import { apiGet, apiPatch } from "@/lib/api";

export interface PublicProfile {
  address: string;
  username: string | null;
}

interface ProfileState {
  username: string | null;
  isLoading: boolean;
  // Cache for other users' profiles (keyed by lowercase address)
  profiles: Record<string, PublicProfile>;
  setUsername: (username: string | null) => void;
  fetchProfile: () => Promise<void>;
  fetchProfiles: (addresses: string[]) => Promise<void>;
  updateProfile: (data: { username?: string }) => Promise<void>;
  reset: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  username: null,
  isLoading: false,
  profiles: {},

  setUsername: (username) => set({ username }),

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const res = await apiGet<{ success: boolean; data: { username?: string } }>("/auth/me");
      if (res.success && res.data) {
        set({
          username: res.data.username ?? null,
        });
      }
    } catch {
      // Silently fail — profile is optional
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProfiles: async (addresses: string[]) => {
    const current = get().profiles;
    // Only fetch for addresses we don't already have
    const toFetch = addresses.filter((a) => !current[a.toLowerCase()]);
    if (toFetch.length === 0) return;

    const results = await Promise.allSettled(
      toFetch.map(async (addr) => {
        const res = await apiGet<{ success: boolean; data: PublicProfile }>(`/profile/${addr}`);
        if (res.success && res.data) {
          return res.data;
        }
        return { address: addr, username: null } as PublicProfile;
      }),
    );

    const updated = { ...current };
    for (const r of results) {
      if (r.status === "fulfilled") {
        updated[r.value.address.toLowerCase()] = r.value;
      }
    }
    set({ profiles: updated });
  },

  updateProfile: async (data) => {
    const res = await apiPatch<{ success: boolean; data: { username?: string }; error?: string }>(
      "/profile",
      data,
    );
    if (!res.success) {
      throw new Error(res.error ?? "Failed to update profile");
    }
    set({
      username: res.data.username ?? get().username,
    });
  },

  reset: () => set({ username: null, isLoading: false, profiles: {} }),
}));
