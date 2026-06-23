interface RiskSimulatorProps {
  availableBorrow: string;
  healthFactor: number;
  simulatedBorrow: string;
  simulatedHealthFactor: number;
  riskLevel: "safe" | "warning" | "danger";
  onSimulateChange: (value: string) => void;
}

const riskColors: Record<string, string> = {
  safe: "text-green-400 border-green-700 bg-green-900/30",
  warning: "text-yellow-400 border-yellow-700 bg-yellow-900/30",
  danger: "text-red-400 border-red-700 bg-red-900/30",
};

const riskLabels: Record<string, string> = {
  safe: "Safe",
  warning: "Caution",
  danger: "High Risk",
};

export function RiskSimulator({
  availableBorrow,
  healthFactor,
  simulatedBorrow,
  simulatedHealthFactor,
  riskLevel,
  onSimulateChange,
}: RiskSimulatorProps) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <h3 className="mb-3 text-sm font-medium text-neutral-400">Risk Simulator</h3>

      <div className="mb-3">
        <label className="mb-1 block text-xs text-neutral-500">
          Simulate borrow amount (USDC)
        </label>
        <input
          type="range"
          min="0"
          max={Math.max(1, Number(availableBorrow))}
          step="1"
          value={Number(simulatedBorrow)}
          onChange={(e) => onSimulateChange(e.target.value)}
          className="w-full accent-pink-600"
        />
        <div className="mt-1 flex justify-between text-xs text-neutral-500">
          <span>$0</span>
          <span>${availableBorrow}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-neutral-500">Simulated Health Factor</p>
          <p className="text-lg font-semibold text-white">
            {simulatedHealthFactor.toFixed(2)}
          </p>
        </div>
        <div
          className={`rounded-lg border px-3 py-1 text-xs font-medium ${riskColors[riskLevel]}`}
        >
          {riskLabels[riskLevel]}
        </div>
      </div>

      {healthFactor > 0 ? (
        <p className="mt-2 text-xs text-neutral-500">
          Current HF: {healthFactor.toFixed(2)}
        </p>
      ) : null}

      {riskLevel === "danger" ? (
        <p className="mt-2 text-xs text-red-400">
          Warning: Health factor below 1.5 increases liquidation risk.
        </p>
      ) : null}
    </div>
  );
}
