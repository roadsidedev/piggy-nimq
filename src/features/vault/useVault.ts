import { useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWalletStore } from "@/stores/walletStore";
import { useVaultStore } from "@/stores/vaultStore";
import { aaveService } from "@/integrations/aave";
import { trackError } from "@/utils/analytics";

export function useVault() {
  const address = useWalletStore((s) => s.address);
  const {
    balance,
    yieldEnabled,
    apy,
    earnings,
    vaultAge,
    transactions,
    depositModalOpen,
    withdrawModalOpen,
    txStatus,
    txError,
    setBalance,
    setYieldEnabled,
    setApy,
    addTransaction,
    updateTransaction,
    setDepositModalOpen,
    setWithdrawModalOpen,
    setTxStatus,
    setTxError,
  } = useVaultStore();

  const { data: reserveData } = useQuery({
    queryKey: ["aaveReserveData"],
    queryFn: () => aaveService.getReserveData(),
    enabled: yieldEnabled,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (reserveData) {
      const apyPercent = aaveService.getLiquidityRatePercent(reserveData.liquidityRate);
      setApy(apyPercent);
    }
  }, [reserveData, setApy]);

  const fetchBalance = useCallback(async () => {
    if (!address) return;
    try {
      const decimals = await aaveService.getDecimals();
      const rawBalance = await aaveService.getAUsdcBalance(address);
      const formatted = aaveService.fromUSDC(rawBalance, decimals);
      setBalance(formatted);
    } catch (err) {
      trackError(err instanceof Error ? err : new Error("fetchBalance failed"), { context: "useVault" });
    }
  }, [address, setBalance]);

  const deposit = useCallback(
    async (amount: string) => {
      if (!address) throw new Error("Wallet not connected");
      setTxStatus("pending");
      setTxError(null);

      try {
        const decimals = await aaveService.getDecimals();
        const parsed = aaveService.toUSDC(amount, decimals);

        const txRecord = {
          id: crypto.randomUUID(),
          type: "deposit" as const,
          amount: parsed.toString(),
          timestamp: new Date(),
          status: "pending" as const,
        };
        addTransaction(txRecord);

        setTxStatus("confirming");
        updateTransaction(txRecord.id, { status: "confirming" });

        const { supplyHash } = await aaveService.supplyWithAllowanceCheck(parsed, address);

        setTxStatus("confirmed");
        updateTransaction(txRecord.id, { status: "confirmed", txHash: supplyHash });

        await fetchBalance();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Deposit failed";
        trackError(err instanceof Error ? err : new Error(message), { context: "useVault.deposit" });
        setTxStatus("failed");
        setTxError(message);
        throw err;
      }
    },
    [address, setTxStatus, setTxError, addTransaction, updateTransaction, fetchBalance],
  );

  const withdraw = useCallback(
    async (amount: string) => {
      if (!address) throw new Error("Wallet not connected");
      setTxStatus("pending");
      setTxError(null);

      try {
        const decimals = await aaveService.getDecimals();
        const parsed = aaveService.toUSDC(amount, decimals);

        setTxStatus("confirming");
        const hash = await aaveService.withdrawWithConfirm(parsed, address);

        addTransaction({
          id: crypto.randomUUID(),
          type: "withdraw",
          amount: parsed.toString(),
          timestamp: new Date(),
          status: "confirmed",
          txHash: hash,
        });

        setTxStatus("confirmed");
        await fetchBalance();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Withdraw failed";
        trackError(err instanceof Error ? err : new Error(message), { context: "useVault.withdraw" });
        setTxStatus("failed");
        setTxError(message);
        throw err;
      }
    },
    [address, setTxStatus, setTxError, addTransaction, fetchBalance],
  );

  useEffect(() => {
    if (address) {
      fetchBalance();
    }
  }, [address, fetchBalance]);

  return {
    balance,
    yieldEnabled,
    apy,
    earnings,
    vaultAge,
    transactions,
    depositModalOpen,
    withdrawModalOpen,
    txStatus,
    txError,
    deposit,
    withdraw,
    toggleYield: () => setYieldEnabled(!yieldEnabled),
    openDepositModal: () => setDepositModalOpen(true),
    closeDepositModal: () => setDepositModalOpen(false),
    openWithdrawModal: () => setWithdrawModalOpen(true),
    closeWithdrawModal: () => setWithdrawModalOpen(false),
  };
}
