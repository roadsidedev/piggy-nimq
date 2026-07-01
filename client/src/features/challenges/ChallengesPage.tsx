import { useState, useEffect } from "react";
import { useChallenges } from "./useChallenges";
import { useProfileStore } from "@/stores/profileStore";
import { Card, Button, Input, Modal } from "@/components/common";
import { Avatar } from "@/components/account/Avatar";

export function ChallengesPage() {
  const { challenges, createChallenge, joinChallenge, leaveChallenge } = useChallenges();
  const { profiles, fetchProfiles } = useProfileStore();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("daily");
  const [duration, setDuration] = useState(7);
  const [tab, setTab] = useState<"browse" | "mine">("browse");

  // Fetch profiles for all challenge members
  useEffect(() => {
    const allMembers = challenges.flatMap((c) => c.members);
    if (allMembers.length > 0) {
      fetchProfiles(allMembers);
    }
  }, [challenges, fetchProfiles]);

  const handleCreate = () => {
    if (!title || !target) return;
    createChallenge(title, target, frequency, duration);
    setTitle("");
    setTarget("");
    setShowCreate(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Challenges</h2>
        <Button onClick={() => setShowCreate(true)} size="sm">
          + Create
        </Button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab("browse")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            tab === "browse" ? "bg-green-600 text-white" : "bg-neutral-800 text-neutral-400"
          }`}
        >
          Browse
        </button>
        <button
          onClick={() => setTab("mine")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            tab === "mine" ? "bg-green-600 text-white" : "bg-neutral-800 text-neutral-400"
          }`}
        >
          My Challenges
        </button>
      </div>

      {tab === "mine" && challenges.length === 0 ? (
        <Card className="text-center">
          <p className="text-sm text-neutral-500">
            Join or create a challenge to get started.
          </p>
        </Card>
      ) : (
        challenges
          .filter((c) => tab === "browse" || c.members.includes("__current_user__"))
          .map((c) => {
            const sorted = [...c.members].sort(
              (a, b) => Number(c.memberProgress[b] ?? 0) - Number(c.memberProgress[a] ?? 0),
            );
            return (
              <Card key={c.id}>
                <div className="mb-3">
                  <h3 className="font-medium text-white">{c.title}</h3>
                  <p className="text-xs text-neutral-500">
                    ${c.target} {c.frequency} · {c.duration} days · {c.members.length} member{c.members.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="mb-3">
                  <p className="mb-1 text-xs font-medium text-neutral-400">Leaderboard</p>
                  {sorted.slice(0, 5).map((member, i) => {
                    const profile = profiles[member.toLowerCase()];
                    return (
                      <div key={member} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <span className="w-4 text-xs text-neutral-500">#{i + 1}</span>
                          <Avatar
                            address={member}
                            username={profile?.username}
                            avatarUrl={profile?.avatarUrl}
                            size="sm"
                          />
                          <span className="text-xs text-white">
                            {profile?.username
                              ? `@${profile.username}`
                              : `${member.slice(0, 6)}...${member.slice(-4)}`}
                          </span>
                        </div>
                        <span className="text-xs text-neutral-400">
                          ${c.memberProgress[member] ?? "0"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Streak: {c.streak} days</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => joinChallenge(c.id)}
                      className="text-green-400 hover:text-green-300"
                    >
                      Join
                    </button>
                    <button
                      onClick={() => leaveChallenge(c.id)}
                      className="text-neutral-500 hover:text-red-400"
                    >
                      Leave
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Challenge">
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
            <label className="text-sm font-medium text-neutral-300">Frequency</label>
            <div className="flex gap-2">
              {(["daily", "weekly", "monthly"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                    frequency === f
                      ? "bg-green-600 text-white"
                      : "bg-neutral-800 text-neutral-400"
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
          <Button onClick={handleCreate} size="lg">
            Create Challenge
          </Button>
        </div>
      </Modal>
    </div>
  );
}
