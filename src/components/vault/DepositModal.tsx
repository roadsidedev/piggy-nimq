import { useState } from "react";
import { Modal, Button, Input } from "@/components/common";

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
  onDeposit: (amount: string) => Promise<void>;
}

export function DepositModal({ open, onClose, onDeposit }: DepositModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeposit = async () => {
    setError(null);
    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      await onDeposit(amount);
      setAmount("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deposit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Deposit">
      <div className="flex flex-col gap-4">
        <Input
          label="Amount (USDC)"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <Button onClick={handleDeposit} loading={loading} size="lg">
          Deposit
        </Button>
      </div>
    </Modal>
  );
}
