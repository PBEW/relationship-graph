import { apiClient } from "@/api/client";
import type { ActivityAction, ActivityLogEntry, Paginated } from "@/types";

export interface ActivityQuery {
  page?: number;
  per_page?: number;
  action?: ActivityAction;
}

export async function listActivity(params: ActivityQuery): Promise<Paginated<ActivityLogEntry>> {
  const { data } = await apiClient.get<Paginated<ActivityLogEntry>>("/activity", { params });
  return data;
}
