import { apiClient } from "@/api/client";
import type { AuthTokens, UserRole } from "@/types";

export async function login(username: string, password: string): Promise<AuthTokens> {
  const { data } = await apiClient.post<AuthTokens>("/auth/login", { username, password });
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function me(): Promise<{ id: string; username: string; role: UserRole }> {
  const { data } = await apiClient.get<{ id: string; username: string; role: UserRole }>(
    "/auth/me",
  );
  return data;
}
