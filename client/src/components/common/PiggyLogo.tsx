interface PiggyLogoProps {
  size?: number;
  className?: string;
}

export function PiggyLogo({ size = 100, className = "" }: PiggyLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Body */}
      <path
        d="M100 50 C60 50, 30 80, 30 115 C30 150, 60 180, 100 180 C140 180, 170 150, 170 115 C170 80, 140 50, 100 50Z"
        fill="white"
        stroke="black"
        strokeWidth="6"
      />
      {/* Ear */}
      <path
        d="M75 60 L65 35 L85 50 Z"
        fill="white"
        stroke="black"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      {/* Coin slot */}
      <path
        d="M90 58 Q100 52, 110 58"
        stroke="black"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Eye */}
      <path
        d="M72 105 Q78 98, 84 105"
        stroke="black"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Snout */}
      <ellipse
        cx="55"
        cy="115"
        rx="8"
        ry="6"
        fill="black"
      />
      {/* Tail */}
      <path
        d="M168 120 Q180 115, 178 105 Q176 95, 185 98"
        stroke="black"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Legs */}
      <rect x="65" y="168" width="16" height="18" rx="4" fill="white" stroke="black" strokeWidth="4" />
      <rect x="120" y="168" width="16" height="18" rx="4" fill="white" stroke="black" strokeWidth="4" />
    </svg>
  );
}
