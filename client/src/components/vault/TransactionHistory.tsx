interface TransactionRow {
  id: string;
  type: string;
  amount: string;
  timestamp: Date;
  status: string;
  txHash?: string;
  error?: string;
}

interface TransactionHistoryProps {
  transactions: TransactionRow[];
}

const typeLabels: Record<string, string> = {
  deposit: "Deposit",
  withdraw: "Withdraw",
  borrow: "Borrow",
  repay: "Repay",
  yield: "Yield",
};

const statusStyles: Record<string, string> = {
  confirmed: "text-green-400",
  confirming: "text-yellow-400",
  pending: "text-neutral-400",
  failed: "text-red-400",
};

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 p-6 text-center">
        <p className="text-sm text-neutral-500">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-neutral-400">History</h3>
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3"
        >
          <div>
            <p className="text-sm text-white">{typeLabels[tx.type] ?? tx.type}</p>
            <p className={`text-xs ${statusStyles[tx.status] ?? "text-neutral-500"}`}>
              {tx.status}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white">${tx.amount}</p>
            {tx.error ? (
              <p className="text-xs text-red-400">{tx.error}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
