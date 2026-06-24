import { useCallback, useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWalletStore } from "@/stores/walletStore";
import { useBorrowStore } from "@/stores/borrowStore";
import { aaveService } from "@/integrations/aave";

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

  const { data: accountData } = useQuery({
    queryKey: ["userAccountData", address],
    queryFn: () => aaveService.getUserAccountData(address!),
    enabled: !!address,
    refetchInterval: 15000,
  });

  const { data: reserveData } = useQuery({
    queryKey: ["borrowReserveData"],
    queryFn: () => aaveService.getReserveData(),
    enabled: !!address,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!accountData) return;
    (async () => {
      const decimals = await aaveService.getDecimals();
      setAvailableBorrow(aaveService.fromUSDC(accountData.availableBorrowsBase, decimals));
      setBorrowedAmount(aaveService.fromUSDC(accountData.totalDebtBase, decimals));
    })();
    setHealthFactor(Number(accountData.healthFactor) / 1e18);
    setLiquidationThreshold(Number(accountData.currentLiquidationThreshold) / 1e4);
  }, [accountData, setAvailableBorrow, setBorrowedAmount, setHealthFactor, setLiquidationThreshold]);

  const borrowApy = useMemo(() => {
    if (!reserveData) return 0;
    return aaveService.getVariableBorrowRatePercent(reserveData.variableBorrowRate);
  }, [reserveData]);

  const currentDebt = useMemo(() => {
    const avail = Number(availableBorrow);
    const hf = healthFactor;
    if (avail <= 0 || hf <= 0) return 0;
    return avail / (1 + hf);
  }, [availableBorrow, healthFactor]);

  const simulatedHealthFactor = useMemo(() => {
    const simAmt = Number(simulatedBorrow);
    const avail = Number(availableBorrow);
    const hf = healthFactor;
    if (simAmt <= 0 || avail <= 0 || hf <= 0 || currentDebt <= 0) return hf;
    const newDebt = currentDebt + simAmt;
    return (hf * currentDebt) / newDebt;
  }, [simulatedBorrow, availableBorrow, healthFactor, currentDebt]);

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
      setTxStatus("pending");
      setTxError(null);

      try {
        const decimals = await aaveService.getDecimals();
        const parsed = aaveService.toUSDC(amount, decimals);
        setTxStatus("confirming");
        const hash = await aaveService.borrowWithConfirm(parsed, address);
        setTxStatus("confirmed");
        return hash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Borrow failed";
        setTxStatus("failed");
        setTxError(message);
        throw err;
      }
    },
    [address, setTxStatus, setTxError],
  );

  const repay = useCallback(
    async (amount: string) => {
      if (!address) throw new Error("Wallet not connected");
      setTxStatus("pending");
      setTxError(null);

      try {
        const decimals = await aaveService.getDecimals();
        const parsed = aaveService.toUSDC(amount, decimals);
        setTxStatus("confirming");
        const hash = await aaveService.repayWithConfirm(parsed, address);
        setTxStatus("confirmed");
        return hash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Repay failed";
        setTxStatus("failed");
        setTxError(message);
        throw err;
      }
    },
    [address, setTxStatus, setTxError],
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
