import { useQuery } from "@tanstack/react-query";

import { listRelationshipTypes } from "@/api/relationshipTypes";

export function useRelationshipTypes() {
  return useQuery({
    queryKey: ["relationship-types"],
    queryFn: listRelationshipTypes,
    staleTime: 5 * 60_000,
  });
}
