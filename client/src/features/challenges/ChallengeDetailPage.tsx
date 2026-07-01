import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWalletStore } from "@/stores/walletStore";
import { useProfileStore } from "@/stores/profileStore";
import { useChallengesStore } from "@/stores/challengesStore";
import { piggyChallengeManagerService } from "@/integrations/contracts";
import { Button, Card } from "@/components/common";
import { Avatar } from "@/components/account/Avatar";

interface ChallengeData {
  name: string;
  targetAmount: string;
  durationDays: string;
  frequency: string;
  isActive: boolean;
  isPublic: boolean;
  owner: string;
  memberCount: string;
}

interface MemberInfo {
  address: string;
  totalSaved: bigint;
  currentStreak: number;
}

export function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const address = useWalletStore((s) => s.address);
  const { profiles, fetchProfiles } = useProfileStore();
  const { joinChallenge } = useChallengesStore();
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const challengeId = id ? BigInt(id) : null;

  useEffect(() => {
    const cid = challengeId;
    if (!cid) return;
    (async () => {
      try {
        const raw = await piggyChallengeManagerService.getChallenge(cid);
        setChallenge({
          name: raw.name,
          targetAmount: raw.targetAmount.toString(),
          durationDays: raw.durationDays.toString(),
          frequency: ["Daily", "Weekly", "Monthly"][raw.frequency] ?? "Daily",
          isActive: raw.isActive,
          isPublic: raw.isPublic,
          owner: raw.owner,
          memberCount: raw.memberCount.toString(),
        });
      } catch {
        setChallenge(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [challengeId]);

  useEffect(() => {
    const cid = challengeId;
    if (!cid) return;
    (async () => {
      try {
        const lb = await piggyChallengeManagerService.getLeaderboard(cid);
        const list: MemberInfo[] = lb.members.map((m, i) => {
          const p = lb.progress[i];
          return {
            address: m,
            totalSaved: p?.totalSaved ?? 0n,
            currentStreak: p ? Number(p.currentStreak) : 0,
          };
        });
        setMembers(list);
        fetchProfiles(lb.members);
      } catch {
        // leaderboard may fail for deleted challenges
      }
    })();
  }, [challengeId, fetchProfiles]);

  const handleJoin = async () => {
    if (!challengeId || !address) return;
    setJoining(true);
    try {
      await piggyChallengeManagerService.joinChallenge(challengeId);
      joinChallenge(`onchain-${id!}`, address);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-900 p-4">
        <p className="text-neutral-400">Loading challenge...</p>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-900 p-4">
        <p className="text-neutral-400">Challenge not found</p>
        <Button onClick={() => navigate("/")} variant="secondary" size="sm">Back to App</Button>
      </div>
    );
  }

  const isMember = address && members.some((m) => m.address.toLowerCase() === address.toLowerCase());
  const sortedMembers = [...members].sort((a, b) => Number(b.totalSaved) - Number(a.totalSaved));

  return (
    <div className="min-h-screen bg-neutral-900 p-4">
      <div className="mx-auto max-w-lg">
        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="mb-4 text-sm text-green-400 hover:text-green-300"
        >
          ← Back to Piggy
        </button>

        <Card>
          <h1 className="mb-1 text-xl font-bold text-white">{challenge.name}</h1>
          <p className="mb-4 text-sm text-neutral-400">
            ${challenge.targetAmount} {challenge.frequency} · {challenge.durationDays} days · {challenge.memberCount} member{challenge.memberCount !== "1" ? "s" : ""}
          </p>

          <div className="mb-4 flex items-center gap-2 text-xs text-neutral-500">
            <span>Owner: {challenge.owner.slice(0, 6)}...{challenge.owner.slice(-4)}</span>
            {challenge.isActive && (
              <span className="rounded-full bg-green-900 px-2 py-0.5 text-green-400">Active</span>
            )}
          </div>

          {/* Join / Deposit */}
          <div className="mb-4 flex gap-2">
            {!isMember && address && (
              <Button onClick={handleJoin} loading={joining} size="sm" className="flex-1">
                Join Challenge
              </Button>
            )}
            {isMember && (
              <span className="flex-1 rounded-lg bg-green-900 px-3 py-2 text-center text-sm text-green-400">
                You're in! Deposit via Vault → Challenge
              </span>
            )}
            {!address && (
              <span className="flex-1 rounded-lg bg-neutral-800 px-3 py-2 text-center text-sm text-neutral-500">
                Connect wallet to join
              </span>
            )}
          </div>

          {/* Leaderboard */}
          <div>
            <p className="mb-2 text-sm font-medium text-neutral-300">Leaderboard</p>
            {sortedMembers.length === 0 ? (
              <p className="text-xs text-neutral-500">No members yet.</p>
            ) : (
              <div className="space-y-2">
                {sortedMembers.map((m, i) => {
                  const p = profiles[m.address.toLowerCase()];
                  const amt = Number(m.totalSaved) / 1e6;
                  return (
                    <div key={m.address} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-xs font-semibold text-neutral-500">#{i + 1}</span>
                        <Avatar address={m.address} username={p?.username} size="sm" />
                        <span className="text-sm text-white">
                          {p?.username ? `@${p.username}` : `${m.address.slice(0, 6)}...${m.address.slice(-4)}`}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-white">${amt.toFixed(2)}</span>
                        {m.currentStreak > 0 && (
                          <span className="ml-2 text-xs text-orange-400">🔥{m.currentStreak}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
