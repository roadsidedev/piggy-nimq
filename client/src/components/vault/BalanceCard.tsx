import { Card, CardTitle, CardValue } from "@/components/common";

interface BalanceCardProps {
  balance: string;
  yieldAmount: string;
  earnings: string;
  apy: number;
  yieldEnabled: boolean;
}

export function BalanceCard({
  balance,
  yieldAmount,
  earnings,
  apy,
  yieldEnabled,
}: BalanceCardProps) {
  const balanceNum = Number(balance);
  const yieldNum = Number(yieldAmount);
  const idleNum = Math.max(0, balanceNum - yieldNum);

  return (
    <Card className="text-center">
      <CardTitle>Vault Balance</CardTitle>
      <CardValue>${balance}</CardValue>

      {yieldEnabled && yieldNum > 0 ? (
        <div className="mt-2 flex flex-col gap-1">
          <p className="text-sm font-medium text-sage-600">
            {apy.toFixed(2)}% APY · ${earnings} earned
          </p>
          <div className="mx-auto mt-1 flex gap-3 text-xs">
            <span className="text-sage-600">
              ${yieldNum.toFixed(2)} earning yield
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">
              ${idleNum.toFixed(2)} idle
            </span>
          </div>
        </div>
      ) : (
        <p className="mt-1 text-sm text-gray-500">Yield off</p>
      )}
    </Card>
  );
}
