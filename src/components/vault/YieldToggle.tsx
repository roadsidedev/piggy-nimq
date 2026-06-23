interface YieldToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function YieldToggle({ enabled, onToggle }: YieldToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center justify-between rounded-xl border p-4 transition-colors ${
        enabled
          ? "border-green-700 bg-green-900/30"
          : "border-neutral-800 bg-neutral-900"
      }`}
    >
      <div className="text-left">
        <p className="text-sm font-medium text-white">Yield</p>
        <p className="text-xs text-neutral-400">
          {enabled
            ? "Supplying to Aave for yield"
            : "Funds held in vault without yield"}
        </p>
      </div>
      <div
        className={`h-6 w-11 rounded-full transition-colors ${
          enabled ? "bg-green-500" : "bg-neutral-700"
        }`}
      >
        <div
          className={`h-6 w-6 rounded-full bg-white transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}
