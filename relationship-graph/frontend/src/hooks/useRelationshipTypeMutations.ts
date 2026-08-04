import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createRelationshipType,
  deleteRelationshipType,
  updateRelationshipType,
} from "@/api/relationshipTypes";
import type { RelationshipTypeInput } from "@/types";

function useInvalidateRelationshipTypes() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["relationship-types"] });
    queryClient.invalidateQueries({ queryKey: ["relationships"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    queryClient.invalidateQueries({ queryKey: ["graph"] });
  };
}

export function useCreateRelationshipType() {
  const invalidate = useInvalidateRelationshipTypes();
  return useMutation({
    mutationFn: (input: RelationshipTypeInput) => createRelationshipType(input),
    onSuccess: invalidate,
  });
}

export function useUpdateRelationshipType() {
  const invalidate = useInvalidateRelationshipTypes();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<RelationshipTypeInput> }) =>
      updateRelationshipType(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteRelationshipType() {
  const invalidate = useInvalidateRelationshipTypes();
  return useMutation({
    mutationFn: (id: string) => deleteRelationshipType(id),
    onSuccess: invalidate,
  });
}
