import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type {
  Goal,
  CreateGoalRequest,
  UpdateGoalRequest,
  AllocateFundsRequest,
  TransferFundsRequest,
  ApiResponse,
} from "@piggy/shared/types";

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: () =>
      apiGet<ApiResponse<Goal[]> >("/goals").then((r) => {
        if (!r.success || !r.data) throw new Error(r.error ?? "Failed to fetch goals");
        return r.data;
      }),
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGoalRequest) =>
      apiPost<ApiResponse<Goal>>("/goals", data).then((r) => {
        if (!r.success || !r.data) throw new Error(r.error ?? "Failed to create goal");
        return r.data;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGoalRequest }) =>
      apiPatch<ApiResponse<Goal>>(`/goals/${id}`, data).then((r) => {
        if (!r.success || !r.data) throw new Error(r.error ?? "Failed to update goal");
        return r.data;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiDelete<ApiResponse<void>>(`/goals/${id}`).then((r) => {
        if (!r.success) throw new Error(r.error ?? "Failed to delete goal");
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useAllocateFunds() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AllocateFundsRequest }) =>
      apiPost<ApiResponse<Goal>>(`/goals/${id}/allocate`, data).then((r) => {
        if (!r.success || !r.data) throw new Error(r.error ?? "Failed to allocate funds");
        return r.data;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useTransferFunds() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      fromId,
      data,
    }: {
      fromId: string;
      data: TransferFundsRequest;
    }) =>
      apiPost<ApiResponse<void>>(`/goals/${fromId}/transfer`, data).then(
        (r) => {
          if (!r.success) throw new Error(r.error ?? "Failed to transfer funds");
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}
