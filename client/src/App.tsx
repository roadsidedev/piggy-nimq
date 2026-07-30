import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import { useProfileStore } from "@/stores/profileStore";
import { PageSkeleton } from "@/components/common";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { PiggySvg } from "@/components/common/PiggySvg";
import { registerTabSetter, consumeGrowthSubTab } from "@/hooks/useNavigate";
import { HomeIcon, VaultIcon, SavingsIcon, BorrowIcon } from "@/components/common/Icons";
import { Avatar } from "@/components/account/Avatar";

const LandingPage = lazy(() => import("@/features/landing/LandingPage").then((m) => ({ default: m.LandingPage })));
const ChallengeDetailPage = lazy(() => import("@/features/challenges/ChallengeDetailPage").then((m) => ({ default: m.ChallengeDetailPage })));
const NotFoundPage = lazy(() => import("@/features/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

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
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="flex items-center justify-between px-5 pt-3 pb-2">
        <a href="#/landing" className="flex items-center gap-2.5 font-heading text-lg font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
          <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-pink-300 shadow-[0_6px_14px_-6px_rgba(255,111,145,0.6)]">
            <PiggySvg className="h-full w-full p-1.5" />
          </span>
          Piggy
        </a>
        <button
          onClick={() => onTabChange("account")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-100 text-sm font-bold text-pink-600 transition-colors hover:bg-pink-200"
        >
          <Avatar address={address} username={username} size="sm" />
        </button>
      </header>

      <main id="main-content" className="flex-1 overflow-y-auto px-4 pt-2 pb-24">
        <ErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>
            <PageContent activeTab={activeTab} growthSubTab={growthSubTab} />
          </Suspense>
        </ErrorBoundary>
      </main>

      <nav className="fixed bottom-5 left-3 right-3 z-50">
        <div
          className="mx-auto flex w-full max-w-md items-center justify-around rounded-full px-2 py-1.5"
          style={{
            background: "rgba(255, 255, 255, 0.65)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            boxShadow:
              "0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.5)",
          }}
        >
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
              className={`relative flex flex-col items-center gap-0.5 rounded-full px-4 py-2 transition-all duration-300 ${
                activeTab === id
                  ? "text-sage-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              aria-current={activeTab === id ? "page" : undefined}
            >
              {activeTab === id && (
                <span
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "rgba(201, 62, 99, 0.1)",
                    boxShadow: "inset 0 1px 2px rgba(201, 62, 99, 0.06)",
                  }}
                />
              )}
              <Icon size={20} />
              <span className="relative text-[10px] font-semibold leading-none">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function AuthLoading() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-white">
      <div className="animate-bounce">
        <span className="flex h-16 w-16 items-center justify-center rounded-[16px] bg-pink-300 shadow-[0_6px_14px_-6px_rgba(255,111,145,0.6)]">
          <PiggySvg className="h-full w-full p-2" />
        </span>
      </div>
      <p className="text-sm font-medium text-gray-500">Signing in with your wallet...</p>
    </div>
  );
}

function App() {
  const { isConnected } = useWallet();
  const { authenticate, status: authStatus } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const authAttemptedRef = useRef(false);

  useEffect(() => {
    const unregister = registerTabSetter(setActiveTab);
    return unregister;
  }, []);

  useEffect(() => {
    if (isConnected && authStatus === "unauthenticated" && !authAttemptedRef.current) {
      authAttemptedRef.current = true;
      authenticate();
    }
    if (!isConnected) {
      authAttemptedRef.current = false;
    }
  }, [isConnected, authStatus, authenticate]);

  if (!isConnected) {
    return (
      <Suspense fallback={<AuthLoading />}>
        <LandingPage />
      </Suspense>
    );
  }

  if (authStatus === "authenticating") {
    return <AuthLoading />;
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
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </HashRouter>
      <Toaster
        position="bottom-center"
        offset={100}
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
