import { useState } from "react";
import { Modal, Button, Input } from "@/components/common";

type WithdrawSource = "idle" | "yield" | "goals" | "challenges";

interface SourceOption {
  id: WithdrawSource;
  label: string;
  balance: string;
  description: string;
  disabled?: boolean;
}

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  onWithdraw: (amount: string, source: WithdrawSource) => Promise<void>;
  maxBalance: string;
  yieldAmount: string;
}

export function WithdrawModal({
  open,
  onClose,
  onWithdraw,
  maxBalance,
  yieldAmount,
}: WithdrawModalProps) {
  const [selectedSource, setSelectedSource] = useState<WithdrawSource>("idle");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const yieldNum = Number(yieldAmount);
  const balanceNum = Number(maxBalance);
  const idleNum = Math.max(0, balanceNum - yieldNum);

  const sources: SourceOption[] = [
    {
      id: "idle",
      label: "Idle Balance",
      balance: idleNum.toFixed(2),
      description: "USDC sitting in vault",
    },
    {
      id: "yield",
      label: "Yield Supplied",
      balance: yieldNum.toFixed(2),
      description: "Currently earning yield",
      disabled: yieldNum <= 0,
    },
    {
      id: "goals",
      label: "Goals Vault",
      balance: "0.00",
      description: "Allocated to savings goals",
      disabled: true,
    },
    {
      id: "challenges",
      label: "Challenges Vault",
      balance: "0.00",
      description: "Locked in challenges",
      disabled: true,
    },
  ];

  const selected = sources.find((s) => s.id === selectedSource);
  const maxForSource = Number(selected?.balance ?? "0");
  const amountNum = Number(amount) || 0;
  const isValid = amountNum > 0 && amountNum <= maxForSource;

  const handleWithdraw = async () => {
    setError(null);
    if (!isValid) {
      setError("Enter a valid amount within available balance");
      return;
    }
    setLoading(true);
    try {
      await onWithdraw(amount, selectedSource);
      setAmount("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdraw failed");
    } finally {
      setLoading(false);
    }
  };

  const handleMax = () => {
    setAmount(maxForSource.toFixed(2));
    setError(null);
  };

  return (
    <Modal open={open} onClose={onClose} title="Withdraw">
      <div className="flex flex-col gap-4">
        {/* Source Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-neutral-300">
            Withdraw from
          </label>
          <div className="grid grid-cols-2 gap-2">
            {sources.map((source) => (
              <button
                key={source.id}
                onClick={() => {
                  if (!source.disabled) {
                    setSelectedSource(source.id);
                    setAmount("");
                    setError(null);
                  }
                }}
                disabled={source.disabled}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  source.disabled
                    ? "cursor-not-allowed border-neutral-800 bg-neutral-900/50 opacity-40"
                    : selectedSource === source.id
                      ? "border-pink-600 bg-pink-900/20"
                      : "border-neutral-700 bg-neutral-800 hover:border-neutral-600"
                }`}
              >
                <p className="text-sm font-medium text-white">{source.label}</p>
                <p className="text-xs text-neutral-400">{source.description}</p>
                <p
                  className={`mt-1 text-sm font-semibold ${
                    Number(source.balance) > 0 ? "text-green-400" : "text-neutral-500"
                  }`}
                >
                  ${source.balance}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div className="relative">
          <Input
            label="Amount (USDC)"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError(null);
            }}
            min="0"
            max={maxForSource}
            step="0.01"
          />
          {maxForSource > 0 && (
            <button
              onClick={handleMax}
              className="absolute right-3 top-[38px] rounded bg-pink-600 px-2 py-0.5 text-xs font-medium text-white transition-colors hover:bg-pink-700"
            >
              MAX
            </button>
          )}
        </div>

        {/* Balance info */}
        <p className="text-xs text-neutral-500">
          Available: {maxForSource.toFixed(2)} USDC
        </p>

        {/* Error */}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* Withdraw Button */}
        <Button
          onClick={handleWithdraw}
          loading={loading}
          variant="secondary"
          size="lg"
        >
          Withdraw
        </Button>
      </div>
    </Modal>
  );
}
