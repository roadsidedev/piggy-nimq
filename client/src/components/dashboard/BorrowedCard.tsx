interface BorrowedCardProps {
  borrowedAmount: string;
  healthFactor: number;
}

function CircularGauge({ percentage, color }: { percentage: number; color: string }) {
  const radius = 32;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle
        cx="40"
        cy="40"
        r={radius}
        fill="none"
        stroke="#dcebd6"
        strokeWidth={stroke}
      />
      <circle
        cx="40"
        cy="40"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 40 40)"
        className="transition-all duration-700"
      />
      <text x="40" y="44" textAnchor="middle" className="text-sm font-bold" fill="#1a1a1a">
        {Math.round(percentage)}%
      </text>
    </svg>
  );
}

export function BorrowedCard({ borrowedAmount, healthFactor }: BorrowedCardProps) {
  const gaugePercentage = Math.min(100, healthFactor * 30);
  const gaugeColor = healthFactor > 2 ? "#38761d" : healthFactor > 1.5 ? "#93c47d" : "#ef4444";

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-gray-800">Borrowed</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">${borrowedAmount}</p>
      <div className="mt-3 flex justify-center">
        <CircularGauge percentage={gaugePercentage} color={gaugeColor} />
      </div>
      <p className="mt-1 text-center text-xs text-gray-600">
        Health Factor {healthFactor > 99 ? "99+" : healthFactor.toFixed(1)}
      </p>
    </div>
  );
}
