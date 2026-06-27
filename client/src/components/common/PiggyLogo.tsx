interface PiggyLogoProps {
  size?: number;
  className?: string;
  showBackground?: boolean;
}

export function PiggyLogo({ size = 100, className = "", showBackground = true }: PiggyLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background */}
      {showBackground && (
        <rect width="200" height="200" rx="40" fill="#93C47D" />
      )}
      
      {/* 3D Shadow - Offset further for more "chunky" feel */}
      <path
        d="M108 58 C68 58, 38 88, 38 123 C38 158, 68 188, 108 188 C148 188, 178 158, 178 123 C178 88, 148 58, 108 58Z"
        fill="black"
      />
      <rect x="75" y="178" width="20" height="20" rx="6" fill="black" />
      <rect x="130" y="178" width="20" height="20" rx="6" fill="black" />
      
      {/* Main Body (Extra Thick Outline) */}
      <path
        d="M100 50 C60 50, 30 80, 30 115 C30 150, 60 180, 100 180 C140 180, 170 150, 170 115 C170 80, 140 50, 100 50Z"
        fill="black"
      />
      
      {/* White Body Fill - Slightly smaller to make outline look thicker */}
      <path
        d="M100 60 C70 60, 44 86, 44 115 C44 144, 70 170, 100 170 C130 170, 156 144, 156 115 C156 86, 130 60, 100 60Z"
        fill="white"
      />

      {/* Ear (Shadow) */}
      <path
        d="M82 68 L72 43 L92 58 Z"
        fill="black"
      />
      {/* Ear (Main) */}
      <path
        d="M75 60 L65 35 L85 50 Z"
        fill="black"
      />
      <path
        d="M75 66 L69 46 L81 58 Z"
        fill="white"
      />

      {/* Coin slot - Bolder and more curved */}
      <path
        d="M85 78 Q105 68, 125 78"
        stroke="black"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />

      {/* Eye - Slightly larger for more character */}
      <circle cx="75" cy="115" r="9" fill="black" />

      {/* Tail (Shadow) */}
      <path
        d="M175 128 Q187 123, 185 113 Q183 103, 192 106"
        stroke="black"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      {/* Tail (Main) */}
      <path
        d="M168 120 Q180 115, 178 105 Q176 95, 185 98"
        stroke="black"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M168 120 Q180 115, 178 105 Q176 95, 185 98"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Legs (Main) */}
      <rect x="65" y="168" width="20" height="20" rx="6" fill="black" />
      <rect x="70" y="168" width="10" height="14" rx="3" fill="white" />
      
      <rect x="120" y="168" width="20" height="20" rx="6" fill="black" />
      <rect x="125" y="168" width="10" height="14" rx="3" fill="white" />
    </svg>
  );
}
