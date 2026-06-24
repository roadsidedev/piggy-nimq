import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import type {
  Challenge,
  CreateChallengeRequest,
  UpdateProgressRequest,
  ApiResponse,
} from "@piggy/shared/types";

export function useChallenges(tab: "my" | "browse" = "my") {
  return useQuery({
    queryKey: ["challenges", tab],
    queryFn: () =>
      apiGet<ApiResponse<Challenge[]>>(`/challenges?tab=${tab}`).then((r) => {
        if (!r.success || !r.data) throw new Error(r.error ?? "Failed to fetch challenges");
        return r.data;
      }),
  });
}

export function useChallenge(id: string) {
  return useQuery({
    queryKey: ["challenges", id],
    queryFn: () =>
      apiGet<ApiResponse<Challenge>>(`/challenges/${id}`).then((r) => {
        if (!r.success || !r.data) throw new Error(r.error ?? "Failed to fetch challenge");
        return r.data;
      }),
    enabled: !!id,
  });
}

export function useCreateChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateChallengeRequest) =>
      apiPost<ApiResponse<Challenge>>("/challenges", data).then((r) => {
        if (!r.success || !r.data) throw new Error(r.error ?? "Failed to create challenge");
        return r.data;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["challenges"] }),
  });
}

export function useJoinChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) =>
      apiPost<ApiResponse<{ challengeId: string; title: string }>>(
        `/challenges/${inviteCode}/join`,
        {},
      ).then((r) => {
        if (!r.success || !r.data) throw new Error(r.error ?? "Failed to join challenge");
        return r.data;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["challenges"] }),
  });
}

export function useUpdateProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      challengeId,
      data,
    }: {
      challengeId: string;
      data: UpdateProgressRequest;
    }) =>
      apiPost<ApiResponse<void>>(
        `/challenges/${challengeId}/progress`,
        data,
      ).then((r) => {
        if (!r.success) throw new Error(r.error ?? "Failed to update progress");
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["challenges"] });
      qc.invalidateQueries({ queryKey: ["challenges", variables.challengeId] });
    },
  });
}
