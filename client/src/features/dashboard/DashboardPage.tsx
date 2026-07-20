import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "@/hooks/useNavigate";
import { useDashboard } from "./useDashboard";
import { useVault } from "@/features/vault/useVault";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { VaultBalanceCard } from "@/components/dashboard/VaultBalanceCard";
import { YieldCard } from "@/components/dashboard/YieldCard";
import { BorrowedCard } from "@/components/dashboard/BorrowedCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { GoalsPreview } from "@/components/dashboard/GoalsPreview";
import { ChallengesPreview } from "@/components/dashboard/ChallengesPreview";

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-32 rounded-2xl bg-gray-200" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-xl bg-gray-200" />
        <div className="h-24 rounded-xl bg-gray-200" />
      </div>
      <div className="h-16 rounded-xl bg-gray-200" />
      <div className="h-24 rounded-xl bg-gray-200" />
      <div className="h-24 rounded-xl bg-gray-200" />
    </div>
  );
}

export function DashboardPage() {
  const { balance, yieldEnabled, apy, isLoading, monthlyEarnings, borrowedAmount, healthFactor, goals, challenges } =
    useDashboard();
  const { goToVault, goToBorrow, goToGrowth } = useNavigate();
  const { disableYield } = useVault();
  const [toggleLoading, setToggleLoading] = useState(false);

  const handleYieldToggle = useCallback(async () => {
    if (yieldEnabled) {
      // Yield is ON → disable it via on-chain transaction
      setToggleLoading(true);
      try {
        await disableYield();
        toast.success("Yield disabled", { description: "Your funds are no longer earning yield" });
      } catch {
        // Error is handled by useVault (sets txError in store)
      } finally {
        setToggleLoading(false);
      }
    } else {
      // Yield is OFF → navigate to vault page to pick amount
      goToVault();
    }
  }, [yieldEnabled, disableYield, goToVault]);

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="flex flex-col gap-4">
      <ErrorBoundary fallback={<div className="rounded-2xl bg-white p-4 text-center text-sm text-gray-500">Couldn't load vault balance</div>}>
        <VaultBalanceCard
          balance={balance}
          yieldEnabled={yieldEnabled}
          apy={apy}
          earningsToday={monthlyEarnings}
        />
      </ErrorBoundary>

      <div className="grid grid-cols-2 gap-3">
        <ErrorBoundary fallback={<div className="rounded-2xl bg-white p-4 text-center text-xs text-gray-500">Couldn't load yield data</div>}>
          <YieldCard
            enabled={yieldEnabled}
            apy={apy}
            estimatedMonthly={monthlyEarnings}
            onToggle={handleYieldToggle}
            loading={toggleLoading}
          />
        </ErrorBoundary>
        <ErrorBoundary fallback={<div className="rounded-2xl bg-white p-4 text-center text-xs text-gray-500">Couldn't load borrow data</div>}>
          <BorrowedCard borrowedAmount={borrowedAmount} healthFactor={healthFactor} />
        </ErrorBoundary>
      </div>

      <QuickActions
        onDeposit={goToVault}
        onBorrow={goToBorrow}
        onCreateGoal={goToGrowth}
        onJoinChallenge={goToGrowth}
      />

      <ErrorBoundary fallback={<div className="rounded-2xl bg-white p-4 text-center text-xs text-gray-500">Couldn't load goals</div>}>
        <GoalsPreview goals={goals} onNavigate={goToGrowth} />
      </ErrorBoundary>

      <ErrorBoundary fallback={<div className="rounded-2xl bg-white p-4 text-center text-xs text-gray-500">Couldn't load challenges</div>}>
        <ChallengesPreview challenges={challenges} onNavigate={goToGrowth} />
      </ErrorBoundary>
    </div>
  );
}
