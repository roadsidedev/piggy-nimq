import { PiggyBank } from "@/components/common/PiggyBank";

interface VaultBalanceCardProps {
  balance: string;
  yieldEnabled: boolean;
  apy: number;
  earningsToday?: string;
}

export function VaultBalanceCard({ balance, yieldEnabled, apy, earningsToday }: VaultBalanceCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-100 via-pink-50 to-pink-100 p-6 shadow-sm">
      <div className="relative z-10">
        <p className="font-heading text-sm font-medium text-green-700/80">Your Vault Balance</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-heading text-3xl font-bold text-green-900">${balance}</span>
          <span className="text-sm font-medium text-green-600">USDT</span>
        </div>
        {yieldEnabled && apy > 0 ? (
          <p className="mt-1 text-sm text-green-700">
            +${earningsToday ?? "0.00"} today (Yield ON &middot; {apy.toFixed(1)}% APY)
          </p>
        ) : (
          <p className="mt-1 text-sm text-green-600">Yield is off</p>
        )}
      </div>
      <div className="absolute -right-2 -top-2 opacity-80">
        <PiggyBank size={100} aria-hidden="true" />
      </div>
    </div>
  );
}
