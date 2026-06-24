import type { RecurringSchedule } from "@/stores/recurringStore";
import { RepeatIcon } from "@/components/common/Icons";

interface RecurringConfigProps {
  schedules: RecurringSchedule[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onTogglePause: (id: string) => void;
}

function SmallTrashIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

export function RecurringConfig({ schedules, onAdd, onDelete, onTogglePause }: RecurringConfigProps) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RepeatIcon size={18} className="text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Recurring Savings</h3>
        </div>
        <button onClick={onAdd} className="text-xs font-medium text-pink-600">
          + Add
        </button>
      </div>

      {schedules.length === 0 ? (
        <p className="py-2 text-center text-sm text-gray-400">No recurring schedules</p>
      ) : (
        <div className="flex flex-col gap-2">
          {schedules.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">
                  ${s.amount} / {s.frequency}
                </p>
                <p className="text-xs text-gray-400">{s.paused ? "Paused" : "Active"}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onTogglePause(s.id)}
                  className={`text-xs ${s.paused ? "text-green-600" : "text-yellow-600"}`}
                >
                  {s.paused ? "Resume" : "Pause"}
                </button>
                <button onClick={() => onDelete(s.id)} className="text-gray-400 hover:text-red-500">
                  <SmallTrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
