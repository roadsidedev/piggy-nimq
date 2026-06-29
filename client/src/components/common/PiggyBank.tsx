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
      setCoinY(-40);
      setCoinOpacity(0);
      
      setTimeout(() => {
        setCoinOpacity(1);
        setCoinY(60); 
        
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

      {/* Piggy Body (Refined Style) */}
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
          d="M108 58 C68 58, 38 88, 38 123 C38 158, 68 188, 108 188 C148 188, 178 158, 178 123 C178 88, 148 58, 108 58Z"
          fill="black"
        />
        <rect x="75" y="178" width="20" height="20" rx="6" fill="black" />
        <rect x="130" y="178" width="20" height="20" rx="6" fill="black" />
        
        {/* Main Body */}
        <path
          d="M100 50 C60 50, 30 80, 30 115 C30 150, 60 180, 100 180 C140 180, 170 150, 170 115 C170 80, 140 50, 100 50Z"
          fill="black"
        />
        
        {/* White Body Fill */}
        <path
          d="M100 60 C70 60, 44 86, 44 115 C44 144, 70 170, 100 170 C130 170, 156 144, 156 115 C156 86, 130 60, 100 60Z"
          fill="white"
        />

        {/* Ear */}
        <path
          d="M75 60 L65 35 L85 50 Z"
          fill="black"
        />
        <path
          d="M75 66 L69 46 L81 58 Z"
          fill="white"
        />

        {/* Coin slot */}
        <path
          d="M85 78 Q105 68, 125 78"
          stroke="black"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
        />

        {/* Eye */}
        <circle cx="75" cy="115" r="9" fill="black" />

        {/* Tail */}
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

        {/* Legs */}
        <rect x="65" y="168" width="20" height="20" rx="6" fill="black" />
        <rect x="70" y="168" width="10" height="14" rx="3" fill="white" />
        
        <rect x="120" y="168" width="20" height="20" rx="6" fill="black" />
        <rect x="125" y="168" width="10" height="14" rx="3" fill="white" />
      </svg>
    </div>
  );
}
