import { useCallback, useEffect, useState } from "react";
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

  useEffect(() => {
    if (!accountData) return;
    const decimals = 6;
    setAvailableBorrow(aaveService.fromUSDC(accountData.availableBorrowsBase, decimals));
    setBorrowedAmount(aaveService.fromUSDC(accountData.totalDebtBase, decimals));
    setHealthFactor(Number(accountData.healthFactor) / 1e18);
    setLiquidationThreshold(Number(accountData.currentLiquidationThreshold) / 1e4);
  }, [accountData, setAvailableBorrow, setBorrowedAmount, setHealthFactor, setLiquidationThreshold]);

  const simulatedHealthFactor =
    Number(simulatedBorrow) > 0 && Number(availableBorrow) > 0
      ? healthFactor * (1 - Number(simulatedBorrow) / Number(availableBorrow))
      : healthFactor;

  const riskLevel: "safe" | "warning" | "danger" =
    simulatedHealthFactor > 3 ? "safe" : simulatedHealthFactor > 1.5 ? "warning" : "danger";

  const borrow = useCallback(
    async (amount: string) => {
      if (!address) throw new Error("Wallet not connected");
      setTxStatus("pending");
      setTxError(null);

      try {
        const decimals = 6;
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
        const decimals = 6;
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
