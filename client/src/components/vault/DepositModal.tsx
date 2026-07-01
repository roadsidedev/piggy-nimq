import { useState } from "react";
import { toast } from "sonner";
import { Modal, Button, Input } from "@/components/common";
import { useWalletStore } from "@/stores/walletStore";
import { useFaucet } from "@/hooks/useFaucet";

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
  onDeposit: (amount: string) => Promise<void>;
}

export function DepositModal({ open, onClose, onDeposit }: DepositModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const address = useWalletStore((s) => s.address);
  const { drip, isLoading: faucetLoading, error: faucetError, clearError: clearFaucetError } = useFaucet();

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

  const handleFaucet = async () => {
    if (!address) return;
    clearFaucetError();
    const ok = await drip(address);
    if (ok) {
      toast.success("1,000 test USDT claimed from faucet");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Deposit">
      <div className="flex flex-col gap-4">
        <Input
          label="Amount (USDT)"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <Button onClick={handleDeposit} loading={loading} size="lg">
          Deposit
        </Button>
        <div className="border-t border-neutral-700 pt-3">
          <p className="mb-2 text-xs text-neutral-500">
            No test USDT? Claim 1,000 free tokens from the faucet.
          </p>
          <Button
            onClick={handleFaucet}
            loading={faucetLoading}
            variant="secondary"
            size="sm"
            className="w-full"
          >
            {faucetLoading ? "Claiming..." : "Get 1,000 Test USDT"}
          </Button>
          {faucetError && (
            <p className="mt-1 text-xs text-red-400">{faucetError}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
