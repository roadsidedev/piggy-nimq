import { create } from "zustand";

export type TxStatus = "idle" | "pending" | "confirming" | "confirmed" | "failed";

interface BorrowState {
  availableBorrow: string;
  borrowedAmount: string;
  healthFactor: number;
  liquidationThreshold: number;
  txStatus: TxStatus;
  txError: string | null;
  setAvailableBorrow: (value: string) => void;
  setBorrowedAmount: (value: string) => void;
  setHealthFactor: (value: number) => void;
  setLiquidationThreshold: (value: number) => void;
  setTxStatus: (status: TxStatus) => void;
  setTxError: (error: string | null) => void;
}

export const useBorrowStore = create<BorrowState>((set) => ({
  availableBorrow: "0.00",
  borrowedAmount: "0.00",
  healthFactor: 0,
  liquidationThreshold: 0,
  txStatus: "idle",
  txError: null,
  setAvailableBorrow: (availableBorrow) => set({ availableBorrow }),
  setBorrowedAmount: (borrowedAmount) => set({ borrowedAmount }),
  setHealthFactor: (healthFactor) => set({ healthFactor }),
  setLiquidationThreshold: (liquidationThreshold) => set({ liquidationThreshold }),
  setTxStatus: (txStatus) => set({ txStatus }),
  setTxError: (txError) => set({ txError }),
}));
