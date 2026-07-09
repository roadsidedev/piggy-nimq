import { useState, useEffect, useRef, useCallback } from "react";
import { useWallet } from "@/hooks/useWallet";

/* ── Helpers ────────────────────────────────────────────── */

const NUGGETS = [
  { tag: "On recurring", text: "Small deposits add up faster than big regrets." },
  { tag: "On yield", text: "Idle cash doesn't grow on its own. Cash with a job does." },
  { tag: "On goals", text: "A goal with a deadline is a plan. A goal without one is a wish." },
  { tag: "On borrowing", text: "You don't have to sell your savings to solve a cash problem." },
  { tag: "On streaks", text: "Streaks aren't magic — they're just showing up again tomorrow." },
  { tag: "On frens", text: "Saving alone works. Saving with frens works better." },
];

const FAQ_ITEMS = [
  { q: "What is Piggy?", a: "Piggy is a self-custodial savings app that lives inside Nimiq Pay. Save stablecoins, opt into yield, borrow against your savings, set goals, and save alongside friends — without ever leaving your wallet." },
  { q: "Where does the yield come from?", a: "When you turn on yield, your funds are supplied to Aave, an established DeFi lending protocol. You earn whatever the live market rate is — Piggy doesn't set or guarantee a rate." },
  { q: "Do I have to enable yield?", a: "No. Yield is opt-in and adjustable. Choose how much of your savings, if any, is exposed, and change it any time." },
  { q: "Can I borrow without giving up my savings?", a: "Yes. Borrowing draws against savings you've put into yield, without requiring you to withdraw or sell anything first." },
  { q: "Is my money safe?", a: "Piggy is self-custodial — only you control your funds, Piggy never takes custody. Like any DeFi product, enabling yield or borrowing carries protocol-level risk, so only expose what you're comfortable with." },
  { q: "What happens if I want my money back?", a: "Unallocated savings withdraw instantly. Funds in your yield balance or a goal withdraw in one step too — Piggy tells you upfront if market conditions temporarily limit what's available." },
  { q: "When can I try it?", a: "Piggy is live in testing now, built for the Nimiq Mini Apps Competition. Open it inside Nimiq Pay to try the current build." },
];

const FEATURES = [
  { icon: "🐷", bg: "bg-pink-100", title: "Save", desc: "A self-custodial vault for your stablecoins. Deposit and withdraw whenever — nothing is ever locked without your say." },
  { icon: "🌱", bg: "bg-mint-50", title: "Grow", desc: "Choose how much of your savings earns yield through Aave — even a portion. The rest stays put, exactly as idle as you want it." },
  { icon: "💸", bg: "bg-gold-100", title: "Borrow", desc: "Need cash? Borrow against your savings instead of cashing out. See your health factor before you ever sign anything." },
  { icon: "🎯", bg: "bg-[#E4E7FF]", title: "Goals", desc: "Give a slice of your savings a name and a deadline. Rent, a trip, an emergency fund — track it separately, on purpose." },
  { icon: "🔥", bg: "bg-pink-100", title: "Frens", desc: "Join a savings challenge, keep a streak alive, and see where you land on the board. Saving is more fun with an audience." },
];

const LEADERBOARD = [
  { rank: "01", name: "amaka.eth", streak: "18 day streak 🔥", amt: "$540", color: "bg-pink-300", initial: "A" },
  { rank: "02", name: "tobi.eth", streak: "14 day streak 🔥", amt: "$410", color: "bg-gold-300", initial: "T" },
  { rank: "03", name: "you", streak: "9 day streak 🔥", amt: "$255", color: "bg-mint-400", initial: "Y" },
];

const STEPS = [
  { n: 1, title: "Drop in what you can", desc: "Deposit stablecoins into your vault, any amount, any time." },
  { n: 2, title: "Let it work", desc: "Turn on yield for some or all of it, and let idle savings start earning." },
  { n: 3, title: "Tap it if you need it", desc: "Borrow against your stash instead of withdrawing and starting over." },
  { n: 4, title: "Keep it going", desc: "Set up recurring deposits so the cycle runs itself, on your schedule." },
];

