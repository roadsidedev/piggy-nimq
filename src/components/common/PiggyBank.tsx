interface PiggyBankProps {
  size?: number;
  className?: string;
}

export function PiggyBank({ size = 120, className = "" }: PiggyBankProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <ellipse cx="60" cy="68" rx="38" ry="32" fill="#F9A8D4" />
      <ellipse cx="55" cy="72" rx="22" ry="18" fill="#FBCFE8" opacity="0.6" />
      <circle cx="88" cy="52" r="18" fill="#F9A8D4" />
      <ellipse cx="100" cy="56" rx="8" ry="6" fill="#F472B6" />
      <circle cx="98" cy="55" r="1.5" fill="#BE185D" />
      <circle cx="103" cy="55" r="1.5" fill="#BE185D" />
      <circle cx="92" cy="48" r="3" fill="#1F2937" />
      <circle cx="93" cy="47" r="1" fill="white" />
      <path d="M82 38 C80 28, 92 28, 90 38" fill="#EC4899" />
      <rect x="42" y="94" width="10" height="12" rx="5" fill="#F9A8D4" />
      <rect x="68" y="94" width="10" height="12" rx="5" fill="#F9A8D4" />
      <rect x="42" y="102" width="10" height="4" rx="2" fill="#F472B6" />
      <rect x="68" y="102" width="10" height="4" rx="2" fill="#F472B6" />
      <path d="M22 60 C16 54, 18 44, 22 48" stroke="#F472B6" strokeWidth="3" strokeLinecap="round" fill="none" />
      <rect x="52" y="36" width="16" height="3" rx="1.5" fill="#BE185D" opacity="0.5" />
      <circle cx="84" cy="58" r="4" fill="#F9A8D4" opacity="0.5" />
    </svg>
  );
}
