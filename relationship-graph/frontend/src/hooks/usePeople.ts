import { useQuery } from "@tanstack/react-query";

import { listPeople, type PeopleQuery } from "@/api/people";

export function usePeople(query: PeopleQuery) {
  return useQuery({
    queryKey: ["people", query],
    queryFn: () => listPeople(query),
    placeholderData: (previousData) => previousData,
  });
}
