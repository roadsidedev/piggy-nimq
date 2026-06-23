import { useNavigate } from "@/hooks/useNavigate";
import { useDashboard } from "./useDashboard";
import { VaultBalanceCard } from "@/components/dashboard/VaultBalanceCard";
import { YieldCard } from "@/components/dashboard/YieldCard";
import { BorrowedCard } from "@/components/dashboard/BorrowedCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { GoalsPreview } from "@/components/dashboard/GoalsPreview";
import { ChallengesPreview } from "@/components/dashboard/ChallengesPreview";

export function DashboardPage() {
  const { balance, yieldEnabled, apy, monthlyEarnings, borrowedAmount, healthFactor, goals, challenges } =
    useDashboard();
  const { goToVault, goToBorrow, goToGoals, goToChallenges } = useNavigate();

  return (
    <div className="flex flex-col gap-4">
      <VaultBalanceCard
        balance={balance}
        yieldEnabled={yieldEnabled}
        apy={apy}
        earningsToday={monthlyEarnings}
      />

      <div className="grid grid-cols-2 gap-3">
        <YieldCard enabled={yieldEnabled} apy={apy} estimatedMonthly={monthlyEarnings} />
        <BorrowedCard borrowedAmount={borrowedAmount} healthFactor={healthFactor} />
      </div>

      <QuickActions
        onDeposit={goToVault}
        onBorrow={goToBorrow}
        onCreateGoal={goToGoals}
        onJoinChallenge={goToChallenges}
      />

      <GoalsPreview goals={goals} onNavigate={goToGoals} />

      <ChallengesPreview challenges={challenges} onNavigate={goToChallenges} />
    </div>
  );
}
