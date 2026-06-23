interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  total: number;
  size?: number;
}

export function DonutChart({ segments, total, size = 140 }: DonutChartProps) {
  const radius = 45;
  const stroke = 14;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 100 100">
        {segments.map((seg) => {
          const pct = total > 0 ? seg.value / total : 0;
          const offset = circumference - pct * circumference;
          const rotation = (accumulated / total) * 360 - 90;
          accumulated += seg.value;

          return (
            <circle
              key={seg.label}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform={`rotate(${rotation} 50 50)`}
              strokeLinecap="round"
            />
          );
        })}
        <text x="50" y="46" textAnchor="middle" className="text-lg font-bold" fill="#1a1a1a">
          ${total.toLocaleString()}
        </text>
        <text x="50" y="60" textAnchor="middle" className="text-[8px]" fill="#9ca3af">
          Total
        </text>
      </svg>

      <div className="flex flex-col gap-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-gray-600">{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
