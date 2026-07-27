import { TrendingUpIcon } from "@/components/common/Icons";
import { Toggle } from "@/components/common/Toggle";

interface YieldCardProps {
  enabled: boolean;
  apy: number;
  estimatedMonthly?: string;
  onToggle?: () => void;
  loading?: boolean;
}

export function YieldCard({ enabled, apy, estimatedMonthly, onToggle, loading }: YieldCardProps) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className={`w-full rounded-2xl p-4 text-left shadow-sm transition-all duration-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 ${enabled ? "bg-green-50" : "bg-white"} ${loading ? "opacity-60 cursor-wait" : ""}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-body text-sm font-medium text-gray-800">Yield</span>
        <Toggle enabled={enabled} disabled={loading} size="sm" label="Toggle yield" />
      </div>
      <p className={`text-xs font-medium ${enabled ? "text-green-600" : "text-gray-500"}`}>
        {loading ? "Confirm in wallet..." : enabled ? "ON" : "OFF"}
      </p>
      <div className="mt-2">
        <p className="text-xs text-gray-600">Current APY</p>
        <div className="flex items-baseline gap-1">
          <span className="font-heading text-2xl font-bold text-gray-900">{apy.toFixed(1)}%</span>
        </div>
        {enabled && estimatedMonthly ? (
          <p className="text-xs text-gray-600">
            {apy.toFixed(1)}% (${estimatedMonthly}) Estd Monthly earnings
          </p>
        ) : null}
      </div>
      {enabled ? (
        <div className="mt-2 flex items-center gap-1 text-green-700">
          <TrendingUpIcon size={14} aria-hidden="true" />
          <span className="text-xs font-medium">Growing</span>
        </div>
      ) : null}
    </button>
  );
}
