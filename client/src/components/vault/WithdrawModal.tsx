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
      description: "USDT sitting in vault",
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
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
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
                className={`rounded-xl border-2 p-3 text-left transition-all ${
                  source.disabled
                    ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-40"
                    : selectedSource === source.id
                      ? "border-sage-500 bg-sage-50 shadow-sm ring-1 ring-sage-200"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <p className={`text-sm font-semibold ${selectedSource === source.id ? "text-sage-800" : "text-gray-800"}`}>
                  {source.label}
                </p>
                <p className="text-xs text-gray-500">{source.description}</p>
                <p
                  className={`mt-1 text-sm font-bold ${
                    Number(source.balance) > 0 ? (selectedSource === source.id ? "text-sage-600" : "text-sage-500") : "text-gray-400"
                  }`}
                >
                  ${source.balance}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Input
            label="Amount (USDT)"
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
              className="absolute right-3 top-[38px] rounded-lg bg-sage-500 px-2.5 py-0.5 text-xs font-semibold text-white transition-colors hover:bg-sage-600"
            >
              MAX
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Available: {maxForSource.toFixed(2)} USDT
        </p>

        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

        <Button
          onClick={handleWithdraw}
          loading={loading}
          size="lg"
          className="w-full"
        >
          Withdraw
        </Button>
      </div>
    </Modal>
  );
}
