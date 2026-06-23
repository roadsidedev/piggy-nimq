import { useState } from "react";
import { Modal, Button, Input } from "@/components/common";

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  onWithdraw: (amount: string) => Promise<void>;
  maxBalance: string;
}

export function WithdrawModal({ open, onClose, onWithdraw, maxBalance }: WithdrawModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWithdraw = async () => {
    setError(null);
    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (Number(amount) > Number(maxBalance)) {
      setError("Amount exceeds balance");
      return;
    }
    setLoading(true);
    try {
      await onWithdraw(amount);
      setAmount("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdraw failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Withdraw">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Input
            label="Amount (USDC)"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <p className="text-xs text-neutral-500">Balance: {maxBalance} USDC</p>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <Button onClick={handleWithdraw} loading={loading} variant="secondary" size="lg">
          Withdraw
        </Button>
      </div>
    </Modal>
  );
}
