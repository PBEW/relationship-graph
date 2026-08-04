import { apiClient } from "@/api/client";
import type { GraphData } from "@/types";

export async function getGraph(): Promise<GraphData> {
  const { data } = await apiClient.get<GraphData>("/graph");
  return data;
}
