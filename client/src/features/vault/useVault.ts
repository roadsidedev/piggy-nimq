import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useWalletStore } from "@/stores/walletStore";
import { useVaultStore } from "@/stores/vaultStore";
import { aaveService } from "@/integrations/aave";
import { piggyVaultService } from "@/integrations/contracts";
import { trackError } from "@/utils/analytics";
import { useCreateTransaction } from "@/hooks/useTransactions";

export function useVault() {
  const address = useWalletStore((s) => s.address);
  const createTx = useCreateTransaction();
  const {
    balance,
    yieldEnabled,
    yieldAmount,
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
    setYieldAmount,
    setApy,
    setEarnings,
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
      const apyPercent = aaveService.getLiquidityRatePercent(
        reserveData.liquidityRate,
      );
      setApy(apyPercent);
    }
  }, [reserveData, setApy]);

  const fetchBalance = useCallback(async () => {
    if (!address) return;
    try {
      const decimals = await piggyVaultService.getDecimals();
      const position = await piggyVaultService.getUserPosition(address);
      // Total balance = idle (non-yield) + yield value
      const totalRaw = position.unallocated + position.yieldValue;
      const formatted = piggyVaultService.fromUnits(totalRaw, decimals);
      setBalance(formatted);

      // Yield state: if yieldValue > 0, yield is enabled
      if (position.yieldValue > 0n) {
        setYieldEnabled(true);
        const yv = piggyVaultService.fromUnits(position.yieldValue, decimals);
        setYieldAmount(yv);

        // Estimate earnings: yieldValue - principal is not tracked on-chain,
        // so display yieldValue as the "earning" balance
        setEarnings(yv);
      } else {
        setEarnings("0.00");
      }
    } catch (err) {
      trackError(
        err instanceof Error ? err : new Error("fetchBalance failed"),
        { context: "useVault" },
      );
    }
  }, [address, setBalance, setYieldEnabled, setYieldAmount, setEarnings]);

  const deposit = useCallback(
    async (amount: string) => {
      if (!address) throw new Error("Wallet not connected");
      setTxStatus("pending");
      setTxError(null);

      try {
        const decimals = await piggyVaultService.getDecimals();
        const parsed = piggyVaultService.toUnits(amount, decimals);

        const txRecord = {
          id: crypto.randomUUID(),
          type: "deposit" as const,
          amount: amount,
          timestamp: new Date(),
          status: "pending" as const,
        };
        addTransaction(txRecord);

        setTxStatus("confirming");
        updateTransaction(txRecord.id, { status: "confirming" });

        const hash = await piggyVaultService.deposit(parsed);

        setTxStatus("confirmed");
        updateTransaction(txRecord.id, {
          status: "confirmed",
          txHash: hash,
        });

        createTx.mutate({
          type: "deposit",
          amount,
          txHash: hash,
          status: "confirmed",
        });

        toast.success(`Deposited $${amount} USDT`);
        await fetchBalance();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Deposit failed";
        trackError(
          err instanceof Error ? err : new Error(message),
          { context: "useVault.deposit" },
        );
        setTxStatus("failed");
        setTxError(message);
        toast.error(message);
        throw err;
      }
    },
    [address, setTxStatus, setTxError, addTransaction, updateTransaction, createTx, fetchBalance],
  );

  const withdraw = useCallback(
    async (amount: string, _source?: string) => {
      if (!address) throw new Error("Wallet not connected");
      setTxStatus("pending");
      setTxError(null);

      try {
        const decimals = await piggyVaultService.getDecimals();
        const parsed = piggyVaultService.toUnits(amount, decimals);

        setTxStatus("confirming");
        // If source is "yield", withdraw from yield position instead
        if (_source === "yield") {
          await piggyVaultService.disableYield(parsed);
        }
        const hash = await piggyVaultService.withdraw(parsed);

        addTransaction({
          id: crypto.randomUUID(),
          type: "withdraw",
          amount,
          timestamp: new Date(),
          status: "confirmed",
          txHash: hash,
        });

        createTx.mutate({
          type: "withdraw",
          amount,
          txHash: hash,
          status: "confirmed",
        });

        setTxStatus("confirmed");
        toast.success(`Withdrew $${amount} USDT`);
        await fetchBalance();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Withdraw failed";
        trackError(
          err instanceof Error ? err : new Error(message),
          { context: "useVault.withdraw" },
        );
        setTxStatus("failed");
        setTxError(message);
        toast.error(message);
        throw err;
      }
    },
    [address, setTxStatus, setTxError, addTransaction, createTx, fetchBalance],
  );

  const confirmYield = useCallback(
    async (amount: string) => {
      if (!address) throw new Error("Wallet not connected");
      setTxStatus("pending");
      setTxError(null);

      try {
        const decimals = await piggyVaultService.getDecimals();
        const parsed = piggyVaultService.toUnits(amount, decimals);

        const txRecord = {
          id: crypto.randomUUID(),
          type: "yield" as const,
          amount,
          timestamp: new Date(),
          status: "pending" as const,
        };
        addTransaction(txRecord);

        setTxStatus("confirming");
        updateTransaction(txRecord.id, { status: "confirming" });

        let hash: `0x${string}`;
        if (yieldEnabled) {
          // Already has yield position → adjust (disable all + enable new amount)
          hash = await piggyVaultService.adjustYield(parsed);
        } else {
          // New yield enable
          hash = await piggyVaultService.enableYield(parsed);
        }

        setTxStatus("confirmed");
        updateTransaction(txRecord.id, {
          status: "confirmed",
          txHash: hash,
        });

        createTx.mutate({
          type: "yield",
          amount,
          txHash: hash,
          status: "confirmed",
        });

        setYieldEnabled(true);
        setYieldAmount(amount);
        toast.success(`Yield enabled on $${amount} USDT`);
        await fetchBalance();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to enable yield";
        trackError(
          err instanceof Error ? err : new Error(message),
          { context: "useVault.confirmYield" },
        );
        setTxStatus("failed");
        setTxError(message);
        toast.error(message);
        throw err;
      }
    },
    [
      address,
      yieldEnabled,
      setTxStatus,
      setTxError,
      addTransaction,
      updateTransaction,
      createTx,
      setYieldEnabled,
      setYieldAmount,
      fetchBalance,
    ],
  );

  const adjustYield = useCallback(() => {
    // Re-open the expanded panel — caller handles UI state
  }, []);

  const disableYield = useCallback(async () => {
    if (!address) throw new Error("Wallet not connected");
    setTxStatus("pending");
    setTxError(null);

    try {
      setTxStatus("confirming");
      // Disable all yield at once
      const hash = await piggyVaultService.disableAllYield();

      addTransaction({
        id: crypto.randomUUID(),
        type: "withdraw",
        amount: yieldAmount,
        timestamp: new Date(),
        status: "confirmed",
        txHash: hash,
      });

      createTx.mutate({
        type: "withdraw",
        amount: yieldAmount,
        txHash: hash,
        status: "confirmed",
      });

      setYieldEnabled(false);
      setYieldAmount("0.00");
      setTxStatus("confirmed");
      toast.success("Yield disabled");
      await fetchBalance();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to disable yield";
      trackError(
        err instanceof Error ? err : new Error(message),
        { context: "useVault.disableYield" },
      );
      setTxStatus("failed");
      setTxError(message);
      toast.error(message);
      throw err;
    }
  }, [
    address,
    yieldAmount,
    setTxStatus,
    setTxError,
    addTransaction,
    createTx,
    setYieldEnabled,
    setYieldAmount,
    fetchBalance,
  ]);

  useEffect(() => {
    if (address) {
      fetchBalance();
    }
  }, [address, fetchBalance]);

  return {
    balance,
    yieldEnabled,
    yieldAmount,
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
    confirmYield,
    adjustYield,
    disableYield,
    openDepositModal: () => setDepositModalOpen(true),
    closeDepositModal: () => setDepositModalOpen(false),
    openWithdrawModal: () => setWithdrawModalOpen(true),
    closeWithdrawModal: () => setWithdrawModalOpen(false),
  };
}
