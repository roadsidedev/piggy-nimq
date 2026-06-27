import type { Challenge } from "@/stores/challengesStore";
import { FlameIcon, ChevronRightIcon } from "@/components/common/Icons";

interface ChallengesPreviewProps {
  challenges: Challenge[];
  onNavigate: () => void;
}

export function ChallengesPreview({ challenges, onNavigate }: ChallengesPreviewProps) {
  const topChallenge = challenges[0];

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Save with Frens</h3>
        <button onClick={onNavigate} className="flex items-center text-xs text-green-600">
          View all <ChevronRightIcon size={14} />
        </button>
      </div>

      {!topChallenge ? (
        <p className="py-2 text-center text-sm text-gray-400">No active challenges</p>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">{topChallenge.title}</p>
            <p className="text-xs text-gray-500">
              ${topChallenge.target} {topChallenge.frequency}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1">
            <FlameIcon size={14} className="text-orange-500" />
            <span className="text-sm font-semibold text-orange-600">
              {topChallenge.streak}-day Streak
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
