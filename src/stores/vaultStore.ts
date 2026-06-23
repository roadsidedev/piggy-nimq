import { create } from "zustand";

export type TxStatus = "idle" | "pending" | "confirming" | "confirmed" | "failed";

interface TransactionRecord {
  id: string;
  type: "deposit" | "withdraw" | "borrow" | "repay" | "yield";
  amount: string;
  timestamp: Date;
  status: TxStatus;
  txHash?: string;
  error?: string;
}

interface VaultState {
  balance: string;
  yieldEnabled: boolean;
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
  setApy: (apy: number) => void;
  setEarnings: (earnings: string) => void;
  setVaultAge: (age: number) => void;
  addTransaction: (tx: TransactionRecord) => void;
  updateTransaction: (id: string, updates: Partial<TransactionRecord>) => void;
  setDepositModalOpen: (open: boolean) => void;
  setWithdrawModalOpen: (open: boolean) => void;
  setTxStatus: (status: TxStatus) => void;
  setTxError: (error: string | null) => void;
}

export const useVaultStore = create<VaultState>((set) => ({
  balance: "0.00",
  yieldEnabled: false,
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
}));
