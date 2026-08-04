import { apiClient } from "@/api/client";
import type { Paginated, Relationship, RelationshipInput, RelationshipStatus } from "@/types";

export interface RelationshipQuery {
  page?: number;
  per_page?: number;
  person_id?: string;
  relationship_type_id?: string;
  status?: RelationshipStatus;
}

export async function listRelationships(
  query: RelationshipQuery = {},
): Promise<Paginated<Relationship>> {
  const { data } = await apiClient.get<Paginated<Relationship>>("/relationships", {
    params: query,
  });
  return data;
}

export async function createRelationship(input: RelationshipInput): Promise<Relationship> {
  const { data } = await apiClient.post<Relationship>("/relationships", input);
  return data;
}

export async function updateRelationship(
  id: string,
  input: Partial<RelationshipInput>,
): Promise<Relationship> {
  const { data } = await apiClient.put<Relationship>(`/relationships/${id}`, input);
  return data;
}

export async function deleteRelationship(id: string): Promise<void> {
  await apiClient.delete(`/relationships/${id}`);
}
