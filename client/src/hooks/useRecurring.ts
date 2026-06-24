import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type {
  RecurringSchedule,
  CreateRecurringRequest,
  UpdateRecurringRequest,
  ApiResponse,
} from "@piggy/shared/types";

export function useRecurringSchedules() {
  return useQuery({
    queryKey: ["recurring"],
    queryFn: () =>
      apiGet<ApiResponse<RecurringSchedule[]> >("/recurring").then((r) => {
        if (!r.success || !r.data) throw new Error(r.error ?? "Failed to fetch schedules");
        return r.data;
      }),
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecurringRequest) =>
      apiPost<ApiResponse<RecurringSchedule>>("/recurring", data).then((r) => {
        if (!r.success || !r.data) throw new Error(r.error ?? "Failed to create schedule");
        return r.data;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring"] }),
  });
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateRecurringRequest;
    }) =>
      apiPatch<ApiResponse<RecurringSchedule>>(`/recurring/${id}`, data).then(
        (r) => {
          if (!r.success || !r.data) throw new Error(r.error ?? "Failed to update schedule");
          return r.data;
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring"] }),
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiDelete<ApiResponse<void>>(`/recurring/${id}`).then((r) => {
        if (!r.success) throw new Error(r.error ?? "Failed to delete schedule");
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring"] }),
  });
}

export function useToggleSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPost<ApiResponse<RecurringSchedule>>(`/recurring/${id}/toggle`, {}).then(
        (r) => {
          if (!r.success || !r.data) throw new Error(r.error ?? "Failed to toggle schedule");
          return r.data;
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring"] }),
  });
}
