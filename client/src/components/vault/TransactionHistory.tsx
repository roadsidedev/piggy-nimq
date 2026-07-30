const EXPLORER_BASE = "https://amoy.polygonscan.com/tx/";

interface TransactionRow {
  id: string;
  type: string;
  amount: string;
  timestamp: Date | string;
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

function formatTime(date: Date | string | null | undefined): string {
  const d = date instanceof Date ? date : new Date(date ?? 0);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

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
      {transactions
        .filter((tx) => tx.timestamp != null)
        .map((tx) => (
        <div
          key={tx.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-800">{typeLabels[tx.type] ?? tx.type}</p>
            <div className="flex items-center gap-2">
              <p className={`text-xs font-medium ${statusStyles[tx.status] ?? "text-gray-500"}`}>
                {tx.status}
              </p>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400">{formatTime(tx.timestamp)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">${tx.amount}</p>
              {tx.error ? (
                <p className="text-xs text-red-500">{tx.error}</p>
              ) : null}
            </div>
            {tx.txHash ? (
              <a
                href={`${EXPLORER_BASE}${tx.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-pink-50 hover:text-pink-500"
                title="View on explorer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
