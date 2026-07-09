interface PiggyLogoProps {
  size?: number;
  className?: string;
}

export function PiggyLogo({ size = 100, className = "" }: PiggyLogoProps) {
  return (
    <img
      src="/piggy-logo.svg"
      alt="Piggy"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
