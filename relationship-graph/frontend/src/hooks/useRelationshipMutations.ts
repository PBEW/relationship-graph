import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createRelationship, deleteRelationship, updateRelationship } from "@/api/relationships";
import type { RelationshipInput } from "@/types";

function useInvalidateRelationships() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["relationships"] });
    queryClient.invalidateQueries({ queryKey: ["person-profile"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    queryClient.invalidateQueries({ queryKey: ["graph"] });
  };
}

export function useCreateRelationship() {
  const invalidate = useInvalidateRelationships();
  return useMutation({
    mutationFn: (input: RelationshipInput) => createRelationship(input),
    onSuccess: invalidate,
  });
}

export function useUpdateRelationship() {
  const invalidate = useInvalidateRelationships();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<RelationshipInput> }) =>
      updateRelationship(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteRelationship() {
  const invalidate = useInvalidateRelationships();
  return useMutation({
    mutationFn: (id: string) => deleteRelationship(id),
    onSuccess: invalidate,
  });
}
