import { useState } from "react";
import { useGoals } from "./useGoals";
import { Card, Button, Input, Modal } from "@/components/common";

function ProgressBar({ current, target }: { current: number; target: number }) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-800">
      <div
        className="h-full rounded-full bg-green-600 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function CelebrateBanner() {
  return (
    <div className="rounded-xl bg-green-900/30 border border-green-700 p-4 text-center">
      <p className="text-lg">🎉</p>
      <p className="text-sm font-medium text-green-400">Goal completed!</p>
    </div>
  );
}

export function GoalsPage() {
  const { goals, createGoal, contribute, deleteGoal } = useGoals();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [contributeGoal, setContributeGoal] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");
  const [contributeLoading, setContributeLoading] = useState(false);
  const [contributeError, setContributeError] = useState<string | null>(null);

  const handleCreate = () => {
    if (!title || !targetAmount) return;
    createGoal(title, targetAmount);
    setTitle("");
    setTargetAmount("");
    setShowCreate(false);
  };

  const handleContribute = async () => {
    if (!contributeGoal || !contributeAmount || Number(contributeAmount) <= 0) return;
    setContributeLoading(true);
    setContributeError(null);
    try {
      await contribute(contributeGoal, contributeAmount);
      setContributeAmount("");
      setContributeGoal(null);
    } catch (err) {
      setContributeError(err instanceof Error ? err.message : "Contribution failed");
    } finally {
      setContributeLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Goals</h2>
        <Button onClick={() => setShowCreate(true)} size="sm">
          + New Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card className="text-center">
          <p className="text-sm text-neutral-500">
            No goals yet. Create your first savings goal.
          </p>
        </Card>
      ) : (
        goals.map((goal) => {
          const current = Number(goal.currentAmount);
          const target = Number(goal.targetAmount);
          const completed = target > 0 && current >= target;

          return (
            <Card key={goal.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-white">{goal.title}</h3>
                  <p className="text-xs text-neutral-500">
                    ${goal.currentAmount} / ${goal.targetAmount}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setContributeGoal(goal.id)}
                    className="text-xs text-green-400 hover:text-green-300"
                  >
                    Contribute
                  </button>
                  <button
                    onClick={() => setConfirmDelete(goal.id)}
                    className="text-xs text-neutral-500 hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <ProgressBar current={current} target={target} />
              {goal.targetDate ? (
                <p className="mt-1 text-xs text-neutral-500">
                  Target: {new Date(goal.targetDate).toLocaleDateString()}
                </p>
              ) : null}
              {completed ? <div className="mt-2"><CelebrateBanner /></div> : null}
            </Card>
          );
        })
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Goal">
        <div className="flex flex-col gap-4">
          <Input
            label="Goal Name"
            placeholder="e.g. Vacation, Emergency Fund"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Target Amount (USDT)"
            type="number"
            placeholder="1000"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
          />
          <Button onClick={handleCreate} size="lg">
            Create Goal
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Goal?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutral-400">
            This will remove the goal. Funds are not affected.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setConfirmDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => {
                if (confirmDelete) deleteGoal(confirmDelete);
                setConfirmDelete(null);
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!contributeGoal}
        onClose={() => { setContributeGoal(null); setContributeAmount(""); setContributeError(null); }}
        title="Contribute to Goal"
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-neutral-400">
            Funds will be earmarked from your vault balance toward this goal.
          </p>
          <Input
            label="Amount (USDT)"
            type="number"
            placeholder="0.00"
            value={contributeAmount}
            onChange={(e) => { setContributeAmount(e.target.value); setContributeError(null); }}
          />
          {contributeError ? <p className="text-sm text-red-400">{contributeError}</p> : null}
          <Button onClick={handleContribute} loading={contributeLoading} size="lg">
            Contribute
          </Button>
        </div>
      </Modal>
    </div>
  );
}
