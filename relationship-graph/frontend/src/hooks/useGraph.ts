import { useQuery } from "@tanstack/react-query";

import { getGraph } from "@/api/graph";

export function useGraph() {
  return useQuery({
    queryKey: ["graph"],
    queryFn: getGraph,
  });
}
