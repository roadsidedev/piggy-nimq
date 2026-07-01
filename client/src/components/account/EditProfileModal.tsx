import { useState, useCallback, useEffect, useRef } from "react";
import { Modal, Button } from "@/components/common";
import { Avatar } from "./Avatar";
import { useProfileStore } from "@/stores/profileStore";
import { useWalletStore } from "@/stores/walletStore";
import { apiGet } from "@/lib/api";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function EditProfileModal({ open, onClose }: EditProfileModalProps) {
  const address = useWalletStore((s) => s.address);
  const { username: currentUsername, updateProfile } = useProfileStore();

  const [username, setUsername] = useState(currentUsername ?? "");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const usernameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setUsername(currentUsername ?? "");
      setUsernameStatus("idle");
      setError(null);
    }
  }, [open, currentUsername]);

  // Debounced username availability check
  const checkUsername = useCallback(async (value: string) => {
    if (value.length < 3 || !/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus("checking");
    try {
      const res = await apiGet<{ success: boolean; data: { available: boolean } }>(
        `/profile/check-username/${value}`,
      );
      setUsernameStatus(res.data.available ? "available" : "taken");
    } catch {
      setUsernameStatus("idle");
    }
  }, []);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setError(null);
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
    usernameTimerRef.current = setTimeout(() => checkUsername(value), 400);
  };

  const handleSave = async () => {
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores");
      return;
    }
    if (usernameStatus === "taken") {
      setError("Username is already taken");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateProfile({ username });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Profile">
      <div className="flex flex-col gap-4">
        {/* Avatar Preview */}
        <div className="flex flex-col items-center gap-3">
          <Avatar address={address} username={username || currentUsername} size="lg" />
        </div>

        {/* Username Section */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-300">Username</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="your_username"
              maxLength={20}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 py-2.5 pl-7 pr-3 text-sm text-white placeholder-neutral-500 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-600"
            />
          </div>
          {usernameStatus === "checking" && (
            <span className="text-xs text-neutral-400">Checking availability...</span>
          )}
          {usernameStatus === "available" && (
            <span className="text-xs text-green-400">Username is available</span>
          )}
          {usernameStatus === "taken" && (
            <span className="text-xs text-red-400">Username is already taken</span>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
        )}

        {/* Save Button */}
        <Button onClick={handleSave} loading={saving} size="lg">
          Save Profile
        </Button>
      </div>
    </Modal>
  );
}
