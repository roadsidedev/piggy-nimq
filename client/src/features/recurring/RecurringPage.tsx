import { useState } from "react";
import { useRecurring } from "./useRecurring";
import { Card, Button, Input, Modal } from "@/components/common";

export function RecurringPage() {
  const { schedules, createSchedule, deleteSchedule, togglePause, goals } = useRecurring();
  const [showCreate, setShowCreate] = useState(false);
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("weekly");
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");

  const handleCreate = () => {
    if (!amount) return;
    createSchedule(amount, frequency, selectedGoalId || undefined);
    setAmount("");
    setFrequency("weekly");
    setSelectedGoalId("");
    setShowCreate(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Recurring Savings</h2>
        <Button onClick={() => setShowCreate(true)} size="sm">
          + New Schedule
        </Button>
      </div>

      {schedules.length === 0 ? (
        <Card className="text-center">
          <p className="text-sm text-neutral-500">
            No recurring schedules. Set up automatic savings.
          </p>
        </Card>
      ) : (
        schedules.map((s) => (
          <Card key={s.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">
                  ${s.amount} {s.frequency === "weekly" ? "/ week" : "/ month"}
                </p>
                <p className="text-xs text-neutral-500">
                  {s.paused ? "Paused" : "Active"}
                  {s.goalId
                    ? ` · ${goals.find((g) => g.id === s.goalId)?.title ?? "Unknown goal"}`
                    : " · General vault"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => togglePause(s.id)}
                  className={`text-xs ${s.paused ? "text-green-400" : "text-yellow-400"}`}
                >
                  {s.paused ? "Resume" : "Pause"}
                </button>
                <button
                  onClick={() => deleteSchedule(s.id)}
                  className="text-xs text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          </Card>
        ))
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Schedule">
        <div className="flex flex-col gap-4">
          <Input
            label="Amount (USDC)"
            type="number"
            placeholder="25"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-300">Frequency</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFrequency("weekly")}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  frequency === "weekly"
                    ? "bg-green-600 text-white"
                    : "bg-neutral-800 text-neutral-400"
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setFrequency("monthly")}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  frequency === "monthly"
                    ? "bg-green-600 text-white"
                    : "bg-neutral-800 text-neutral-400"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
          {goals.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-300">Allocate to Goal (optional)</label>
              <select
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-white"
              >
                <option value="">General vault</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <Button onClick={handleCreate} size="lg">
            Create Schedule
          </Button>
        </div>
      </Modal>
    </div>
  );
}
