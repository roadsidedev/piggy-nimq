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
  confirmed: "text-sage-600",
  confirming: "text-amber-600",
  pending: "text-gray-500",
  failed: "text-red-500",
};

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-500">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-gray-700">History</h3>
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm"
        >
          <div>
            <p className="text-sm font-medium text-gray-800">{typeLabels[tx.type] ?? tx.type}</p>
            <p className={`text-xs font-medium ${statusStyles[tx.status] ?? "text-gray-500"}`}>
              {tx.status}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800">${tx.amount}</p>
            {tx.error ? (
              <p className="text-xs text-red-500">{tx.error}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
