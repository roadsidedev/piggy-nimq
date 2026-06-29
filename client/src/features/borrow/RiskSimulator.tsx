interface RiskSimulatorProps {
  availableBorrow: string;
  borrowedAmount: string;
  healthFactor: number;
  liquidationThreshold: number;
  borrowApy: number;
  monthlyInterest: string;
  simulatedBorrow: string;
  simulatedHealthFactor: number;
  riskLevel: "safe" | "warning" | "danger";
  onSimulateChange: (value: string) => void;
}

const riskColors: Record<string, string> = {
  safe: "text-sage-700 border-sage-300 bg-sage-50",
  warning: "text-amber-700 border-amber-300 bg-amber-50",
  danger: "text-red-700 border-red-300 bg-red-50",
};

const riskLabels: Record<string, string> = {
  safe: "Safe",
  warning: "Caution",
  danger: "High Risk",
};

const riskBarColors: Record<string, string> = {
  safe: "bg-sage-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

function formatHF(value: number): string {
  if (!isFinite(value) || value > 999) return "999+";
  if (value < 0.001) return "0.000";
  return value.toFixed(3);
}

function HealthGauge({ value, max }: { value: number; max: number }) {
  const clampedMax = Math.max(max, 1);
  const pct = Math.min((value / clampedMax) * 100, 100);
  const color = value > 3 ? "bg-sage-500" : value > 1.5 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
      <div
        className={`h-full rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function RiskSimulator({
  availableBorrow,
  borrowedAmount,
  healthFactor,
  liquidationThreshold,
  borrowApy,
  monthlyInterest,
  simulatedBorrow,
  simulatedHealthFactor,
  riskLevel,
  onSimulateChange,
}: RiskSimulatorProps) {
  const maxBorrow = Math.max(0, Number(availableBorrow));
  const simAmt = Number(simulatedBorrow);
  const hasDebt = Number(borrowedAmount) > 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-800">Risk Simulator</h3>

      {borrowApy > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
          <span className="text-xs text-gray-500">Variable Borrow APY</span>
          <span className="text-xs font-semibold text-gray-800">{borrowApy.toFixed(2)}%</span>
        </div>
      )}

      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-gray-600">
          Simulate borrow amount
        </label>
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 focus-within:ring-2 focus-within:ring-sage-300">
          <span className="text-gray-500">$</span>
          <input
            type="number"
            min="0"
            max={maxBorrow}
            step="0.01"
            placeholder="0.00"
            value={simulatedBorrow === "0" ? "" : simulatedBorrow}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") {
                onSimulateChange("0");
              } else {
                const num = Math.min(Number(val), maxBorrow);
                onSimulateChange(num.toString());
              }
            }}
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
          />
          {maxBorrow > 0 && (
            <button
              onClick={() => onSimulateChange(maxBorrow.toString())}
              className="rounded bg-sage-100 px-2 py-0.5 text-[10px] font-semibold text-sage-700 hover:bg-sage-200"
            >
              MAX
            </button>
          )}
        </div>
        <input
          type="range"
          min="0"
          max={maxBorrow || 1}
          step={maxBorrow > 1000 ? "1" : "0.01"}
          value={simAmt}
          onChange={(e) => onSimulateChange(e.target.value)}
          className="w-full accent-sage-500"
        />
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>$0</span>
          <span>${availableBorrow}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">Health Factor</span>
          {simAmt > 0 && (
            <span className="text-xs text-gray-500">
              {formatHF(healthFactor)} → <span className="font-semibold text-gray-800">{formatHF(simulatedHealthFactor)}</span>
            </span>
          )}
        </div>
        <HealthGauge value={simulatedHealthFactor} max={6} />
        {liquidationThreshold > 0 && (
          <div className="relative mt-1 h-1">
            <div
              className="absolute top-0 h-1 w-0.5 bg-red-400"
              style={{ left: `${Math.min((liquidationThreshold / 6) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-[11px] font-medium text-gray-500">Simulated HF</p>
          <p className="text-lg font-semibold text-gray-800">
            {formatHF(simulatedHealthFactor)}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-[11px] font-medium text-gray-500">Risk Level</p>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${riskBarColors[riskLevel] ?? "bg-gray-400"}`} />
            <span className={`text-sm font-semibold ${(riskColors[riskLevel] ?? "text-gray-700").split(" ")[0]}`}>
              {riskLabels[riskLevel] ?? "Unknown"}
            </span>
          </div>
        </div>
      </div>

      {simAmt > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
          <span className="text-xs text-gray-500">Est. Monthly Interest</span>
          <span className="text-sm font-semibold text-gray-800">${monthlyInterest}</span>
        </div>
      )}

      {hasDebt && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
          <span className="text-xs text-gray-500">Current Debt</span>
          <span className="text-xs font-medium text-gray-700">${borrowedAmount}</span>
        </div>
      )}

      {riskLevel === "danger" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-xs font-medium text-red-700">
            Health factor below 1.5 significantly increases liquidation risk. If it drops below 1.0, your collateral will be liquidated.
          </p>
        </div>
      )}
      {riskLevel === "warning" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-medium text-amber-700">
            Moderate risk. Consider keeping health factor above 2.0 for safety margin.
          </p>
        </div>
      )}
      {simAmt > 0 && riskLevel === "safe" && (
        <div className="rounded-lg border border-sage-200 bg-sage-50 p-3">
          <p className="text-xs font-medium text-sage-700">
            Comfortable position. You have a good safety buffer above liquidation.
          </p>
        </div>
      )}

      {maxBorrow > 0 && (
        <div className="mt-3 flex gap-2">
          {[25, 50, 75, 100].map((pct) => {
            const val = (maxBorrow * pct) / 100;
            return (
              <button
                key={pct}
                onClick={() => onSimulateChange(val.toString())}
                className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                  Math.abs(simAmt - val) < 0.01
                    ? "bg-sage-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {pct}%
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
