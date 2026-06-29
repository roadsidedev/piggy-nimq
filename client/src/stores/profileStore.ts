import { create } from "zustand";
import { apiGet, apiPatch } from "@/lib/api";

export interface PublicProfile {
  address: string;
  username: string | null;
  avatarUrl: string | null;
}

interface ProfileState {
  username: string | null;
  avatarUrl: string | null;
  isLoading: boolean;
  // Cache for other users' profiles (keyed by lowercase address)
  profiles: Record<string, PublicProfile>;
  setUsername: (username: string | null) => void;
  setAvatarUrl: (avatarUrl: string | null) => void;
  fetchProfile: () => Promise<void>;
  fetchProfiles: (addresses: string[]) => Promise<void>;
  updateProfile: (data: { username?: string; avatarUrl?: string }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  reset: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  username: null,
  avatarUrl: null,
  isLoading: false,
  profiles: {},

  setUsername: (username) => set({ username }),
  setAvatarUrl: (avatarUrl) => set({ avatarUrl }),

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const res = await apiGet<{ success: boolean; data: { username?: string; avatarUrl?: string } }>("/auth/me");
      if (res.success && res.data) {
        set({
          username: res.data.username ?? null,
          avatarUrl: res.data.avatarUrl ?? null,
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
        return { address: addr, username: null, avatarUrl: null } as PublicProfile;
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
    const res = await apiPatch<{ success: boolean; data: { username?: string; avatarUrl?: string }; error?: string }>(
      "/profile",
      data,
    );
    if (!res.success) {
      throw new Error(res.error ?? "Failed to update profile");
    }
    set({
      username: res.data.username ?? get().username,
      avatarUrl: res.data.avatarUrl ?? get().avatarUrl,
    });
  },

  uploadAvatar: async (file: File) => {
    const token = sessionStorage.getItem("piggy-session-token");
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

    const formData = new FormData();
    formData.append("avatar", file);

    const res = await fetch(`${API_BASE}/profile/avatar`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error ?? "Failed to upload avatar");
    }

    const avatarUrl = json.data.avatarUrl as string;
    set({ avatarUrl });
    return avatarUrl;
  },

  reset: () => set({ username: null, avatarUrl: null, isLoading: false, profiles: {} }),
}));
