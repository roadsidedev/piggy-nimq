import type { StoredGoal } from "@/stores/goalsStore";
import { ChevronRightIcon } from "@/components/common/Icons";

interface GoalsPreviewProps {
  goals: StoredGoal[];
  onNavigate: () => void;
}

export function GoalsPreview({ goals, onNavigate }: GoalsPreviewProps) {
  const activeGoals = goals.slice(0, 2);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Active Goals</h3>
        <button onClick={onNavigate} className="flex items-center text-xs text-green-600">
          View all <ChevronRightIcon size={14} />
        </button>
      </div>

      {activeGoals.length === 0 ? (
        <p className="py-2 text-center text-sm text-gray-500">No active goals</p>
      ) : (
        <div className="flex flex-col gap-3">
          {activeGoals.map((goal) => {
            const current = Number(goal.currentAmount);
            const target = Number(goal.targetAmount);
            const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;

            return (
              <div key={goal.id}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">{goal.title}</span>
                  <span className="text-xs font-medium text-gray-600">{Math.round(pct)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-green-600 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  ${goal.currentAmount} / ${goal.targetAmount}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
