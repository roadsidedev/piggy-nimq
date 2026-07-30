export function PiggySvg({ className = "" }: { className?: string }) {
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
