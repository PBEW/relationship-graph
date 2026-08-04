import { useQuery } from "@tanstack/react-query";

import { getPersonProfile } from "@/api/people";

export function usePersonProfile(id: string | undefined) {
  return useQuery({
    queryKey: ["person-profile", id],
    queryFn: () => getPersonProfile(id!),
    enabled: !!id,
  });
}
