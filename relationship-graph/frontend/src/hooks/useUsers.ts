import { useQuery } from "@tanstack/react-query";

import { listUsers } from "@/api/users";
import { useAuth } from "@/context/AuthContext";

export function useUsers() {
  const { isSuperAdmin } = useAuth();
  return useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
    enabled: isSuperAdmin,
  });
}
