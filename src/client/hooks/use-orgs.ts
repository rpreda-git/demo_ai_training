import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

const message = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong");

export function useOrgs() {
  return useQuery({ queryKey: queryKeys.orgs, queryFn: api.listOrgs });
}

export function useCreateOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.createOrg(name),
    onSuccess: (org) => {
      qc.invalidateQueries({ queryKey: queryKeys.orgs });
      qc.invalidateQueries({ queryKey: queryKeys.boards });
      toast.success(`Created “${org.name}”`);
    },
    onError: (e) => toast.error(message(e)),
  });
}

export function useSwitchOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (organizationId: string) => api.switchOrg(organizationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orgs });
      qc.invalidateQueries({ queryKey: queryKeys.boards });
    },
    onError: (e) => toast.error(message(e)),
  });
}
