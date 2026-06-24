import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import type {
  TransactionRecord,
  ApiResponse,
  PaginatedResponse,
} from "@piggy/shared/types";

export function useTransactions(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["transactions", page, pageSize],
    queryFn: () =>
      apiGet<ApiResponse<PaginatedResponse<TransactionRecord>>>(
        `/transactions?page=${page}&pageSize=${pageSize}`,
      ).then((r) => {
        if (!r.success || !r.data) throw new Error(r.error ?? "Failed to fetch transactions");
        return r.data;
      }),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      type: TransactionRecord["type"];
      amount: string;
      txHash?: string;
      status?: "pending" | "confirmed" | "failed";
      error?: string;
    }) =>
      apiPost<ApiResponse<TransactionRecord>>("/transactions", data).then(
        (r) => {
          if (!r.success || !r.data) throw new Error(r.error ?? "Failed to record transaction");
          return r.data;
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        status?: "pending" | "confirmed" | "failed";
        txHash?: string;
        error?: string;
      };
    }) =>
      apiPatch<ApiResponse<TransactionRecord>>(`/transactions/${id}`, data).then(
        (r) => {
          if (!r.success || !r.data) throw new Error(r.error ?? "Failed to update transaction");
          return r.data;
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });
}
