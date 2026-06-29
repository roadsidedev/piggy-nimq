import { useState, useEffect, lazy, Suspense } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useProfileStore } from "@/stores/profileStore";
import { Button, PageSkeleton } from "@/components/common";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { PiggyLogo } from "@/components/common/PiggyLogo";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { registerTabSetter } from "@/hooks/useNavigate";
import { HomeIcon, VaultIcon, SavingsIcon, BorrowIcon } from "@/components/common/Icons";
import { Avatar } from "@/components/account/Avatar";

const VaultPage = lazy(() => import("@/features/vault/VaultPage").then((m) => ({ default: m.VaultPage })));
const BorrowPage = lazy(() => import("@/features/borrow/BorrowPage").then((m) => ({ default: m.BorrowPage })));
const GrowthPage = lazy(() => import("@/features/growth/GrowthPage").then((m) => ({ default: m.GrowthPage })));
const AccountPage = lazy(() => import("@/features/account/AccountPage").then((m) => ({ default: m.AccountPage })));

type Tab = "home" | "vault" | "growth" | "borrow" | "account";

const tabs: { id: Tab; label: string; Icon: typeof HomeIcon }[] = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "vault", label: "Vault", Icon: VaultIcon },
  { id: "growth", label: "Growth", Icon: SavingsIcon },
  { id: "borrow", label: "Borrow", Icon: BorrowIcon },
];

function ConnectScreen() {
  const { connect, status, error } = useWallet();

  return (
    <div className="flex h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="mb-8">
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-pink-100">
          <PiggyLogo size={80} showBackground={false} />
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

function PageContent({ activeTab }: { activeTab: Tab }) {
  switch (activeTab) {
    case "home":
      return <DashboardPage />;
    case "vault":
      return <VaultPage />;
    case "borrow":
      return <BorrowPage />;
    case "growth":
      return <GrowthPage />;
    case "account":
      return <AccountPage />;
  }
}

function AppShell({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (tab: Tab) => void }) {
  const { address } = useWallet();
  const { username, avatarUrl } = useProfileStore();
  const [prefetched, setPrefetched] = useState(false);

  useEffect(() => {
    if (prefetched) return;
    const timer = setTimeout(() => {
      import("@/features/vault/VaultPage");
      import("@/features/account/AccountPage");
      setPrefetched(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [prefetched]);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between px-5 pt-3 pb-2">
        <div className="flex items-center gap-1.5">
          <PiggyLogo size={28} showBackground={false} />
          <span className="text-xl font-bold text-gray-900">Piggy</span>
        </div>
        <button
          onClick={() => onTabChange("account")}
          className="flex items-center justify-center transition-colors"
          aria-label="Account"
        >
          <Avatar address={address} username={username} avatarUrl={avatarUrl} size="sm" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-2 pb-24">
        <ErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>
            <PageContent activeTab={activeTab} />
          </Suspense>
        </ErrorBoundary>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/90 backdrop-blur-md">
        <div className="flex items-center justify-around px-2 py-1.5">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              onMouseEnter={() => {
                const map: Record<string, () => Promise<any>> = {
                  vault: () => import("@/features/vault/VaultPage"),
                  borrow: () => import("@/features/borrow/BorrowPage"),
                  growth: () => import("@/features/growth/GrowthPage"),
                  account: () => import("@/features/account/AccountPage"),
                };
                map[id]?.();
              }}
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

export default function AppRoot() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
