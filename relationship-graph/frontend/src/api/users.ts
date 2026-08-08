import { apiClient } from "@/api/client";
import type { UserAccount, UserAccountInput } from "@/types";

export async function listUsers(): Promise<UserAccount[]> {
  const { data } = await apiClient.get<UserAccount[]>("/users");
  return data;
}

export async function createUser(input: UserAccountInput): Promise<UserAccount> {
  const { data } = await apiClient.post<UserAccount>("/users", input);
  return data;
}

export async function updateUser(
  id: string,
  input: Partial<UserAccountInput>,
): Promise<UserAccount> {
  const { data } = await apiClient.patch<UserAccount>(`/users/${id}`, input);
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}
