import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import { useProfileStore } from "@/stores/profileStore";
import { PageSkeleton } from "@/components/common";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { ChallengeDetailPage } from "@/features/challenges/ChallengeDetailPage";
import { LandingPage } from "@/features/landing/LandingPage";
import { NotFoundPage } from "@/features/NotFoundPage";
import { registerTabSetter, consumeGrowthSubTab } from "@/hooks/useNavigate";
import { HomeIcon, VaultIcon, SavingsIcon, BorrowIcon } from "@/components/common/Icons";
import { Avatar } from "@/components/account/Avatar";

function PiggySvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 170" className={className} aria-hidden="true">
      <defs>
        <filter id="piggyOutline" x="-25%" y="-25%" width="150%" height="150%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="dilated" />
          <feFlood floodColor="#17182B" result="blackFlood" />
          <feComposite in="blackFlood" in2="dilated" operator="in" result="outline" />
          <feMerge>
            <feMergeNode in="outline" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g transform="translate(7,10)" opacity="0.15">
        <ellipse cx="118" cy="38" rx="11" ry="16" transform="rotate(-15 118 38)" fill="#101124" />
        <ellipse cx="145" cy="34" rx="10" ry="15" transform="rotate(12 145 34)" fill="#101124" />
        <ellipse cx="125" cy="92" rx="68" ry="46" fill="#101124" />
        <ellipse cx="44" cy="98" rx="25" ry="19" fill="#101124" />
        <rect x="52" y="128" width="16" height="26" rx="6" fill="#101124" />
        <rect x="168" y="126" width="16" height="26" rx="6" fill="#101124" />
      </g>
      <g filter="url(#piggyOutline)">
        <ellipse cx="118" cy="38" rx="11" ry="16" transform="rotate(-15 118 38)" fill="#FFFFFF" />
        <ellipse cx="145" cy="34" rx="10" ry="15" transform="rotate(12 145 34)" fill="#FFFFFF" />
        <ellipse cx="125" cy="92" rx="68" ry="46" fill="#FFFFFF" />
        <ellipse cx="44" cy="98" rx="25" ry="19" fill="#FFFFFF" />
        <rect x="52" y="128" width="16" height="26" rx="6" fill="#FFFFFF" />
        <rect x="168" y="126" width="16" height="26" rx="6" fill="#FFFFFF" />
      </g>
      <circle cx="66" cy="80" r="6" fill="#17182B" />
      <circle cx="26" cy="96" r="3" fill="#17182B" />
      <rect x="97" y="50" width="24" height="7" rx="3.5" fill="#17182B" />
      <path d="M193 68 C204 62 205 51 196 49 C190 48 187 55 192 58" stroke="#17182B" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md">
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
              <span className="text-xs font-semibold">{label}</span>
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
    return <LandingPage />;
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
