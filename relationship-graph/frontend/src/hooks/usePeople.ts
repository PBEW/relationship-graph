import { useQuery } from "@tanstack/react-query";

import { listPeople, type PeopleQuery } from "@/api/people";

export function usePeople(query: PeopleQuery, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["people", query],
    queryFn: () => listPeople(query),
    placeholderData: (previousData) => previousData,
    enabled: options.enabled,
  });
}
