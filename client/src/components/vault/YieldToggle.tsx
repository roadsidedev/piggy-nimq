import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button, Input } from "@/components/common";
import type { TxStatus } from "@/types";

interface YieldPanelProps {
  yieldEnabled: boolean;
  yieldAmount: string;
  balance: string;
  apy: number;
  earnings: string;
  txStatus: TxStatus;
  onConfirm: (amount: string) => Promise<void>;
  onAdjust: () => void;
  onDisable: () => void;
}

export function YieldPanel({
  yieldEnabled,
  yieldAmount,
  balance,
  apy,
  earnings,
  txStatus,
  onConfirm,
  onAdjust,
  onDisable,
}: YieldPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [inputAmount, setInputAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const balanceNum = Number(balance);
  const inputNum = Number(inputAmount) || 0;
  const remainder = Math.max(0, balanceNum - inputNum);
  const isValid = inputNum > 0 && inputNum <= balanceNum;

  // Slider: 0-100% of balance
  const sliderPercent = balanceNum > 0 ? (inputNum / balanceNum) * 100 : 0;

  // Reset input when yield amount changes externally
  useEffect(() => {
    if (yieldEnabled && yieldAmount !== "0.00") {
      setInputAmount(yieldAmount);
    }
  }, [yieldEnabled, yieldAmount]);

  const handleSliderChange = (pct: number) => {
    const amount = ((pct / 100) * balanceNum).toFixed(2);
    setInputAmount(amount);
    setError(null);
  };

  const handleConfirm = async () => {
    setError(null);
    if (!isValid) {
      setError("Enter an amount within your balance");
      return;
    }
    setLoading(true);
    try {
      await onConfirm(inputAmount);
      toast.success("Yield activated!", { description: `Your money is now growing at ${apy.toFixed(1)}% APY` });
      setExpanded(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enable yield");
    } finally {
      setLoading(false);
    }
  };

  // ─── Active State: yield is on and amount is set ────────────
  if (yieldEnabled && yieldAmount !== "0.00" && !expanded) {
    return (
      <div className="rounded-xl border border-green-600 bg-green-100 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-900">Yield Active</p>
            <p className="text-xs text-green-700">
              ${yieldAmount} earning {apy.toFixed(2)}% APY
            </p>
            {Number(earnings) > 0 && (
              <p className="text-xs text-green-600">
                ${earnings} earned so far
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setExpanded(true);
                onAdjust();
              }}
              className="rounded-lg bg-green-800 px-3 py-1.5 text-xs font-medium text-green-200 transition-colors hover:bg-green-700"
            >
              Adjust
            </button>
            <button
              onClick={onDisable}
              className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:bg-neutral-700"
            >
              Disable
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Expanded State: input + slider + confirm ───────────────
  if (expanded || !yieldEnabled) {
    return (
      <div
        className={`rounded-xl border p-4 transition-colors ${
          expanded
            ? "border-green-600 bg-green-100"
            : "border-neutral-800 bg-neutral-900"
        }`}
      >
        {!expanded && !yieldEnabled ? (
          // Collapsed: invite to enable
          <button
            onClick={() => setExpanded(true)}
            className="flex w-full items-center justify-between"
          >
            <div className="text-left">
              <p className="text-sm font-medium text-green-900">Yield</p>
              <p className="text-xs text-neutral-400">
                Earn {apy > 0 ? `${apy.toFixed(2)}% APY` : "yield"} on idle USDT
              </p>
            </div>
            <div className="h-6 w-11 rounded-full bg-neutral-700 transition-colors">
              <div className="h-6 w-6 rounded-full bg-white translate-x-0.5 transition-transform" />
            </div>
          </button>
        ) : (
          // Full input panel
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-green-900">
                How much do you want earning yield?
              </p>
              <button
                onClick={() => {
                  setExpanded(false);
                  setError(null);
                }}
                className="text-xs text-neutral-500 hover:text-neutral-300"
              >
                Cancel
              </button>
            </div>

            {/* Amount Input */}
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={inputAmount}
                onChange={(e) => {
                  setInputAmount(e.target.value);
                  setError(null);
                }}
                min="0"
                max={balance}
                step="0.01"
                className="pr-14"
              />
              <span className="absolute right-3 top-[38px] text-sm text-neutral-500">
                USDT
              </span>
            </div>

            {/* Slider */}
            <div className="flex flex-col gap-2">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={sliderPercent}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-neutral-700 accent-green-600
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-green-600
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:shadow-green-600/30
                  [&::-moz-range-thumb]:h-5
                  [&::-moz-range-thumb]:w-5
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-green-600
                  [&::-moz-range-thumb]:border-0"
              />
              <div className="flex justify-between text-xs text-neutral-500">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Quick preset buttons */}
            <div className="flex gap-2">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  onClick={() => handleSliderChange(pct)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                    Math.abs(sliderPercent - pct) < 1
                      ? "bg-green-700 text-white"
                      : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>

            {/* Remainder info */}
            {inputNum > 0 && (
              <p className="text-xs text-neutral-500">
                ${remainder.toFixed(2)} will stay in vault
              </p>
            )}

            {/* Error */}
            {error && <p className="text-sm text-red-400">{error}</p>}

            {/* Confirm */}
            <Button
              onClick={handleConfirm}
              loading={loading}
              disabled={!isValid || txStatus === "pending" || txStatus === "confirming"}
              size="lg"
            >
              {txStatus === "pending" || txStatus === "confirming"
                ? "Confirm in wallet..."
                : yieldEnabled
                  ? "Update Yield"
                  : "Enable Yield"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
