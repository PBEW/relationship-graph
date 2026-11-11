import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { toThaiErrorMessage, UNKNOWN_ERROR_MESSAGE } from "@/lib/errorMessages";
import type { AuthTokens } from "@/types";

const ACCESS_TOKEN_KEY = "rg_access_token";
const REFRESH_TOKEN_KEY = "rg_refresh_token";

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (tokens: AuthTokens) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  },
  setAccessToken: (accessToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
});

/**
 * The API is hosted on a free tier that suspends the server after a spell of
 * inactivity, so the first request of a session can take the best part of a
 * minute while it boots. Without a signal the app just looks frozen, so track
 * how long requests are taking and announce it once they run long.
 */
export const SLOW_REQUEST_EVENT = "api:slow-request";
const SLOW_REQUEST_MS = 3000;

let pendingRequests = 0;
let slowTimer: ReturnType<typeof setTimeout> | null = null;

function announceSlow(isSlow: boolean) {
  window.dispatchEvent(new CustomEvent<boolean>(SLOW_REQUEST_EVENT, { detail: isSlow }));
}

function onRequestStart() {
  pendingRequests += 1;
  // Only start timing when the app goes from idle to busy; a request that
  // begins while something slow is already in flight shouldn't reset it.
  if (pendingRequests === 1 && slowTimer === null) {
    slowTimer = setTimeout(() => announceSlow(true), SLOW_REQUEST_MS);
  }
}

function onRequestEnd() {
  pendingRequests = Math.max(0, pendingRequests - 1);
  if (pendingRequests > 0) return;
  if (slowTimer !== null) {
    clearTimeout(slowTimer);
    slowTimer = null;
  }
  announceSlow(false);
}

apiClient.interceptors.request.use((config) => {
  onRequestStart();
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    onRequestEnd();
    return response;
  },
  (error) => {
    onRequestEnd();
    return Promise.reject(error);
  },
);

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token available");

  const response = await axios.post<{ access_token: string }>(
    `${apiClient.defaults.baseURL}/auth/refresh`,
    {},
    { headers: { Authorization: `Bearer ${refreshToken}` } },
  );
  tokenStorage.setAccessToken(response.data.access_token);
  return response.data.access_token;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const isAuthEndpoint = originalRequest?.url?.includes("/auth/");

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        refreshPromise ??= refreshAccessToken();
        const newToken = await refreshPromise;
        refreshPromise = null;
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        tokenStorage.clear();
        window.dispatchEvent(new CustomEvent("auth:logout"));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

/** A Thai sentence for any failed request; see toThaiErrorMessage. */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    return toThaiErrorMessage(data?.error, error.response?.status);
  }
  return UNKNOWN_ERROR_MESSAGE;
}
