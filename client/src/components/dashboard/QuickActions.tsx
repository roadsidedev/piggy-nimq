import { DepositIcon, BorrowIcon, GoalIcon, ChallengeIcon } from "@/components/common/Icons";

interface QuickActionsProps {
  onDeposit: () => void;
  onBorrow: () => void;
  onCreateGoal: () => void;
  onJoinChallenge: () => void;
}

const actions = [
  { key: "deposit", label: "Deposit", Icon: DepositIcon },
  { key: "borrow", label: "Borrow", Icon: BorrowIcon },
  { key: "goal", label: "Create Goal", Icon: GoalIcon },
  { key: "challenge", label: "Join Challenge", Icon: ChallengeIcon },
] as const;

export function QuickActions({ onDeposit, onBorrow, onCreateGoal, onJoinChallenge }: QuickActionsProps) {
  const handlers: Record<string, () => void> = {
    deposit: onDeposit,
    borrow: onBorrow,
    goal: onCreateGoal,
    challenge: onJoinChallenge,
  };

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map(({ key, label, Icon }) => (
        <button
          key={key}
          onClick={handlers[key]}
          className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 shadow-sm transition-colors hover:bg-gray-50 active:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
            <Icon size={20} className="text-green-700" aria-hidden="true" />
          </div>
          <span className="font-body text-xs font-medium text-green-700">{label}</span>
        </button>
      ))}
    </div>
  );
}
