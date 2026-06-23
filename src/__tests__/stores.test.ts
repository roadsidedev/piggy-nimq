import { describe, it, expect, beforeEach } from "vitest";
import { useVaultStore } from "@/stores/vaultStore";
import { useGoalsStore } from "@/stores/goalsStore";
import { useBorrowStore } from "@/stores/borrowStore";
import { useWalletStore } from "@/stores/walletStore";

describe("vaultStore", () => {
  beforeEach(() => {
    useVaultStore.getState().reset();
  });

  it("initializes with default values", () => {
    const state = useVaultStore.getState();
    expect(state.balance).toBe("0.00");
    expect(state.yieldEnabled).toBe(false);
    expect(state.apy).toBe(0);
    expect(state.transactions).toEqual([]);
    expect(state.txStatus).toBe("idle");
    expect(state.txError).toBeNull();
  });

  it("sets balance", () => {
    useVaultStore.getState().setBalance("100.50");
    expect(useVaultStore.getState().balance).toBe("100.50");
  });

  it("sets apy", () => {
    useVaultStore.getState().setApy(5.5);
    expect(useVaultStore.getState().apy).toBe(5.5);
  });

  it("adds and updates transactions", () => {
    const tx = { id: "1", type: "deposit" as const, amount: "50", timestamp: new Date(), status: "pending" as const };
    useVaultStore.getState().addTransaction(tx);
    expect(useVaultStore.getState().transactions).toHaveLength(1);

    useVaultStore.getState().updateTransaction("1", { status: "confirmed", txHash: "0xabc" });
    const updated = useVaultStore.getState().transactions[0];
    expect(updated?.status).toBe("confirmed");
    expect(updated?.txHash).toBe("0xabc");
  });

  it("resets to defaults", () => {
    useVaultStore.getState().setBalance("500");
    useVaultStore.getState().reset();
    expect(useVaultStore.getState().balance).toBe("0.00");
  });
});

describe("goalsStore", () => {
  beforeEach(() => {
    useGoalsStore.getState().reset();
  });

  it("initializes with empty goals", () => {
    expect(useGoalsStore.getState().goals).toEqual([]);
  });

  it("adds a goal", () => {
    useGoalsStore.getState().addGoal({
      id: "1", title: "Save for X", targetAmount: "1000", currentAmount: "100",
      targetDate: null, createdAt: new Date().toISOString(),
    });
    expect(useGoalsStore.getState().goals).toHaveLength(1);
  });

  it("allocates funds to a goal", () => {
    useGoalsStore.getState().addGoal({
      id: "1", title: "Save for X", targetAmount: "1000", currentAmount: "100",
      targetDate: null, createdAt: new Date().toISOString(),
    });
    useGoalsStore.getState().allocateFunds("1", "50.25");
    const goal = useGoalsStore.getState().goals[0];
    expect(goal?.currentAmount).toBe("150.25");
  });

  it("transfers funds between goals", () => {
    useGoalsStore.getState().addGoal({
      id: "1", title: "Goal A", targetAmount: "1000", currentAmount: "200",
      targetDate: null, createdAt: new Date().toISOString(),
    });
    useGoalsStore.getState().addGoal({
      id: "2", title: "Goal B", targetAmount: "500", currentAmount: "50",
      targetDate: null, createdAt: new Date().toISOString(),
    });
    useGoalsStore.getState().transferFunds("1", "2", "30");
    const goals = useGoalsStore.getState().goals;
    expect(goals.find((g) => g.id === "1")?.currentAmount).toBe("170");
    expect(goals.find((g) => g.id === "2")?.currentAmount).toBe("80");
  });

  it("resets to empty", () => {
    useGoalsStore.getState().addGoal({
      id: "1", title: "Test", targetAmount: "100", currentAmount: "0",
      targetDate: null, createdAt: new Date().toISOString(),
    });
    useGoalsStore.getState().reset();
    expect(useGoalsStore.getState().goals).toEqual([]);
  });
});

describe("borrowStore", () => {
  beforeEach(() => {
    useBorrowStore.getState().reset();
  });

  it("initializes with default values", () => {
    const state = useBorrowStore.getState();
    expect(state.availableBorrow).toBe("0.00");
    expect(state.borrowedAmount).toBe("0.00");
    expect(state.healthFactor).toBe(0);
    expect(state.txStatus).toBe("idle");
    expect(state.txError).toBeNull();
  });

  it("sets borrow values", () => {
    useBorrowStore.getState().setAvailableBorrow("500");
    useBorrowStore.getState().setBorrowedAmount("200");
    useBorrowStore.getState().setHealthFactor(3.5);
    const state = useBorrowStore.getState();
    expect(state.availableBorrow).toBe("500");
    expect(state.borrowedAmount).toBe("200");
    expect(state.healthFactor).toBe(3.5);
  });

  it("sets and clears error", () => {
    useBorrowStore.getState().setTxError("Something went wrong");
    expect(useBorrowStore.getState().txError).toBe("Something went wrong");
    useBorrowStore.getState().setTxError(null);
    expect(useBorrowStore.getState().txError).toBeNull();
  });
});

describe("walletStore", () => {
  beforeEach(() => {
    useWalletStore.getState().reset();
  });

  it("initializes as disconnected", () => {
    const state = useWalletStore.getState();
    expect(state.status).toBe("disconnected");
    expect(state.profile).toBeNull();
    expect(state.address).toBeNull();
    expect(state.error).toBeNull();
  });

  it("sets connecting state", async () => {
    await useWalletStore.getState().connect();
    expect(useWalletStore.getState().status).toBe("connecting");
  });

  it("sets profile on connect", () => {
    useWalletStore.getState().setProfile({ address: "0x123", name: "test" });
    expect(useWalletStore.getState().status).toBe("connected");
    expect(useWalletStore.getState().profile?.address).toBe("0x123");
  });

  it("disconnects and clears state", () => {
    useWalletStore.getState().setProfile({ address: "0x123", name: "test" });
    useWalletStore.getState().disconnect();
    const state = useWalletStore.getState();
    expect(state.status).toBe("disconnected");
    expect(state.profile).toBeNull();
    expect(state.address).toBeNull();
  });
});
