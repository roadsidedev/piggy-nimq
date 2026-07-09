import { useState, useEffect, lazy, Suspense } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { useWallet } from "@/hooks/useWallet";
import { useProfileStore } from "@/stores/profileStore";
import { PageSkeleton } from "@/components/common";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { ChallengeDetailPage } from "@/features/challenges/ChallengeDetailPage";
import { LandingPage } from "@/features/landing/LandingPage";
import { registerTabSetter, consumeGrowthSubTab } from "@/hooks/useNavigate";
import { HomeIcon, VaultIcon, SavingsIcon, BorrowIcon } from "@/components/common/Icons";
import { Avatar } from "@/components/account/Avatar";
import { PiggyLogo } from "@/components/common/PiggyLogo";

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

function PageContent({ activeTab, growthSubTab }: { activeTab: Tab; growthSubTab: "goals" | "challenges" | null }) {
  switch (activeTab) {
    case "home":
      return <DashboardPage />;
    case "vault":
      return <VaultPage />;
    case "borrow":
      return <BorrowPage />;
    case "growth":
      return <GrowthPage initialTab={growthSubTab ?? undefined} />;
    case "account":
      return <AccountPage />;
  }
}

function AppShell({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (tab: Tab) => void }) {
  const { address } = useWallet();
  const { username } = useProfileStore();
  const [prefetched, setPrefetched] = useState(false);
  const [growthSubTab, setGrowthSubTab] = useState<"goals" | "challenges" | null>(null);

  useEffect(() => {
    if (prefetched) return;
    const timer = setTimeout(() => {
      import("@/features/vault/VaultPage");
      import("@/features/account/AccountPage");
      setPrefetched(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [prefetched]);

  // Listen for piggy:navigate custom event from landing page
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.tab) {
        if (detail.tab === "growth" && detail.subTab === "challenges") {
          setGrowthSubTab("challenges");
        }
        onTabChange(detail.tab);
      }
    };
    window.addEventListener("piggy:navigate", handler);
    return () => window.removeEventListener("piggy:navigate", handler);
  }, [onTabChange]);

  // Consume growthSubTab signal from useNavigate.goToGrowthChallenges
  useEffect(() => {
    const signal = consumeGrowthSubTab();
    if (signal) {
      setGrowthSubTab(signal);
    }
  }, [activeTab]);

  // Reset growthSubTab when navigating away from growth
  useEffect(() => {
    if (activeTab !== "growth") {
      setGrowthSubTab(null);
    }
  }, [activeTab]);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between px-5 pt-3 pb-2">
        <div className="flex items-center gap-1.5">
          <PiggyLogo size={28} showBackground={false} />
          <span className="text-xl font-bold text-gray-900">Piggy</span>
        </div>
        <button
          onClick={() => onTabChange("account")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600 transition-colors hover:bg-green-200"
        >
          <Avatar address={address} username={username} size="sm" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-2 pb-24">
        <ErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>
            <PageContent activeTab={activeTab} growthSubTab={growthSubTab} />
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
                  ? "text-sage-700"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              aria-current={activeTab === id ? "page" : undefined}
            >
              <Icon size={22} />
              <span className="text-[11px] font-semibold">{label}</span>
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
    return <LandingPage />;
  }

  return <AppShell activeTab={activeTab} onTabChange={setActiveTab} />;
}

export default function AppRoot() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/challenge/:id" element={<ChallengeDetailPage />} />
        </Routes>
      </HashRouter>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#1a1a1a",
            color: "#f5f5f5",
            border: "1px solid #333",
            fontSize: "14px",
          },
        }}
      />
    </ErrorBoundary>
  );
}
