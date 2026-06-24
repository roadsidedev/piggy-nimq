import { useState, useEffect } from "react";

interface PiggyBankProps {
  size?: number;
  className?: string;
}

export function PiggyBank({ size = 120, className = "" }: PiggyBankProps) {
  const [coinY, setCoinY] = useState(-40);
  const [coinOpacity, setCoinOpacity] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      // Reset coin
      setCoinY(-40);
      setCoinOpacity(0);
      
      // Start animation after a short delay
      setTimeout(() => {
        setCoinOpacity(1);
        setCoinY(60); // Drop into slot
        
        // Fade out as it enters
        setTimeout(() => {
          setCoinOpacity(0);
        }, 600);
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Animated Coin */}
      <svg
        width={size * 0.3}
        height={size * 0.3}
        viewBox="0 0 40 40"
        className="absolute z-0 transition-all duration-700 ease-in"
        style={{
          transform: `translateY(${coinY}px)`,
          opacity: coinOpacity,
          top: "10%",
        }}
      >
        <circle cx="20" cy="20" r="18" fill="#FBBF24" stroke="#B45309" strokeWidth="2" />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#B45309" fontSize="20" fontWeight="bold">$</text>
      </svg>

      {/* Piggy Body (New Logo Style) */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        {/* 3D Shadow */}
        <path
          d="M105 55 C65 55, 35 85, 35 120 C35 155, 65 185, 105 185 C145 185, 175 155, 175 120 C175 85, 145 55, 105 55Z"
          fill="black"
        />
        <rect x="70" y="173" width="16" height="18" rx="4" fill="black" />
        <rect x="125" y="173" width="16" height="18" rx="4" fill="black" />
        
        {/* Main Body (Thick Outline) */}
        <path
          d="M100 50 C60 50, 30 80, 30 115 C30 150, 60 180, 100 180 C140 180, 170 150, 170 115 C170 80, 140 50, 100 50Z"
          fill="black"
        />
        
        {/* White Body Fill */}
        <path
          d="M100 58 C68 58, 42 84, 42 115 C42 146, 68 172, 100 172 C132 172, 158 146, 158 115 C158 84, 132 58, 100 58Z"
          fill="white"
        />

        {/* Ear (Main) */}
        <path
          d="M75 60 L65 35 L85 50 Z"
          fill="black"
        />
        <path
          d="M75 64 L69 44 L81 56 Z"
          fill="white"
        />

        {/* Coin slot */}
        <path
          d="M90 75 Q105 68, 120 75"
          stroke="black"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />

        {/* Eye */}
        <circle cx="75" cy="115" r="7" fill="black" />

        {/* Tail */}
        <path
          d="M168 120 Q180 115, 178 105 Q176 95, 185 98"
          stroke="black"
          strokeWidth="8"
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

        {/* Legs */}
        <rect x="65" y="168" width="16" height="18" rx="4" fill="black" />
        <rect x="69" y="168" width="8" height="14" rx="2" fill="white" />
        
        <rect x="120" y="168" width="16" height="18" rx="4" fill="black" />
        <rect x="124" y="168" width="8" height="14" rx="2" fill="white" />
      </svg>
    </div>
  );
}