/* ── Piggy SVG Symbol ───────────────────────────────────── */

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

/* ── Intersection Observer Hook ─────────────────────────── */

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }
    el.style.opacity = "0";
    el.style.transform = "translateY(18px)";
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.style.transition = "opacity .7s ease, transform .7s ease";
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          io.unobserve(el);
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return ref;
}

/* ── Phone Mockup (Interactive) ─────────────────────────── */

const CAP = 250;

function PhoneMockup() {
  const [, setBalance] = useState(0);
  const [coinAnimating, setCoinAnimating] = useState(false);
  const [coinKey, setCoinKey] = useState(0);
  const [plusText, setPlusText] = useState<string | null>(null);
  const [plusKey, setPlusKey] = useState(0);
  const [showCrack, setShowCrack] = useState(false);
  const busyRef = useRef(false);

  const prefersReduced = useRef(window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const dropCoin = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    setCoinAnimating(true);
    setCoinKey((k) => k + 1);

    const amount = Math.floor(Math.random() * 14) + 4;

    setTimeout(
      () => {
        setBalance((b) => {
          const next = b + amount;
          if (next >= CAP) {
            setTimeout(() => setShowCrack(true), 260);
          }
          return next;
        });

        setPlusText(`+$${amount}`);
        setPlusKey((k) => k + 1);
        setTimeout(() => setPlusText(null), 950);

        setCoinAnimating(false);
        busyRef.current = false;
      },
      prefersReduced.current ? 30 : 480,
    );
  }, []);

  useEffect(() => {
    if (!showCrack) return;
    const timer = setTimeout(() => {
      setShowCrack(false);
      setBalance(0);
    }, 2600);
    return () => clearTimeout(timer);
  }, [showCrack]);

  return (
    <div className="phone-stage flex justify-center">
      <div className="phone relative w-[290px] max-w-[82vw] rounded-[44px] p-3.5 shadow-[0_40px_70px_-30px_rgba(16,17,36,0.55),inset_0_0_0_1px_rgba(255,255,255,0.04)]" style={{ aspectRatio: "290/580", background: "linear-gradient(160deg,#1D1E36,#101124)" }}>
        <div className="phone-screen relative flex h-full w-full flex-col overflow-hidden rounded-[32px] bg-gradient-to-b from-pink-50 to-white px-3 pt-5 pb-4">
          {/* Notch */}
          <div className="absolute left-1/2 top-2.5 z-10 h-[18px] w-[70px] -translate-x-1/2 rounded-full bg-navy-900" />

          {/* Header */}
          <div className="flex items-center justify-between px-1 pt-4 pb-2">
            <div className="flex items-center gap-1">
              <PiggySvg className="h-5 w-5" />
              <span className="text-[11px] font-bold text-ink" style={{ color: "#17182B" }}>Piggy</span>
            </div>
            <div className="h-5 w-5 rounded-full bg-pink-200" />
          </div>

          {/* Vault Balance Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-100 via-pink-50 to-pink-100 p-3.5 shadow-sm">
            <div className="relative z-10">
              <p className="text-[9px] font-medium text-pink-500/80">Your Vault Balance</p>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="text-[20px] font-bold text-ink" style={{ color: "#17182B" }}>$1,240</span>
                <span className="text-[9px] font-medium text-pink-400">USDT</span>
              </div>
              <p className="mt-0.5 text-[8px] text-pink-400/70">+$2.40 today (Yield ON · 4.2% APY)</p>
            </div>
            <div className="absolute -right-1 -top-1 opacity-70">
              <PiggySvg className="w-16" />
            </div>
          </div>

          {/* Yield + Borrowed row */}
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <div className="rounded-xl bg-white p-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-medium text-gray-800">Yield</span>
                <div className="h-3 w-6 rounded-full bg-pink-400">
                  <div className="h-3 w-3 rounded-full bg-white shadow-sm translate-x-3" />
                </div>
              </div>
              <p className="text-[7px] font-medium text-pink-400">ON</p>
              <p className="text-[14px] font-bold text-gray-900 mt-0.5">4.2%</p>
            </div>
            <div className="rounded-xl bg-white p-2.5 shadow-sm">
              <p className="text-[9px] font-medium text-gray-800">Borrowed</p>
              <p className="text-[14px] font-bold text-gray-900 mt-0.5">$0</p>
              <div className="mt-1 flex justify-center">
                <svg width="28" height="28" viewBox="0 0 28 28">
                  <circle cx="14" cy="14" r="10" fill="none" stroke="#ffd9e2" strokeWidth="3" />
                  <circle cx="14" cy="14" r="10" fill="none" stroke="#c93e63" strokeWidth="3" strokeLinecap="round" strokeDasharray="62.8" strokeDashoffset="0" transform="rotate(-90 14 14)" />
                </svg>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {["Deposit", "Borrow", "Goal", "Challenge"].map((label) => (
              <div key={label} className="flex flex-col items-center gap-1 rounded-xl bg-white p-1.5 shadow-sm">
                <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-pink-100">
                  <div className="h-2 w-2 rounded-full bg-pink-400" />
                </div>
                <span className="text-[7px] font-medium text-pink-600">{label}</span>
              </div>
            ))}
          </div>

          {/* Goals Preview */}
          <div className="mt-2 rounded-xl bg-white p-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-semibold text-gray-900">Active Goals</span>
              <span className="text-[7px] text-pink-400">View all</span>
            </div>
            <div className="mt-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-medium text-gray-800">Emergency Fund</span>
                <span className="text-[7px] font-medium text-gray-600">65%</span>
              </div>
              <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-pink-500" style={{ width: "65%" }} />
              </div>
            </div>
          </div>

          {/* Bottom tab bar */}
          <div className="mt-auto flex items-center justify-around rounded-2xl bg-white px-2 py-1.5 shadow-sm">
            {[
              { label: "Home", active: true },
              { label: "Vault", active: false },
              { label: "Growth", active: false },
              { label: "Borrow", active: false },
            ].map((tab) => (
              <div key={tab.label} className="flex flex-col items-center gap-0.5">
                <div className={`h-3.5 w-3.5 rounded-md ${tab.active ? "bg-pink-400" : "bg-gray-300"}`} />
                <span className={`text-[7px] font-semibold ${tab.active ? "text-pink-600" : "text-gray-400"}`}>{tab.label}</span>
              </div>
            ))}
          </div>

          {/* Interactive piggy overlay — tap to feed */}
          <button
            onClick={dropCoin}
            type="button"
            className="absolute bottom-16 left-1/2 z-20 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-pink-300 px-3 py-1.5 text-[10px] font-bold text-white shadow-[0_6px_16px_-4px_rgba(255,111,145,0.5)] transition-transform active:scale-95"
          >
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="6" fill="#fff" opacity="0.85" />
            </svg>
            Drop a coin
          </button>

          {/* Falling coin */}
          {coinAnimating && (
            <div
              key={coinKey}
              className="coin-fall absolute left-1/2 top-1/2 z-30 ml-[-10px] mt-[-40px] h-[20px] w-[20px] rounded-full border-2 border-gold-500"
              style={{
                background: "radial-gradient(circle at 32% 28%, #FFE29A, #F4B740 60%, #D9932A)",
                animation: "fall .55s cubic-bezier(.55,0,.85,.35) forwards",
              }}
            />
          )}

          {/* +$N float */}
          {plusText && (
            <div
              key={plusKey}
              className="float-plus pointer-events-none absolute left-1/2 top-[45%] z-30 -translate-x-1/2 font-mono text-[12px] font-bold text-mint-500"
              style={{ animation: "floatUp 0.9s ease forwards" }}
            >
              {plusText}
            </div>
          )}

          {/* Crack toast */}
          <div
            className={`crack-toast absolute inset-0 z-40 flex flex-col items-center justify-center rounded-[32px] bg-pink-50/97 text-center transition-opacity duration-300 ${
              showCrack ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          >
            <strong className="font-heading text-[15px]" style={{ fontFamily: "var(--font-heading)" }}>🐷 Cracked it open!</strong>
            <p className="mt-1 text-[10px] leading-relaxed text-pink-400/80 px-4">
              A real piggy bank breaks to give up its savings. Yours doesn't — everything's still there, still yours, always liquid.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Nuggets Carousel ───────────────────────────────────── */

function NuggetsSection() {
  const [idx, setIdx] = useState(0);
  const sectionRef = useReveal();

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    const timer = setInterval(() => setIdx((i) => (i + 1) % NUGGETS.length), 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-[74px]">
      <div className="mx-auto max-w-[1120px] px-6">
        <div ref={sectionRef} className="nugget-section rounded-[36px] px-4 py-[56px] text-white sm:mx-4" style={{ background: "#101124" }}>
          <div className="mx-auto max-w-[1120px] px-6">
            <div className="max-w-[60ch]">
              <span className="text-[12.5px] font-extrabold tracking-[0.08em] uppercase text-gold-300">Money, in plain terms</span>
              <h2 className="mt-2.5 font-heading text-[clamp(26px,4.6vw,38px)] font-bold leading-[1.08]" style={{ fontFamily: "var(--font-heading)" }}>
                A few things worth knowing before you save.
              </h2>
              <p className="mt-3 text-[15.5px] leading-relaxed text-white/65 max-w-[52ch]">No jargon, no lecture — just the ideas Piggy is actually built around.</p>
            </div>

            <div className="relative mt-9 min-h-[150px]">
              <div className="relative">
                {NUGGETS.map((n, i) => (
                  <div
                    key={i}
                    className={`absolute inset-0 flex items-center rounded-[18px] border border-white/[0.06] px-7 py-6 transition-all duration-500 ${
                      i === idx ? "relative opacity-100 translate-x-0" : "opacity-0 translate-x-6"
                    }`}
                    style={{ background: "#1B1D38" }}
                  >
                    <p className="font-heading font-medium text-[clamp(17px,2.6vw,21px)] leading-[1.35] text-white" style={{ fontFamily: "var(--font-heading)" }}>
                      <span className="mb-2.5 inline-block font-body text-[11px] font-bold uppercase tracking-[0.05em] text-gold-300" style={{ fontFamily: "var(--font-body)" }}>
                        {n.tag}
                      </span>
                      <br />
                      {n.text}
                    </p>
                  </div>
                ))}
              </div>
              {/* Dots */}
              <div className="mt-5 flex gap-2">
                {NUGGETS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    aria-label={`Show tip ${i + 1}`}
                    className={`h-[5px] rounded-full transition-all duration-250 ${
                      i === idx ? "w-[34px] bg-gold-300" : "w-[22px] bg-white/20"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ────────────────────────────────────────────────── */

function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const sectionRef = useReveal();

  return (
    <section className="py-[74px]">
      <div className="mx-auto max-w-[760px] px-6">
        <div ref={sectionRef}>
          <div className="max-w-[60ch]">
            <h2 className="font-heading text-[clamp(26px,4.6vw,38px)] font-bold leading-[1.08]" style={{ fontFamily: "var(--font-heading)" }}>
              Frequently asked questions
            </h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-pink-400/60 max-w-[52ch]">
              Everything you were about to ask, answered before you scroll away.
            </p>
          </div>

          <div className="mt-8 border-t border-pink-200/40">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = openIdx === i;
              return (
                <div key={i} className="border-b border-pink-200/40">
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left font-heading text-[16.5px] font-medium text-ink" style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {item.q}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className={`flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                      aria-hidden="true"
                    >
                      <path d="M8 2v12M2 8h12" stroke="#17182B" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{
                      maxHeight: isOpen ? "200px" : "0",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div className="pb-5 text-[14.5px] leading-[1.65] text-pink-400/60 max-w-[66ch]">
                      {item.a}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Main Landing Page ──────────────────────────────────── */

export function LandingPage() {
  const { connect } = useWallet();
  const featRef = useReveal();
  const howRef = useReveal();
  const frensRef = useReveal();
  const frensBoardRef = useReveal();

  const handleOpenPiggy = useCallback(() => {
    connect();
  }, [connect]);

  const handleBrowseChallenges = useCallback(() => {
    window.location.hash = "#/growth";
    // Small delay then signal the app to switch to growth+challenges
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("piggy:navigate", { detail: { tab: "growth", subTab: "challenges" } }));
    }, 100);
  }, []);

  const handleScrollToHow = useCallback(() => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#FFF6F3", fontFamily: "var(--font-body)" }}>
      {/* ── Ambient Coins ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {[
          { w: 34, top: "12%", left: "6%", delay: "0s" },
          { w: 20, top: "70%", left: "10%", delay: "2s" },
          { w: 26, top: "22%", left: "88%", delay: "1s" },
          { w: 16, top: "55%", left: "92%", delay: "3.5s" },
          { w: 22, top: "85%", left: "82%", delay: "1.8s" },
        ].map((c, i) => (
          <div
            key={i}
            className="amb-coin absolute rounded-full opacity-35 blur-[0.3px]"
            style={{
              width: c.w,
              height: c.w,
              top: c.top,
              left: c.left,
              animationDelay: c.delay,
              background: "radial-gradient(circle at 32% 28%, #FFE29A, #F4B740 62%, #D9932A)",
            }}
          />
        ))}
      </div>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-40 border-b border-ink/[0.06]" style={{ background: "rgba(255,246,243,0.86)", backdropFilter: "blur(10px)" }}>
        <div className="mx-auto flex max-w-[1120px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5 font-heading text-[19px] font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
            <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-pink-300 shadow-[0_6px_14px_-6px_rgba(255,111,145,0.6)]">
              <PiggySvg className="h-full w-full p-1.5" />
            </span>
            Piggy
          </div>
          <button
            onClick={handleOpenPiggy}
            className="inline-flex items-center gap-1.5 rounded-full bg-pink-300 px-5 py-2.5 text-[14px] font-bold text-white shadow-[0_4px_14px_-4px_rgba(255,111,145,0.5)] transition-all duration-180 hover:-translate-y-px hover:bg-pink-400"
          >
            Open Piggy <span aria-hidden="true">→</span>
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-6 pb-10 pt-14">
        <div className="mx-auto grid max-w-[1120px] items-center gap-10 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-3.5 py-[7px] text-[13px] font-bold tracking-[0.02em] text-pink-500">
              <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
              Lives inside Nimiq Pay
            </span>
            <h1 className="mt-4 font-heading text-[clamp(38px,8vw,64px)] font-bold leading-[0.98] text-ink" style={{ fontFamily: "var(--font-heading)", color: "#17182B" }}>
              Feed it.
              <br />
              Watch it <em className="not-italic text-pink-300">grow</em>.
            </h1>
            <p className="mt-4 max-w-[46ch] text-[17px] leading-[1.55] text-pink-400/70">
              Piggy is a self-custodial savings companion built into Nimiq Pay — save stablecoins, earn optional yield, borrow against your stash without selling it, and hit goals with friends.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={handleOpenPiggy}
                className="inline-flex items-center gap-2 rounded-full bg-pink-300 px-6 py-[15px] text-[15.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(255,111,145,0.45)] transition-all duration-180 hover:-translate-0.5 hover:bg-pink-400 hover:shadow-[0_18px_34px_-12px_rgba(255,111,145,0.55)] active:translate-px active:scale-[0.98]"
              >
                Open Piggy <span aria-hidden="true">→</span>
              </button>
              <button
                onClick={handleScrollToHow}
                className="rounded-full border-2 border-ink/[0.14] bg-transparent px-[22px] py-[15px] text-[15.5px] font-bold text-ink transition-all duration-180 hover:border-ink hover:bg-ink/[0.03]" style={{ color: "#17182B" }}
              >
                See how it works
              </button>
            </div>
            <div className="mt-5 flex flex-wrap gap-4 text-[12.5px] font-semibold text-pink-400/40">
              {["Self-custodial, always", "Yield via Aave", "No app to download"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <span className="h-[5px] w-[5px] rounded-full bg-mint-500" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          <PhoneMockup />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-[74px]">
        <div className="mx-auto max-w-[1120px] px-6">
          <div ref={featRef}>
            <div className="max-w-[60ch]">
              <span className="text-[12.5px] font-extrabold tracking-[0.08em] uppercase text-pink-500">What's inside</span>
              <h2 className="mt-2.5 font-heading text-[clamp(26px,4.6vw,38px)] font-bold leading-[1.08]" style={{ fontFamily: "var(--font-heading)" }}>
                Five ways to make your money work without making it complicated.
              </h2>
            </div>

            <div className="mt-9 flex gap-3.5 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 md:grid-cols-3 lg:grid-cols-5">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="min-w-[240px] snap-start rounded-[18px] border border-ink/[0.05] bg-white p-[22px] shadow-[0_20px_40px_-20px_rgba(23,24,43,0.18)] sm:min-w-0"
                >
                  <div className={`mb-3.5 flex h-11 w-11 items-center justify-center rounded-[13px] text-xl ${f.bg}`}>
                    {f.icon}
                  </div>
                  <h3 className="mb-1.5 font-heading text-[17px] font-semibold" style={{ fontFamily: "var(--font-heading)" }}>{f.title}</h3>
                  <p className="text-[13.5px] leading-[1.5] text-pink-400/60">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Nuggets ── */}
      <NuggetsSection />

      {/* ── How It Works ── */}
      <section className="py-[74px]" id="how-it-works">
        <div className="mx-auto max-w-[1120px] px-6">
          <div ref={howRef}>
            <div className="max-w-[60ch]">
              <span className="text-[12.5px] font-extrabold tracking-[0.08em] uppercase text-pink-500">How it works</span>
              <h2 className="mt-2.5 font-heading text-[clamp(26px,4.6vw,38px)] font-bold leading-[1.08]" style={{ fontFamily: "var(--font-heading)" }}>
                Not a one-time setup. A loop you stay in.
              </h2>
              <p className="mt-3 text-[15.5px] leading-relaxed text-pink-400/60 max-w-[52ch]">
                There's no finish line here — just a cycle that keeps your savings moving.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <div
                  key={s.n}
                  className="rounded-[18px] border border-ink/[0.05] bg-white p-6 shadow-[0_20px_40px_-20px_rgba(23,24,43,0.18)]"
                >
                  <div className="mb-3.5 flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-pink-100 text-[14px] font-extrabold text-pink-500">
                    {s.n}
                  </div>
                  <h3 className="mb-1.5 font-heading text-[16.5px] font-semibold" style={{ fontFamily: "var(--font-heading)" }}>{s.title}</h3>
                  <p className="text-[13.5px] leading-[1.5] text-pink-400/60">{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-[12.5px] font-bold text-pink-400/40">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 8a6 6 0 1 1 2 4.5M2 8V4M2 8h4" stroke="#8C8DA3" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              back to step one, whenever you're ready
            </div>
          </div>
        </div>
      </section>

      {/* ── Frens ── */}
      <section className="py-[74px]">
        <div className="mx-auto max-w-[1120px] px-6">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
            <div ref={frensRef}>
              <span className="text-[12.5px] font-extrabold tracking-[0.08em] uppercase text-pink-500">Save with frens</span>
              <h2 className="mt-2.5 font-heading text-[clamp(26px,4.6vw,38px)] font-bold leading-[1.08]" style={{ fontFamily: "var(--font-heading)" }}>
                Saving hits different with an audience.
              </h2>
              <p className="mt-3.5 text-[15.5px] leading-relaxed text-pink-400/60 max-w-[52ch]">
                Join a public challenge or start a private one with friends. Keep your streak alive, climb the board, and share it when you do.
              </p>
              <button
                onClick={handleBrowseChallenges}
                className="mt-5.5 inline-flex items-center rounded-full border-2 border-ink/[0.14] bg-transparent px-[22px] py-[15px] text-[15.5px] font-bold text-ink transition-all duration-180 hover:border-ink hover:bg-ink/[0.03]" style={{ color: "#17182B" }}
              >
                Browse challenges
              </button>
            </div>

            <div ref={frensBoardRef} className="rounded-[18px] border border-ink/[0.05] bg-white p-5 shadow-[0_20px_40px_-20px_rgba(23,24,43,0.18)]">
              {LEADERBOARD.map((r) => (
                <div key={r.rank} className="flex items-center gap-3 border-b border-ink/[0.06] px-1.5 py-[11px] last:border-b-0">
                  <span className="w-[22px] font-mono text-[13px] font-bold text-pink-400/40">{r.rank}</span>
                  <span className={`flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white ${r.color}`}>
                    {r.initial}
                  </span>
                  <span className="flex-1 text-[13.5px] font-bold text-ink" style={{ color: "#17182B" }}>
                    {r.name}
                    <br />
                    <span className="text-[12px] font-semibold text-pink-400/40">{r.streak}</span>
                  </span>
                  <span className="font-mono text-[13px] font-bold text-mint-500">{r.amt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <FaqSection />

      {/* ── Final CTA ── */}
      <section className="relative px-6 py-[90px] text-center">
        <div className="mx-auto max-w-[1120px]">
          <PiggySvg className="mx-auto mb-5.5 w-[130px]" />
          <h2 className="font-heading text-[clamp(28px,5vw,42px)] font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Your savings deserve better than a drawer.
          </h2>
          <p className="mx-auto mt-3.5 max-w-[44ch] text-[16px] text-pink-400/60">
            Piggy runs right inside Nimiq Pay — no new app, no new wallet, no seed phrase to write down twice.
          </p>
          <button
            onClick={handleOpenPiggy}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-pink-300 px-6 py-[15px] text-[15.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(255,111,145,0.45)] transition-all duration-180 hover:-translate-0.5 hover:bg-pink-400 hover:shadow-[0_18px_34px_-12px_rgba(255,111,145,0.55)] active:translate-px active:scale-[0.98]"
          >
            Open Piggy <span aria-hidden="true">→</span>
          </button>
          <div className="mt-6">
            <a
              href="https://x.com/Piggyvault__"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[14px] font-semibold text-pink-400/50 transition-colors hover:text-pink-300"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Follow @Piggyvault__ on X
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 pb-10 pt-7 text-center text-[12.5px] text-pink-400/40">
        Piggy is self-custodial software. Saving carries no risk beyond holding your own assets; enabling yield or borrowing carries DeFi-specific risk — read the in-app details before you turn either on.
      </footer>

      {/* ── Inline keyframes ── */}
      <style>{`
        @keyframes drift {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-26px) rotate(14deg); }
        }
        .amb-coin { animation: drift 16s ease-in-out infinite; }

        @keyframes fall {
          0% { transform: translateY(-30px) rotate(0deg); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(150px) rotate(180deg) scale(0.4); opacity: 0; }
        }

        @keyframes floatUp {
          0% { opacity: 0; transform: translate(-50%, 0px); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -42px); }
        }

        .piggy-svg.squish {
          animation: squish .32s ease;
        }
        @keyframes squish {
          0% { transform: scale(1, 1); }
          35% { transform: scale(1.07, 0.88) translateY(4px); }
          65% { transform: scale(0.97, 1.05); }
          100% { transform: scale(1, 1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .amb-coin, .coin-fall, .float-plus, .piggy-svg.squish {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
