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
        <h3 className="font-heading text-sm font-semibold text-gray-900">Save with Frens</h3>
        <button onClick={onNavigate} className="flex items-center text-xs text-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 rounded">
          View all <ChevronRightIcon size={14} aria-hidden="true" />
        </button>
      </div>

      {!topChallenge ? (
        <button
          onClick={onNavigate}
          className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-6 text-center transition-colors hover:border-orange-200 hover:bg-orange-50"
        >
          <span className="text-2xl">🔥</span>
          <p className="font-body text-sm font-medium text-gray-700">Join a challenge with friends</p>
          <p className="text-xs text-gray-500">Save together and build streaks</p>
        </button>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">{topChallenge.title}</p>
            <p className="text-xs text-gray-500">
              ${topChallenge.target} {topChallenge.frequency}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1">
            <FlameIcon size={14} className="text-orange-500" aria-hidden="true" />
            <span className="text-sm font-semibold text-orange-600">
              {topChallenge.streak}-day Streak
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
