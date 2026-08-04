import { apiClient } from "@/api/client";
import type { RelationshipType, RelationshipTypeInput } from "@/types";

export async function listRelationshipTypes(): Promise<RelationshipType[]> {
  const { data } = await apiClient.get<RelationshipType[]>("/relationship-types");
  return data;
}

export async function createRelationshipType(
  input: RelationshipTypeInput,
): Promise<RelationshipType> {
  const { data } = await apiClient.post<RelationshipType>("/relationship-types", input);
  return data;
}

export async function updateRelationshipType(
  id: string,
  input: Partial<RelationshipTypeInput>,
): Promise<RelationshipType> {
  const { data } = await apiClient.put<RelationshipType>(`/relationship-types/${id}`, input);
  return data;
}

export async function deleteRelationshipType(id: string): Promise<void> {
  await apiClient.delete(`/relationship-types/${id}`);
}
