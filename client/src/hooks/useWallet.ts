import { useCallback, useEffect, useState } from "react";
import { useWalletStore } from "@/stores/walletStore";
import { useVaultStore } from "@/stores/vaultStore";
import { useBorrowStore } from "@/stores/borrowStore";
import { useGoalsStore } from "@/stores/goalsStore";
import { useChallengesStore } from "@/stores/challengesStore";
import { useRecurringStore } from "@/stores/recurringStore";
import { useProfileStore } from "@/stores/profileStore";
import { walletService } from "@/integrations/wallet";
import { isNimiqPay, getEthereumProvider, initNimiqSDK, getLanguage, requestId } from "@/integrations/nimiq";

export function useWallet() {
  const { status, profile, address, error, connect: storeConnect, disconnect, setProfile, setAddress, setError } =
    useWalletStore();
  const resetVault = useVaultStore((s) => s.reset);
  const resetBorrow = useBorrowStore((s) => s.reset);
  const resetGoals = useGoalsStore((s) => s.reset);
  const resetChallenges = useChallengesStore((s) => s.reset);
  const resetRecurring = useRecurringStore((s) => s.reset);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const resetProfile = useProfileStore((s) => s.reset);
  const [language, setLanguage] = useState<string | undefined>();
  const [nimiqAddress, setNimiqAddress] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    setLanguage(getLanguage());

    initNimiqSDK()
      .then(async (nimiq) => {
        const nAccounts = await nimiq.listAccounts();
        if (Array.isArray(nAccounts) && nAccounts.length > 0) {
          setNimiqAddress(nAccounts[0] as string);
        }
      })
      .catch(() => {
        // not in Nimiq Pay — that's fine
      });
  }, []);

  const connect = useCallback(async () => {
    storeConnect();
    try {
      const profile = await walletService.connect();
      setProfile(profile);
      setAddress(profile.address as `0x${string}`);
      const nAddr = walletService.getNimiqAddress();
      if (nAddr) setNimiqAddress(nAddr);
      // Fetch server-side profile (username, avatar)
      fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    }
  }, [storeConnect, setProfile, setAddress, setError, fetchProfile]);

  const handleDisconnect = useCallback(() => {
    walletService.disconnect();
    disconnect();
    resetVault();
    resetBorrow();
    resetGoals();
    resetChallenges();
    resetRecurring();
    resetProfile();
  }, [disconnect, resetVault, resetBorrow, resetGoals, resetChallenges, resetRecurring, resetProfile]);

  const requestDeviceId = useCallback(async (reason: string) => {
    try {
      const id = await requestId(reason);
      setDeviceId(id);
      return id;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const provider = getEthereumProvider();
    if (!provider) return;

    walletService.onAccountsChanged((accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        const addr = accounts[0] as `0x${string}`;
        setAddress(addr);
      }
    });

    return () => {
      walletService.removeListeners();
    };
  }, [disconnect, setAddress]);

  const signMessage = useCallback(async (message: string): Promise<string | null> => {
    try {
      const signature = await walletService.signMessage(message);
      return signature;
    } catch {
      return null;
    }
  }, []);

  return {
    status,
    profile,
    address,
    error,
    language,
    nimiqAddress,
    deviceId,
    connect,
    disconnect: handleDisconnect,
    signMessage,
    requestDeviceId,
    isConnected: status === "connected",
    isNimiqPay: isNimiqPay(),
  };
}
