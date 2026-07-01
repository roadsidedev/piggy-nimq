import { useCallback, useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWalletStore } from "@/stores/walletStore";
import { useBorrowStore } from "@/stores/borrowStore";
import { piggyVaultService } from "@/integrations/contracts";

export function useBorrow() {
  const address = useWalletStore((s) => s.address);
  const {
    availableBorrow,
    borrowedAmount,
    healthFactor,
    liquidationThreshold,
    txStatus,
    txError,
    setAvailableBorrow,
    setBorrowedAmount,
    setHealthFactor,
    setLiquidationThreshold,
    setTxStatus,
    setTxError,
  } = useBorrowStore();
  const [simulatedBorrow, setSimulatedBorrow] = useState<string>("0");

  const { data: decimals } = useQuery({
    queryKey: ["decimals"],
    queryFn: () => piggyVaultService.getDecimals(),
    enabled: !!address,
  });

  const { data: vaultPosition } = useQuery({
    queryKey: ["vaultPosition", address],
    queryFn: () => piggyVaultService.getUserPosition(address!),
    enabled: !!address,
    refetchInterval: 5000,
  });

  const { data: maxBorrowable } = useQuery({
    queryKey: ["maxBorrowable", address],
    queryFn: () => piggyVaultService.getMaxBorrowable(address!),
    enabled: !!address,
    refetchInterval: 5000,
  });

  const LTV_BPS = 5000; // vault's maxUserLTVBps = 50%
  const LIQUIDATION_HF = 1.5; // vault's minHealthFactorBuffer

  useEffect(() => {
    if (!vaultPosition || decimals === undefined) return;
    const debt = Number(vaultPosition.debtValue);
    const maxB = maxBorrowable !== undefined ? Number(maxBorrowable) : 0;
    const maxFromCollateral = debt + maxB;

    setAvailableBorrow(
      maxBorrowable !== undefined
        ? piggyVaultService.fromUnits(maxBorrowable, decimals)
        : "0",
    );
    setBorrowedAmount(piggyVaultService.fromUnits(vaultPosition.debtValue, decimals));
    setLiquidationThreshold(LIQUIDATION_HF);

    // Compute HF from vault's LTV cap: HF = (collateral * liquidationThreshold) / debt
    // The vault enforces LTV = 50%, so collateral ≈ debt / 0.5 when near cap
    if (debt > 0 && maxFromCollateral > 0) {
      const collateralUSD = maxFromCollateral / (LTV_BPS / 1e4);
      const ltvThreshold = LIQUIDATION_HF;
      const hf = (collateralUSD * ltvThreshold) / debt;
      setHealthFactor(isFinite(hf) ? Math.min(hf, 999) : 999);
    } else {
      setHealthFactor(debt > 0 ? 1.0 : 999);
    }
  }, [vaultPosition, maxBorrowable, decimals, setAvailableBorrow, setBorrowedAmount, setHealthFactor, setLiquidationThreshold]);

  const borrowApy = 5.0; // fixed APY for testnet — reflects MockAaveAdapter

  const currentDebt = useMemo(() => {
    const avail = Number(availableBorrow);
    const hf = healthFactor;
    if (avail <= 0 || hf <= 0) return 0;
    return avail / (1 + hf);
  }, [availableBorrow, healthFactor]);

  const simulatedHealthFactor = useMemo(() => {
    const simAmt = Number(simulatedBorrow);
    const maxB = Number(availableBorrow);
    const currentB = Number(borrowedAmount);
    if (simAmt <= 0 || maxB <= 0) return healthFactor;
    // Simple simulation: HF decreases proportionally as borrow increases relative to max
    const totalBorrow = currentB + simAmt;
    const ratio = totalBorrow / (currentB + maxB);
    return Math.max(1.0, (1 - ratio) * 5 + 1);
  }, [simulatedBorrow, availableBorrow, borrowedAmount, healthFactor]);

  const monthlyInterest = useMemo(() => {
    const simAmt = Number(simulatedBorrow);
    if (simAmt <= 0 || borrowApy <= 0) return "0.00";
    return ((simAmt * borrowApy) / 100 / 12).toFixed(2);
  }, [simulatedBorrow, borrowApy]);

  const riskLevel: "safe" | "warning" | "danger" =
    simulatedHealthFactor > 3 ? "safe" : simulatedHealthFactor > 1.5 ? "warning" : "danger";

  const borrow = useCallback(
    async (amount: string) => {
      if (!address) throw new Error("Wallet not connected");
      if (decimals === undefined) throw new Error("Decimals not loaded");
      setTxStatus("pending");
      setTxError(null);

      try {
        const parsed = piggyVaultService.toUnits(amount, decimals);
        setTxStatus("confirming");
        const hash = await piggyVaultService.borrow(parsed);
        setTxStatus("confirmed");
        return hash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Borrow failed";
        setTxStatus("failed");
        setTxError(message);
        throw err;
      }
    },
    [address, decimals, setTxStatus, setTxError],
  );

  const repay = useCallback(
    async (amount: string) => {
      if (!address) throw new Error("Wallet not connected");
      if (decimals === undefined) throw new Error("Decimals not loaded");
      setTxStatus("pending");
      setTxError(null);

      try {
        const parsed = piggyVaultService.toUnits(amount, decimals);
        setTxStatus("confirming");
        const hash = await piggyVaultService.repay(parsed, true);
        setTxStatus("confirmed");
        return hash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Repay failed";
        setTxStatus("failed");
        setTxError(message);
        throw err;
      }
    },
    [address, decimals, setTxStatus, setTxError],
  );

  return {
    availableBorrow,
    borrowedAmount,
    healthFactor,
    liquidationThreshold,
    borrowApy,
    monthlyInterest,
    currentDebt,
    txStatus,
    txError,
    simulatedBorrow,
    simulatedHealthFactor,
    riskLevel,
    setSimulatedBorrow,
    borrow,
    repay,
  };
}
