import { useWallet } from "@/hooks/useWallet";

function PiggySvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 170" className={className} aria-hidden="true">
      <defs>
        <filter id="piggyOutline404" x="-25%" y="-25%" width="150%" height="150%">
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
      <g filter="url(#piggyOutline404)">
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

export function NotFoundPage() {
  const { isConnected } = useWallet();

  const handleGoHome = () => {
    window.location.hash = isConnected ? "#/" : "#/landing";
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center" style={{ background: "#fff6f3" }}>
      <PiggySvg className="w-[140px] mb-6 opacity-80" />
      <h1 className="font-heading text-4xl font-bold text-ink" style={{ fontFamily: "var(--font-heading)", color: "#17182B" }}>
        404
      </h1>
      <p className="mt-2 text-base text-pink-400/70 max-w-[40ch]">
        This page wandered off the farm. Let's get you back to your vault.
      </p>
      <button
        onClick={handleGoHome}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-pink-300 px-6 py-3 text-base font-bold text-white shadow-[0_14px_30px_-12px_rgba(255,111,145,0.45)] transition-all duration-700 hover:-translate-0.5 hover:bg-pink-400 active:scale-[0.98]"
      >
        Back to Piggy
      </button>
    </div>
  );
}
