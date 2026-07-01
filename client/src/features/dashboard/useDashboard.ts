import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWalletStore } from "@/stores/walletStore";
import { useVaultStore } from "@/stores/vaultStore";
import { useBorrowStore } from "@/stores/borrowStore";
import { useGoalsStore } from "@/stores/goalsStore";
import { useChallengesStore } from "@/stores/challengesStore";
import { aaveService } from "@/integrations/aave";
import { piggyVaultService } from "@/integrations/contracts";

export function useDashboard() {
  const address = useWalletStore((s) => s.address);
  const { balance, yieldEnabled, apy, setBalance, setApy, setYieldEnabled, setYieldAmount } = useVaultStore();
  const { borrowedAmount, healthFactor, setBorrowedAmount, setHealthFactor } = useBorrowStore();
  const goals = useGoalsStore((s) => s.goals);
  const challenges = useChallengesStore((s) => s.challenges);

  // Read user's vault position
  const { data: vaultPosition, isLoading: vaultLoading } = useQuery({
    queryKey: ["vaultPosition", address],
    queryFn: async () => {
      if (!address) return null;
      return piggyVaultService.getUserPosition(address);
    },
    enabled: !!address,
    refetchInterval: 30000,
  });

  // Read Aave reserve data for APY (gracefully degrades on testnet)
  const { data: reserveData, isLoading: reserveLoading } = useQuery({
    queryKey: ["reserveData"],
    queryFn: async () => {
      try {
        return await aaveService.getReserveData();
      } catch {
        return null;
      }
    },
    refetchInterval: 30000,
    retry: 1,
  });

  // Sync vault position to store
  useEffect(() => {
    if (!vaultPosition) return;
    (async () => {
      const decimals = await piggyVaultService.getDecimals();
      const totalRaw = vaultPosition.unallocated + vaultPosition.yieldValue;
      setBalance(piggyVaultService.fromUnits(totalRaw, decimals));

      // Debt from vault
      const debtRaw = vaultPosition.debtValue;
      setBorrowedAmount(piggyVaultService.fromUnits(debtRaw, decimals));

      // Yield state
      const hasYield = vaultPosition.yieldValue > 0n;
      setYieldEnabled(hasYield);
      if (hasYield) {
        setYieldAmount(piggyVaultService.fromUnits(vaultPosition.yieldValue, decimals));
      }
    })();
  }, [vaultPosition, setBalance, setBorrowedAmount, setYieldEnabled, setYieldAmount]);

  useEffect(() => {
    if (reserveData && reserveData.liquidityRate > 0n) {
      setApy(aaveService.getLiquidityRatePercent(reserveData.liquidityRate));
    } else {
      setApy(5.0); // default APY for testnet
    }
  }, [reserveData, setApy]);

  // Read health factor from Aave adapter via vault's debt tracking
  useEffect(() => {
    if (!address || !vaultPosition) return;
    // Health factor comes from Aave's user account data (pooled position)
    // For display we estimate based on debt/collateral ratio
    const debtValue = Number(vaultPosition.debtValue);
    const yieldValue = Number(vaultPosition.yieldValue);
    if (debtValue > 0 && yieldValue > 0) {
      const ratio = yieldValue / debtValue;
      // Rough health factor (actual value depends on Aave's liquidation threshold)
      const hf = (ratio * 0.75).toFixed(2); // 75% liquidation threshold assumption
      setHealthFactor(Number(hf));
    } else if (debtValue === 0 && yieldValue > 0) {
      setHealthFactor(999); // No debt = infinite health
    } else {
      setHealthFactor(0);
    }
  }, [address, vaultPosition, setHealthFactor]);

  const monthlyEarnings =
    yieldEnabled && apy > 0 && Number(balance) > 0
      ? ((Number(balance) * apy) / 100 / 12).toFixed(2)
      : "0.00";

  const isLoading = vaultLoading || reserveLoading;

  return {
    balance,
    yieldEnabled,
    apy,
    isLoading,
    monthlyEarnings,
    borrowedAmount,
    healthFactor,
    goals,
    challenges,
  };
}
