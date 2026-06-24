import { useState, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/common";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { PiggyLogo } from "@/components/common/PiggyLogo";
import { VaultPage } from "@/features/vault";
import { BorrowPage } from "@/features/borrow";
import { GoalsPage } from "@/features/goals";
import { ChallengesPage } from "@/features/challenges";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { AccountPage } from "@/features/account";
import { registerTabSetter } from "@/hooks/useNavigate";
import { HomeIcon, VaultIcon, GoalIcon, BorrowIcon, ChallengeIcon, UserIcon } from "@/components/common/Icons";

type Tab = "home" | "vault" | "goals" | "borrow" | "challenges" | "account";

const tabs: { id: Tab; label: string; Icon: typeof HomeIcon }[] = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "vault", label: "Vault", Icon: VaultIcon },
  { id: "goals", label: "Goals", Icon: GoalIcon },
  { id: "borrow", label: "Borrow", Icon: BorrowIcon },
  { id: "challenges", label: "Challenges", Icon: ChallengeIcon },
];

function ConnectScreen() {
  const { connect, status, error } = useWallet();

  return (
    <div className="flex h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="mb-8">
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-pink-100">
          <PiggyLogo size={80} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Piggy</h1>
        <p className="mt-2 text-gray-500">Save smarter. Borrow smarter. Together.</p>
      </div>

      <Button
        onClick={connect}
        loading={status === "connecting"}
        size="lg"
        className="w-full max-w-xs"
      >
        {status === "connecting" ? "Connecting..." : "Connect to Nimiq Pay"}
      </Button>

      {error ? <p className="mt-4 max-w-xs text-sm text-red-500">{error}</p> : null}
    </div>
  );
}

function AppShell({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (tab: Tab) => void }) {
  const { address } = useWallet();

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between px-5 pt-3 pb-2">
        <div className="flex items-center gap-1.5">
          <PiggyLogo size={28} />
          <span className="text-xl font-bold text-gray-900">Piggy</span>
        </div>
        <button
          onClick={() => onTabChange("account")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-100 text-sm font-bold text-pink-600 transition-colors hover:bg-pink-200"
        >
          {address ? address.slice(2, 4).toUpperCase() : <UserIcon size={18} />}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-2 pb-24">
        <ErrorBoundary>
          {activeTab === "home" ? (
            <DashboardPage />
          ) : activeTab === "vault" ? (
            <VaultPage />
          ) : activeTab === "borrow" ? (
            <BorrowPage />
          ) : activeTab === "goals" ? (
            <GoalsPage />
          ) : activeTab === "challenges" ? (
            <ChallengesPage />
          ) : activeTab === "account" ? (
            <AccountPage />
          ) : null}
        </ErrorBoundary>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/90 backdrop-blur-md">
        <div className="flex items-center justify-around px-2 py-1.5">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors ${
                activeTab === id
                  ? "text-pink-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              aria-current={activeTab === id ? "page" : undefined}
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function App() {
  const { isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState<Tab>("home");

  useEffect(() => {
    const unregister = registerTabSetter(setActiveTab);
    return unregister;
  }, []);

  if (!isConnected) {
    return <ConnectScreen />;
  }

  return <AppShell activeTab={activeTab} onTabChange={setActiveTab} />;
}

export default App;
