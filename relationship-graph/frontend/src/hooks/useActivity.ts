import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { listActivity, type ActivityQuery } from "@/api/activity";
import { useAuth } from "@/context/AuthContext";

export function useActivity(params: ActivityQuery) {
  const { isSuperAdmin } = useAuth();
  return useQuery({
    queryKey: ["activity", params],
    queryFn: () => listActivity(params),
    enabled: isSuperAdmin,
    // Paging through history shouldn't blank the table between fetches.
    placeholderData: keepPreviousData,
  });
}
