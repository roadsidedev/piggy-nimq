import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWalletStore } from "@/stores/walletStore";
import { useVaultStore } from "@/stores/vaultStore";
import { useBorrowStore } from "@/stores/borrowStore";
import { useGoalsStore } from "@/stores/goalsStore";
import { useChallengesStore } from "@/stores/challengesStore";
import { aaveService } from "@/integrations/aave";

export function useDashboard() {
  const address = useWalletStore((s) => s.address);
  const { balance, yieldEnabled, apy, setBalance, setApy } = useVaultStore();
  const { borrowedAmount, healthFactor, setBorrowedAmount, setHealthFactor } = useBorrowStore();
  const goals = useGoalsStore((s) => s.goals);
  const challenges = useChallengesStore((s) => s.challenges);

  const { data: usdcBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ["usdcBalance", address],
    queryFn: async () => {
      if (!address) return null;
      const decimals = await aaveService.getDecimals();
      const raw = await aaveService.getUsdcBalance(address);
      return aaveService.fromUSDC(raw, decimals);
    },
    enabled: !!address,
    refetchInterval: 30000,
  });

  const { data: accountData, isLoading: accountLoading } = useQuery({
    queryKey: ["accountData", address],
    queryFn: () => aaveService.getUserAccountData(address!),
    enabled: !!address,
    refetchInterval: 30000,
  });

  const { data: reserveData, isLoading: reserveLoading } = useQuery({
    queryKey: ["reserveData"],
    queryFn: () => aaveService.getReserveData(),
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (usdcBalance) setBalance(usdcBalance);
  }, [usdcBalance, setBalance]);

  useEffect(() => {
    if (reserveData) setApy(aaveService.getLiquidityRatePercent(reserveData.liquidityRate));
  }, [reserveData, setApy]);

  useEffect(() => {
    if (accountData) {
      const decimals = 6;
      setBorrowedAmount(aaveService.fromUSDC(accountData.totalDebtBase, decimals));
      setHealthFactor(Number(accountData.healthFactor) / 1e18);
    }
  }, [accountData, setBorrowedAmount, setHealthFactor]);

  const monthlyEarnings =
    yieldEnabled && apy > 0 && Number(balance) > 0
      ? ((Number(balance) * apy) / 100 / 12).toFixed(2)
      : "0.00";

  const isLoading = balanceLoading || accountLoading || reserveLoading;

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
