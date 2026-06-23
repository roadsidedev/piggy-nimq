import { TrendingUpIcon } from "@/components/common/Icons";

interface YieldCardProps {
  enabled: boolean;
  apy: number;
  estimatedMonthly?: string;
}

export function YieldCard({ enabled, apy, estimatedMonthly }: YieldCardProps) {
  return (
    <div className={`rounded-2xl p-4 shadow-sm ${enabled ? "bg-green-50" : "bg-white"}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Yield</span>
        <div className={`h-5 w-9 rounded-full transition-colors ${enabled ? "bg-green-500" : "bg-gray-300"}`}>
          <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-4" : "translate-x-0.5"}`} />
        </div>
      </div>
      <p className={`text-xs font-medium ${enabled ? "text-green-600" : "text-gray-400"}`}>
        {enabled ? "ON" : "OFF"}
      </p>
      <div className="mt-2">
        <p className="text-xs text-gray-500">Current APY</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900">{apy.toFixed(1)}%</span>
        </div>
        {enabled && estimatedMonthly ? (
          <p className="text-xs text-gray-500">
            {apy.toFixed(1)}% (${estimatedMonthly}) Estd Monthly earnings
          </p>
        ) : null}
      </div>
      {enabled ? (
        <div className="mt-2 flex items-center gap-1 text-green-600">
          <TrendingUpIcon size={14} />
          <span className="text-xs font-medium">Growing</span>
        </div>
      ) : null}
    </div>
  );
}
