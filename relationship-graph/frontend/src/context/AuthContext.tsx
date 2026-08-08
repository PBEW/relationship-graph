import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import * as authApi from "@/api/auth";
import { tokenStorage } from "@/api/client";
import type { UserRole } from "@/types";

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  username: string | null;
  role: UserRole | null;
  isSuperAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!tokenStorage.getAccessToken());
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => {
        setUsername(res.username);
        setRole(res.role);
      })
      .catch(() => {
        tokenStorage.clear();
        setIsAuthenticated(false);
      })
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    const handleForcedLogout = () => {
      setIsAuthenticated(false);
      setUsername(null);
      setRole(null);
    };
    window.addEventListener("auth:logout", handleForcedLogout);
    return () => window.removeEventListener("auth:logout", handleForcedLogout);
  }, []);

  const login = useCallback(async (user: string, password: string) => {
    const tokens = await authApi.login(user, password);
    tokenStorage.setTokens(tokens);
    setUsername(user);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // token may already be invalid/expired - clear local state regardless
    }
    tokenStorage.clear();
    setUsername(null);
    setRole(null);
    setIsAuthenticated(false);
  }, []);

  const isSuperAdmin = role === "super_admin";

  const value = useMemo(
    () => ({ isAuthenticated, isLoading, username, role, isSuperAdmin, login, logout }),
    [isAuthenticated, isLoading, username, role, isSuperAdmin, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
