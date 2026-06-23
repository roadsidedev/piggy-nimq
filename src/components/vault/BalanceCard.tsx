import { Card, CardTitle, CardValue } from "@/components/common";

interface BalanceCardProps {
  balance: string;
  earnings: string;
  apy: number;
  yieldEnabled: boolean;
}

export function BalanceCard({ balance, earnings, apy, yieldEnabled }: BalanceCardProps) {
  return (
    <Card className="text-center">
      <CardTitle>Vault Balance</CardTitle>
      <CardValue>${balance}</CardValue>
      {yieldEnabled ? (
        <p className="mt-1 text-sm text-green-400">
          {apy.toFixed(2)}% APY · ${earnings} earned
        </p>
      ) : (
        <p className="mt-1 text-sm text-neutral-500">Yield off</p>
      )}
    </Card>
  );
}
