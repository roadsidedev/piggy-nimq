import { useState, useEffect, useMemo } from "react";
import { useGoals } from "@/features/goals/useGoals";
import { useChallenges } from "@/features/challenges/useChallenges";
import { useVaultStore } from "@/stores/vaultStore";
import { useProfileStore } from "@/stores/profileStore";
import { Card, Button, Input, Modal } from "@/components/common";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { SparkleIcon, GoalIcon, TrophyIcon, FlameIcon } from "@/components/common/Icons";
import { Avatar } from "@/components/account/Avatar";
import { SavingsTree } from "./SavingsTree";

/* ── FAB ─────────────────────────────────────────────────── */

function FAB({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-sage-500 text-white shadow-lg shadow-sage-500/30 transition-all duration-300 hover:bg-sage-600 hover:scale-105 active:scale-95"
      aria-label={isOpen ? "Close menu" : "Create new"}
      style={{
        animation: isOpen ? "none" : "fab-pulse 2s ease-in-out infinite",
      }}
    >
      <svg
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        className="transition-transform duration-300"
        style={{
          transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
        }}
      >
        <line x1={12} y1={5} x2={12} y2={19} />
        <line x1={5} y1={12} x2={19} y2={12} />
      </svg>
    </button>
  );
}

/* ── Action Sheet ────────────────────────────────────────── */

interface ActionSheetProps {
  open: boolean;
  onClose: () => void;
  onGoal: () => void;
  onChallenge: () => void;
}

function ActionSheet({ open, onClose, onGoal, onChallenge }: ActionSheetProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl bg-white p-4 pb-8 animate-slide-up shadow-2xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300" />
        <h3 className="mb-4 text-base font-semibold text-gray-900">Create new</h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={onGoal}
            className="flex items-center gap-4 rounded-2xl bg-sage-50 p-4 text-left transition-all hover:bg-sage-100 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-500 text-xl">
              🎯
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">New Savings Goal</p>
              <p className="text-xs text-gray-500">Set a target and track your progress</p>
            </div>
          </button>
          <button
            onClick={onChallenge}
            className="flex items-center gap-4 rounded-2xl bg-sage-50 p-4 text-left transition-all hover:bg-sage-100 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-600 text-xl">
              🏆
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Start New Challenge</p>
              <p className="text-xs text-gray-500">Compete with friends and save more</p>
            </div>
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Goal Creation Modal ─────────────────────────────────── */

function GoalModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string, target: string, date?: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title || !target) return;
    setSubmitting(true);
    try {
      await onSubmit(title, target, targetDate || undefined);
      setTitle("");
      setTarget("");
      setTargetDate("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Savings Goal">
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
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        <Input
          label="Target Date (optional)"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
        <Button onClick={handleSubmit} size="lg" loading={submitting} className="bg-sage-500 hover:bg-sage-600">
          Create Goal
        </Button>
      </div>
    </Modal>
  );
}

/* ── Challenge Creation Modal ────────────────────────────── */

function ChallengeModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string, target: string, freq: "daily" | "weekly" | "monthly", duration: number) => void;
}) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("daily");
  const [duration, setDuration] = useState(7);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title || !target) return;
    setSubmitting(true);
    try {
      await onSubmit(title, target, frequency, duration);
      setTitle("");
      setTarget("");
      setFrequency("daily");
      setDuration(7);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Start New Challenge">
      <div className="flex flex-col gap-4">
        <Input
          label="Challenge Name"
          placeholder="e.g. Save $10 Daily"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          label="Target Amount (USDT)"
          type="number"
          placeholder="10"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-600">Frequency</label>
          <div className="flex gap-2">
            {(["daily", "weekly", "monthly"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                  frequency === f
                    ? "bg-sage-500 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <Input
          label="Duration (days)"
          type="number"
          placeholder="30"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />
        <Button onClick={handleSubmit} size="lg" loading={submitting} className="bg-sage-500 hover:bg-sage-600">
          Create Challenge
        </Button>
      </div>
    </Modal>
  );
}

/* ── Goal Card ───────────────────────────────────────────── */

function GoalCard({
  goal,
  onDelete,
}: {
  goal: { id: string; title: string; currentAmount: string; targetAmount: string; targetDate: string | null };
  onDelete: (id: string) => void;
}) {
  const current = Number(goal.currentAmount ?? 0);
  const target = Number(goal.targetAmount ?? 0);
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const completed = target > 0 && current >= target;

  const daysRemaining = goal.targetDate
    ? Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <Card className="bg-white border-gray-200">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-gray-900">{goal.title}</h3>
          <p className="text-xs text-gray-500">
            ${goal.currentAmount} / ${goal.targetAmount}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
            completed
              ? "bg-sage-100 text-sage-700"
              : pct >= 75
                ? "bg-sage-50 text-sage-600"
                : "bg-gray-100 text-gray-500"
          }`}>
            {pct}%
          </span>
          <button
            onClick={() => onDelete(goal.id)}
            className="text-xs text-gray-500 hover:text-red-400"
          >
            Delete
          </button>
        </div>
      </div>
      {/* Gradient progress bar */}
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-sage-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sage-400 to-sage-600 transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        {daysRemaining !== null && !completed && (
          <p className="text-xs text-gray-500">
            {daysRemaining === 0 ? "Due today" : `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`}
          </p>
        )}
        {goal.targetDate && (
          <p className={`text-xs ${daysRemaining !== null && !completed ? "" : "text-gray-500"}`}>
            Target: {new Date(goal.targetDate).toLocaleDateString()}
          </p>
        )}
      </div>
      {completed && (
        <div className="mt-3 rounded-xl bg-gradient-to-br from-sage-50 to-sage-100 border border-sage-200 p-3 text-center">
          <p className="text-lg animate-bounce">🎉</p>
          <p className="text-sm font-medium text-sage-600">Goal completed!</p>
        </div>
      )}
    </Card>
  );
}

/* ── Challenge Card ──────────────────────────────────────── */

function ChallengeCard({
  challenge,
  profilesMap,
  onJoin,
  onLeave,
}: {
  challenge: {
    id: string;
    title: string;
    target: string;
    frequency: string;
    duration: number;
    members: string[];
    memberProgress: Record<string, string>;
    streak: number;
  };
  profilesMap: Record<string, { username: string | null }>;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
}) {
  const members = challenge.members ?? [];
  const progress = challenge.memberProgress ?? {};
  const streak = challenge.streak ?? 0;
  const targetNum = Number(challenge.target) || 0;
  const sorted = [...members].sort(
    (a, b) => Number(progress[b] ?? 0) - Number(progress[a] ?? 0),
  );

  const rankColor = (i: number) => {
    if (i === 0) return "text-amber-500";
    if (i === 1) return "text-gray-500";
    if (i === 2) return "text-orange-400";
    return "text-gray-500";
  };

  return (
    <Card className="bg-white border-gray-200">
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-gray-900">{challenge.title}</h3>
          <p className="text-xs text-gray-500">
            ${challenge.target} {challenge.frequency} · {challenge.duration} days ·{" "}
            {challenge.members.length} member{challenge.members.length !== 1 ? "s" : ""}
          </p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1">
            <FlameIcon size={12} className="text-orange-500" />
            <span className="text-xs font-semibold text-orange-600">{streak}</span>
          </div>
        )}
      </div>

      {sorted.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 text-xs font-medium text-gray-500">Leaderboard</p>
          {sorted.slice(0, 5).map((member, i) => {
            const p = profilesMap[member?.toLowerCase() ?? ""];
            const memberAmt = Number(progress[member] ?? 0);
            const memberPct = targetNum > 0 ? Math.min(100, (memberAmt / targetNum) * 100) : 0;
            return (
              <div key={member} className="mb-1.5">
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-4 text-xs font-semibold ${rankColor(i)}`}>#{i + 1}</span>
                    <Avatar
                      address={member}
                      username={p?.username ?? undefined}
                      size="sm"
                    />
                    <span className="text-xs text-gray-900">
                      {p?.username
                        ? `@${p.username}`
                        : member
                          ? `${member.slice(0, 6)}...${member.slice(-4)}`
                          : "Unknown"}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    ${progress[member] ?? "0"}
                  </span>
                </div>
                {/* Per-member progress bar */}
                <div className="ml-6 h-1 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-sage-300 transition-all duration-500"
                    style={{ width: `${memberPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">Streak: {streak} days</span>
        <div className="flex gap-3">
          <button
            onClick={() => onJoin(challenge.id)}
            className="rounded-full bg-sage-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-sage-600"
          >
            Join
          </button>
          <button
            onClick={() => onLeave(challenge.id)}
            className="text-gray-500 hover:text-red-400"
          >
            Leave
          </button>
        </div>
      </div>
    </Card>
  );
}

/* ── Goals Tab ───────────────────────────────────────────── */

function GoalsTab({ goals, onDelete }: { goals: ReturnType<typeof useGoals>["goals"]; onDelete: (id: string) => void }) {
  if (goals.length === 0) {
    return (
      <Card className="bg-white border-gray-200 text-center">
        <div className="py-6">
          <div className="mx-auto mb-3 w-16 h-16">
            <SavingsTree balance={0} size={64} />
          </div>
          <p className="text-sm font-medium text-gray-900">No goals yet</p>
          <p className="text-xs text-gray-500 mt-1">Tap + to create your first savings goal</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} onDelete={onDelete} />
      ))}
    </div>
  );
}

/* ── Challenges Tab ──────────────────────────────────────── */

function ChallengesTab({
  challenges,
  profilesMap,
  onJoin,
  onLeave,
}: {
  challenges: ReturnType<typeof useChallenges>["challenges"];
  profilesMap: Record<string, { username: string | null }>;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [subTab, setSubTab] = useState<"browse" | "mine">("browse");

  const filtered = useMemo(() => {
    if (!search.trim()) return challenges;
    const q = search.toLowerCase();
    return challenges.filter(
      (c) =>
        (c.title ?? "").toLowerCase().includes(q) ||
        (c.frequency ?? "").toLowerCase().includes(q),
    );
  }, [challenges, search]);

  // Popularity = member count + streak weight
  const popular = useMemo(
    () =>
      [...challenges]
        .sort((a, b) => (b.members?.length ?? 0) + (b.streak ?? 0) * 0.1 - ((a.members?.length ?? 0) + (a.streak ?? 0) * 0.1))
        .slice(0, 3),
    [challenges],
  );

  const displayChallenges =
    subTab === "mine"
      ? filtered
      : search.trim()
        ? filtered
        : challenges;

  return (
    <div className="flex flex-col gap-3">
      {/* Sub-tabs: Browse / My Challenges */}
      <div className="flex gap-2">
        {(["browse", "mine"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
              subTab === t
                ? "bg-sage-500 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {t === "browse" ? "Browse" : "My Challenges"}
          </button>
        ))}
      </div>

      {/* Search (Browse tab only) */}
      {subTab === "browse" && (
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx={11} cy={11} r={8} />
            <line x1={21} y1={21} x2={16.65} y2={16.65} />
          </svg>
          <input
            type="text"
            placeholder="Search challenges..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 transition-colors focus:border-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-200"
          />
        </div>
      )}

      {/* Popular Challenges (Browse tab, no search) */}
      {subTab === "browse" && !search.trim() && popular.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-sage-50 to-sage-100/50 p-4 ring-1 ring-sage-100">
          <div className="mb-3 flex items-center gap-2">
            <SparkleIcon size={16} className="text-sage-500 animate-pulse" />
            <h4 className="text-sm font-semibold text-sage-700">Popular Challenges</h4>
          </div>
          <div className="flex flex-col gap-2">
            {popular.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{c.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    {/* Avatar stack */}
                    <div className="flex -space-x-1.5">
                      {(c.members ?? []).slice(0, 3).map((m) => (
                        <div
                          key={m}
                          className="h-4 w-4 rounded-full ring-2 ring-white bg-sage-200"
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {(c.members ?? []).length} member{(c.members ?? []).length !== 1 ? "s" : ""}
                    </span>
                    {(c.streak ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-600">
                        <FlameIcon size={8} className="text-orange-500" />
                        {c.streak}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onJoin(c.id)}
                  className="ml-3 flex-shrink-0 rounded-lg bg-sage-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sage-600 active:scale-95"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Challenge list */}
      {displayChallenges.length === 0 ? (
        <Card className="bg-white border-gray-200 text-center">
          <div className="py-6">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-sage-50">
              <TrophyIcon size={28} className="text-sage-400" />
            </div>
            <p className="text-sm font-medium text-gray-900">
              {search.trim() ? "No matching challenges" : "No challenges yet"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {search.trim()
                ? "Try a different search term"
                : "Tap + to create your first challenge"}
            </p>
          </div>
        </Card>
      ) : (
        displayChallenges.map((c) => (
          <ChallengeCard
            key={c.id}
            challenge={c}
            profilesMap={profilesMap}
            onJoin={onJoin}
            onLeave={onLeave}
          />
        ))
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   GROWTH PAGE (main export)
   ═══════════════════════════════════════════════════════════ */

export function GrowthPage() {
  const { goals, createGoal, deleteGoal } = useGoals();
  const { challenges, createChallenge, joinChallenge, leaveChallenge } = useChallenges();
  const { profiles, fetchProfiles } = useProfileStore();
  const balance = useVaultStore((s) => s.balance);

  const [activeTab, setActiveTab] = useState<"goals" | "challenges">("goals");
  const [fabOpen, setFabOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Fetch profiles for all challenge members
  useEffect(() => {
    const allMembers = challenges.flatMap((c) => c.members);
    if (allMembers.length > 0) {
      fetchProfiles(allMembers);
    }
  }, [challenges, fetchProfiles]);

  const totalBalance = Number(balance) || 0;
  const totalGoalAmount = useMemo(
    () => goals.reduce((sum, g) => sum + Number(g.currentAmount || 0), 0),
    [goals],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Growth</h1>
      </div>

      {/* ── Dashboard Summary Card ── */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-sage-50 to-white shadow-md ring-1 ring-sage-200">
        {/* Top section: Balance + Tree */}
        <div className="flex items-center gap-4 p-5">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-600 mb-1">Total Growth Balance</p>
            <p className="text-3xl font-bold text-gray-900">
              ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {totalGoalAmount > 0 && (
              <p className="mt-1 text-xs text-sage-500">
                ${totalGoalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} allocated to goals
              </p>
            )}
          </div>
          <SavingsTree balance={totalBalance} size={100} />
        </div>

        {/* Bottom metrics strip */}
        <div className="grid grid-cols-3 border-t border-sage-200 bg-white/60 px-5 py-3">
          <div className="flex flex-col items-center gap-1">
            <GoalIcon size={14} className="text-sage-600" />
            <p className="text-lg font-bold text-sage-800">{goals.length}</p>
            <p className="text-[11px] font-semibold text-gray-600 uppercase">Goals</p>
          </div>
          <div className="flex flex-col items-center gap-1 border-x border-sage-200">
            <TrophyIcon size={14} className="text-sage-600" />
            <p className="text-lg font-bold text-sage-800">{challenges.length}</p>
            <p className="text-[11px] font-semibold text-gray-600 uppercase">Challenges</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <FlameIcon size={14} className="text-orange-600" />
            <p className="text-lg font-bold text-sage-800">
              {challenges.reduce((max, c) => Math.max(max, c.streak ?? 0), 0)}
            </p>
            <p className="text-[11px] font-semibold text-gray-600 uppercase">Best Streak</p>
          </div>
        </div>
      </div>

      {/* ── Segmented Control ── */}
      <div className="relative flex gap-1 rounded-xl bg-gray-200/70 p-1">
        {/* Sliding indicator */}
        <div
          className="absolute top-1 bottom-1 w-[calc(50%-2px)] rounded-lg bg-sage-600 shadow-sm transition-transform duration-300 ease-out"
          style={{
            transform: activeTab === "challenges" ? "translateX(calc(100% + 2px))" : "translateX(0)",
          }}
        />
        <button
          onClick={() => setActiveTab("goals")}
          className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-colors duration-200 ${
            activeTab === "goals" ? "text-white" : "text-gray-700 hover:text-gray-900"
          }`}
        >
          <GoalIcon size={14} />
          Goals
        </button>
        <button
          onClick={() => setActiveTab("challenges")}
          className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-colors duration-200 ${
            activeTab === "challenges" ? "text-white" : "text-gray-700 hover:text-gray-900"
          }`}
        >
          <TrophyIcon size={14} />
          Challenges
        </button>
      </div>

      {/* ── Tab Content ── */}
      <ErrorBoundary>
        {activeTab === "goals" ? (
          <GoalsTab goals={goals} onDelete={(id) => setConfirmDelete(id)} />
        ) : (
          <ChallengesTab
            challenges={challenges}
            profilesMap={profiles}
            onJoin={joinChallenge}
            onLeave={leaveChallenge}
          />
        )}
      </ErrorBoundary>

      {/* ── FAB ── */}
      <FAB onClick={() => setFabOpen(true)} isOpen={fabOpen} />

      {/* ── Modals ── */}
      <ActionSheet
        open={fabOpen}
        onClose={() => setFabOpen(false)}
        onGoal={() => {
          setFabOpen(false);
          setGoalModalOpen(true);
        }}
        onChallenge={() => {
          setFabOpen(false);
          setChallengeModalOpen(true);
        }}
      />

      <GoalModal
        open={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        onSubmit={createGoal}
      />

      <ChallengeModal
        open={challengeModalOpen}
        onClose={() => setChallengeModalOpen(false)}
        onSubmit={createChallenge}
      />

      {/* Delete confirmation */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Goal?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-500">
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
    </div>
  );
}
