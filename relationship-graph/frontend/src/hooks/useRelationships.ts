import { useQuery } from "@tanstack/react-query";

import { listRelationships, type RelationshipQuery } from "@/api/relationships";

export function useRelationships(query: RelationshipQuery) {
  return useQuery({
    queryKey: ["relationships", query],
    queryFn: () => listRelationships(query),
    placeholderData: (previousData) => previousData,
  });
}
