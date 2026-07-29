import { useEffect, useRef } from "react";
import { useVaultStore } from "@/stores/vaultStore";
import { useTransactions } from "@/hooks/useTransactions";

/**
 * Syncs server transactions into the local vault store on mount.
 * Call from any page that needs transactions (Vault, Account, etc.).
 */
export function useSyncTransactions() {
  const addTransaction = useVaultStore((s) => s.addTransaction);
  const syncedRef = useRef(false);

  const { data: serverTxPage } = useTransactions(1, 100);

  useEffect(() => {
    if (!serverTxPage?.items || syncedRef.current) return;
    const localIds = new Set(useVaultStore.getState().transactions.map((t) => t.id));
    for (const serverTx of serverTxPage.items) {
      if (!localIds.has(serverTx.id)) {
        // Handle both field names: server may send `timestamp` or `createdAt`
        const rawDate =
          serverTx.timestamp ??
          (serverTx as unknown as Record<string, unknown>).createdAt;
        addTransaction({
          id: serverTx.id,
          type: serverTx.type,
          amount: serverTx.amount,
          timestamp: new Date(rawDate as string),
          status: serverTx.status,
          txHash: serverTx.txHash,
          error: serverTx.error,
        });
      }
    }
    syncedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverTxPage]);
}
