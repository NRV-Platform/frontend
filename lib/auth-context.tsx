"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, ApiError, clearTokens, getAccessToken, setTokens } from "./api";
import type { AuthResponse, PublicUser } from "./types";

const USER_KEY = "nrv_user";

function loadStoredUser(): PublicUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as PublicUser) : null;
  } catch {
    return null;
  }
}

function storeUser(user: PublicUser | null) {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  setUser: (user: PublicUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const setUser = useCallback((u: PublicUser | null) => {
    setUserState(u);
    storeUser(u);
  }, []);

  useEffect(() => {
    void (async () => {
      const token = getAccessToken();
      const stored = loadStoredUser();
      if (token && stored) {
        setUserState(stored);
      } else if (!token) {
        storeUser(null);
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await api.post<AuthResponse>(
          "/auth/login",
          { email, password },
          { auth: false }
        );
        setTokens(res.accessToken, res.refreshToken);
        setUser(res.user);
        return { ok: true };
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : "Login failed";
        return { ok: false, error: msg };
      }
    },
    [setUser]
  );

  const signup = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        const res = await api.post<AuthResponse>(
          "/auth/signup",
          { email, password, name },
          { auth: false }
        );
        setTokens(res.accessToken, res.refreshToken);
        setUser(res.user);
        return { ok: true };
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : "Signup failed";
        return { ok: false, error: msg };
      }
    },
    [setUser]
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, [setUser]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
