import { apiClient } from "@/api/client";
import type { AuthTokens } from "@/types";

export async function login(username: string, password: string): Promise<AuthTokens> {
  const { data } = await apiClient.post<AuthTokens>("/auth/login", { username, password });
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function me(): Promise<{ username: string }> {
  const { data } = await apiClient.get<{ username: string }>("/auth/me");
  return data;
}
