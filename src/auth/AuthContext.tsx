import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "../api/auth";
import { ApiError, type LoginRequest } from "../api/client";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  status: AuthStatus;
  accessToken: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  /** Clear local session after 401; redirects are handled by route guards. */
  clearSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const applyToken = useCallback((token: string | null) => {
    setAccessToken(token);
    setStatus(token ? "authenticated" : "anonymous");
  }, []);

  const clearSession = useCallback(() => {
    applyToken(null);
  }, [applyToken]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const tokens = await authApi.refresh();
        if (!cancelled) applyToken(tokens.accessToken);
      } catch {
        if (!cancelled) applyToken(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyToken]);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const tokens = await authApi.login(credentials);
      applyToken(tokens.accessToken);
    },
    [applyToken],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        // Still clear local state even if the API call fails for other reasons.
      }
    } finally {
      applyToken(null);
    }
  }, [applyToken]);

  const value = useMemo(
    () => ({ status, accessToken, login, logout, clearSession }),
    [status, accessToken, login, logout, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
