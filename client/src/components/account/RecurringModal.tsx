import { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import type { RecurringFrequency } from "@/stores/recurringStore";

interface Goal {
  id: string;
  title: string;
}

interface RecurringModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (amount: string, frequency: RecurringFrequency, dayOfWeek?: number, dayOfMonth?: number, goalId?: string) => void;
  goals: Goal[];
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export function RecurringModal({ open, onClose, onSubmit, goals }: RecurringModalProps) {
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<RecurringFrequency>("weekly");
  const [dayOfWeek, setDayOfWeek] = useState<number>(new Date().getDay());
  const [dayOfMonth, setDayOfMonth] = useState<number>(new Date().getDate());
  const [goalId, setGoalId] = useState<string>("");

  const handleSubmit = () => {
    if (!amount || Number(amount) <= 0) return;
    onSubmit(
      amount,
      frequency,
      frequency === "weekly" ? dayOfWeek : undefined,
      frequency === "monthly" ? dayOfMonth : undefined,
      goalId || undefined,
    );
    setAmount("");
    setFrequency("weekly");
    setDayOfWeek(new Date().getDay());
    setDayOfMonth(new Date().getDate());
    setGoalId("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Set Up Recurring Savings">
      <div className="flex flex-col gap-4">
        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-300">Amount (USDT)</label>
          <div className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 focus-within:ring-2 focus-within:ring-green-600">
            <span className="text-neutral-500">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 outline-none"
            />
          </div>
        </div>

        {/* Frequency */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-300">Frequency</label>
          <div className="flex gap-2">
            {(["weekly", "monthly"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                  frequency === f
                    ? "bg-green-600 text-white"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Day of Week (if weekly) */}
        {frequency === "weekly" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-300">Day of Week</label>
            <div className="grid grid-cols-7 gap-1">
              {DAYS_OF_WEEK.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDayOfWeek(d.value)}
                  className={`rounded-lg py-2 text-xs font-medium transition-colors ${
                    dayOfWeek === d.value
                      ? "bg-green-600 text-white"
                      : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Day of Month (if monthly) */}
        {frequency === "monthly" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-300">Day of Month</label>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <button
                  key={d}
                  onClick={() => setDayOfMonth(d)}
                  className={`rounded-lg py-2 text-xs font-medium transition-colors ${
                    dayOfMonth === d
                      ? "bg-green-600 text-white"
                      : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Goal Link */}
        {goals.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-300">Link to Goal (optional)</label>
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="">No goal — general vault</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Summary */}
        <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-3">
          <p className="text-xs text-neutral-400">
            You'll save <span className="font-semibold text-white">${amount || "0"}</span>{" "}
            {frequency === "weekly" ? (
              <>every <span className="font-semibold text-white">{DAYS_OF_WEEK.find((d) => d.value === dayOfWeek)?.label}</span></>
            ) : (
              <>on the <span className="font-semibold text-white">{dayOfMonth}{getOrdinal(dayOfMonth)}</span> of each month</>
            )}
            {goalId ? (
              <> toward <span className="font-semibold text-white">{goals.find((g) => g.id === goalId)?.title}</span></>
            ) : null}
          </p>
        </div>

        <Button onClick={handleSubmit} disabled={!amount || Number(amount) <= 0} size="lg" className="w-full">
          Create Schedule
        </Button>
      </div>
    </Modal>
  );
}

function getOrdinal(n: number): string {
  if (n >= 11 && n <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}
