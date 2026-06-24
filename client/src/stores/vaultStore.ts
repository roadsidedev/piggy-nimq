import { create } from "zustand";
import type { TransactionRecord, TxStatus } from "@/types";

interface VaultState {
  balance: string;
  yieldEnabled: boolean;
  yieldAmount: string;
  apy: number;
  earnings: string;
  vaultAge: number;
  transactions: TransactionRecord[];
  depositModalOpen: boolean;
  withdrawModalOpen: boolean;
  txStatus: TxStatus;
  txError: string | null;
  setBalance: (balance: string) => void;
  setYieldEnabled: (enabled: boolean) => void;
  setYieldAmount: (amount: string) => void;
  setApy: (apy: number) => void;
  setEarnings: (earnings: string) => void;
  setVaultAge: (age: number) => void;
  addTransaction: (tx: TransactionRecord) => void;
  updateTransaction: (id: string, updates: Partial<TransactionRecord>) => void;
  setDepositModalOpen: (open: boolean) => void;
  setWithdrawModalOpen: (open: boolean) => void;
  setTxStatus: (status: TxStatus) => void;
  setTxError: (error: string | null) => void;
  reset: () => void;
}

export const useVaultStore = create<VaultState>((set) => ({
  balance: "0.00",
  yieldEnabled: false,
  yieldAmount: "0.00",
  apy: 0,
  earnings: "0.00",
  vaultAge: 0,
  transactions: [],
  depositModalOpen: false,
  withdrawModalOpen: false,
  txStatus: "idle",
  txError: null,
  setBalance: (balance) => set({ balance }),
  setYieldEnabled: (yieldEnabled) => set({ yieldEnabled }),
  setYieldAmount: (yieldAmount) => set({ yieldAmount }),
  setApy: (apy) => set({ apy }),
  setEarnings: (earnings) => set({ earnings }),
  setVaultAge: (vaultAge) => set({ vaultAge }),
  addTransaction: (tx) =>
    set((state) => ({ transactions: [tx, ...state.transactions] })),
  updateTransaction: (id, updates) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, ...updates } : t,
      ),
    })),
  setDepositModalOpen: (depositModalOpen) => set({ depositModalOpen }),
  setWithdrawModalOpen: (withdrawModalOpen) => set({ withdrawModalOpen }),
  setTxStatus: (txStatus) => set({ txStatus }),
  setTxError: (txError) => set({ txError }),
  reset: () =>
    set({
      balance: "0.00",
      yieldEnabled: false,
      yieldAmount: "0.00",
      apy: 0,
      earnings: "0.00",
      vaultAge: 0,
      transactions: [],
      depositModalOpen: false,
      withdrawModalOpen: false,
      txStatus: "idle",
      txError: null,
    }),
}));
