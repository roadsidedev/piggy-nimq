import { useState } from "react";
import { useWalletStore } from "@/stores/walletStore";
import { useVaultStore } from "@/stores/vaultStore";
import { useBorrowStore } from "@/stores/borrowStore";
import { useGoalsStore } from "@/stores/goalsStore";
import { useChallengesStore } from "@/stores/challengesStore";
import { useRecurringStore } from "@/stores/recurringStore";
import { useWallet } from "@/hooks/useWallet";
import { DonutChart } from "@/components/account/DonutChart";
import { RecurringConfig } from "@/components/account/RecurringConfig";
import { RecurringModal } from "@/components/account/RecurringModal";
import { TransactionHistory } from "@/components/vault/TransactionHistory";
import { EditProfileModal } from "@/components/account/EditProfileModal";
import { ShieldIcon, WalletIcon, FlameIcon, LogOutIcon, PencilIcon } from "./AccountIcons";
import type { RecurringFrequency } from "@/stores/recurringStore";

export function AccountPage() {
  const address = useWalletStore((s) => s.address);
  const { balance } = useVaultStore();
  const { borrowedAmount, healthFactor } = useBorrowStore();
  const goals = useGoalsStore((s) => s.goals);
  const challenges = useChallengesStore((s) => s.challenges);
  const { schedules, addSchedule, deleteSchedule, togglePause } = useRecurringStore();
  const { transactions } = useVaultStore();
  const { disconnect } = useWallet();
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const vaultNum = Number(balance) || 0;
  const totalSaved = vaultNum + goals.reduce((sum, g) => sum + Number(g.currentAmount), 0);

  const goalColors: string[] = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444"];
  const segments = [
    { label: "Vault", value: vaultNum, color: "#38761d" },
    ...goals.map((g, i) => ({
      label: g.title,
      value: Number(g.currentAmount),
      color: goalColors[i % goalColors.length]!,
    })),
  ].filter((s) => s.value > 0);

  const handleCreateSchedule = (
    amount: string,
    frequency: RecurringFrequency,
    dayOfWeek?: number,
    dayOfMonth?: number,
    goalId?: string,
  ) => {
    addSchedule({
      id: crypto.randomUUID(),
      amount,
      frequency,
      paused: false,
      createdAt: new Date().toISOString(),
      ...(frequency === "weekly" ? { dayOfWeek } : { dayOfMonth }),
      ...(goalId ? { goalId } : {}),
    });
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-600">
          {address ? address.slice(2, 4).toUpperCase() : "??"}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}
          </p>
          <p className="text-xs text-gray-500">
            {address ? "Connected via Nimiq Pay" : ""}
          </p>
        </div>
        <button
          onClick={() => setEditProfileOpen(true)}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-sage-600"
          title="Edit profile"
        >
          <PencilIcon size={18} />
        </button>
        <button
          onClick={disconnect}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-red-500"
          title="Disconnect wallet"
        >
          <LogOutIcon size={18} />
        </button>
      </div>

      <EditProfileModal open={editProfileOpen} onClose={() => setEditProfileOpen(false)} />

      {/* Savings Overview Donut */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Savings Overview</h3>
        {segments.length > 0 ? (
          <DonutChart segments={segments} total={totalSaved} />
        ) : (
          <p className="py-4 text-center text-sm text-gray-500">No savings yet</p>
        )}
      </div>

      {/* Loan Balance */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <WalletIcon size={18} className="text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Loan Balance</h3>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-gray-900">${borrowedAmount}</p>
            <p className="text-xs text-gray-500">Borrowed against vault</p>
          </div>
          <div className="flex flex-col items-center">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ${
                healthFactor > 2
                  ? "bg-sage-100 text-sage-700"
                  : healthFactor > 1.5
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {!isFinite(healthFactor) || healthFactor > 999 ? "999+" : healthFactor.toFixed(1)}
            </div>
            <span className="mt-1 text-[11px] font-medium text-gray-500">Health</span>
          </div>
        </div>
      </div>

      {/* Active Challenges */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <FlameIcon size={18} className="text-orange-500" />
          <h3 className="text-sm font-semibold text-gray-900">Active Challenges</h3>
        </div>
        {challenges.length === 0 ? (
          <p className="mt-2 text-center text-sm text-gray-500">No active challenges</p>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {challenges.slice(0, 3).map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">{c.title}</p>
                  <p className="text-xs text-gray-400">{c.members.length} members</p>
                </div>
                <div className="flex items-center gap-1">
                  <FlameIcon size={12} className="text-orange-400" />
                  <span className="text-xs font-semibold text-orange-500">{c.streak}d</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recurring Savings */}
      <RecurringConfig
        schedules={schedules}
        onAdd={() => setRecurringModalOpen(true)}
        onDelete={deleteSchedule}
        onTogglePause={togglePause}
      />

      <RecurringModal
        open={recurringModalOpen}
        onClose={() => setRecurringModalOpen(false)}
        onSubmit={handleCreateSchedule}
        goals={goals.map((g) => ({ id: g.id, title: g.title }))}
      />

      {/* Transaction History */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <ShieldIcon size={18} className="text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Transaction History</h3>
        </div>
        <TransactionHistory transactions={transactions} />
      </div>
    </div>
  );
}
