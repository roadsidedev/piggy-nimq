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
  safe: "text-green-400 border-green-700 bg-green-900/30",
  warning: "text-yellow-400 border-yellow-700 bg-yellow-900/30",
  danger: "text-red-400 border-red-700 bg-red-900/30",
};

const riskLabels: Record<string, string> = {
  safe: "Safe",
  warning: "Caution",
  danger: "High Risk",
};

const riskBarColors: Record<string, string> = {
  safe: "bg-green-500",
  warning: "bg-yellow-500",
  danger: "bg-red-500",
};

function HealthGauge({ value, max }: { value: number; max: number }) {
  const clampedMax = Math.max(max, 1);
  const pct = Math.min((value / clampedMax) * 100, 100);
  const color = value > 3 ? "bg-green-500" : value > 1.5 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-700">
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
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <h3 className="mb-3 text-sm font-medium text-neutral-400">Risk Simulator</h3>

      {/* Borrow APY info */}
      {borrowApy > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-neutral-800/50 px-3 py-2">
          <span className="text-xs text-neutral-500">Variable Borrow APY</span>
          <span className="text-xs font-semibold text-white">{borrowApy.toFixed(2)}%</span>
        </div>
      )}

      {/* Amount input + slider */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs text-neutral-500">
          Simulate borrow amount
        </label>
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 focus-within:ring-2 focus-within:ring-pink-600">
          <span className="text-neutral-500">$</span>
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
            className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 outline-none"
          />
          {maxBorrow > 0 && (
            <button
              onClick={() => onSimulateChange(maxBorrow.toString())}
              className="rounded bg-pink-600/20 px-2 py-0.5 text-[10px] font-medium text-pink-400 hover:bg-pink-600/30"
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
          className="w-full accent-pink-600"
        />
        <div className="mt-1 flex justify-between text-xs text-neutral-500">
          <span>$0</span>
          <span>${availableBorrow}</span>
        </div>
      </div>

      {/* Health Factor Gauge */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs text-neutral-500">Health Factor</span>
          {simAmt > 0 && (
            <span className="text-xs text-neutral-500">
              {healthFactor.toFixed(2)} → <span className="font-semibold text-white">{simulatedHealthFactor.toFixed(2)}</span>
            </span>
          )}
        </div>
        <HealthGauge value={simulatedHealthFactor} max={6} />
        {/* Liquidation threshold marker */}
        {liquidationThreshold > 0 && (
          <div className="relative mt-1 h-1">
            <div
              className="absolute top-0 h-1 w-0.5 bg-red-500/60"
              style={{ left: `${Math.min((liquidationThreshold / 6) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Results grid */}
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-neutral-800/50 p-3">
          <p className="text-[10px] text-neutral-500">Simulated HF</p>
          <p className="text-lg font-semibold text-white">
            {simulatedHealthFactor.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg bg-neutral-800/50 p-3">
          <p className="text-[10px] text-neutral-500">Risk Level</p>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${riskBarColors[riskLevel] ?? "bg-neutral-500"}`} />
            <span className={`text-sm font-semibold ${(riskColors[riskLevel] ?? "text-white").split(" ")[0]}`}>
              {riskLabels[riskLevel] ?? "Unknown"}
            </span>
          </div>
        </div>
      </div>

      {/* Monthly cost */}
      {simAmt > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-neutral-800/50 px-3 py-2">
          <span className="text-xs text-neutral-500">Est. Monthly Interest</span>
          <span className="text-sm font-semibold text-white">${monthlyInterest}</span>
        </div>
      )}

      {/* Current position */}
      {hasDebt && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-neutral-800/50 px-3 py-2">
          <span className="text-xs text-neutral-500">Current Debt</span>
          <span className="text-xs font-medium text-white">${borrowedAmount}</span>
        </div>
      )}

      {/* Warnings */}
      {riskLevel === "danger" && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3">
          <p className="text-xs font-medium text-red-400">
            ⚠️ Health factor below 1.5 significantly increases liquidation risk. If it drops below 1.0, your collateral will be liquidated.
          </p>
        </div>
      )}
      {riskLevel === "warning" && (
        <div className="rounded-lg border border-yellow-800 bg-yellow-900/20 p-3">
          <p className="text-xs font-medium text-yellow-400">
            Moderate risk. Consider keeping health factor above 2.0 for safety margin.
          </p>
        </div>
      )}
      {simAmt > 0 && riskLevel === "safe" && (
        <div className="rounded-lg border border-green-800 bg-green-900/20 p-3">
          <p className="text-xs font-medium text-green-400">
            Comfortable position. You have a good safety buffer above liquidation.
          </p>
        </div>
      )}

      {/* Quick presets */}
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
                    ? "bg-pink-600 text-white"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
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
