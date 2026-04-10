"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

import api from "@/lib/axios/api";

type UserRole = "owner" | "client" | null;

interface AuthContextType {
  isAuthenticated: boolean;
  role: UserRole;
  loading: boolean;
  login: (role: "owner" | "client", token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  // =====================================
  // AUTO LOGIN CHECK
  // =====================================

  const checkAuth = useCallback(async () => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");

    // No token → not authenticated (skip API calls)
    if (!token) {
      setIsAuthenticated(false);
      setRole(null);
      setLoading(false);
      return;
    }

    // Quick JWT expiry check (avoid unnecessary API calls)
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setRole(null);
        setLoading(false);
        return;
      }
    } catch {
      // Malformed token — clear and bail
      localStorage.removeItem("token");
      setIsAuthenticated(false);
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      // 🔥 OWNER CHECK
      await api.get("/owner-only");
      setIsAuthenticated(true);
      setRole("owner");
      setLoading(false);
      return;

    } catch {
      // Owner check failed — but DON'T let the 401 interceptor
      // wipe the token before we try client check.
      // Re-set the token in case the interceptor cleared it.
      const stillHasToken = localStorage.getItem("token");
      if (!stillHasToken && token) {
        localStorage.setItem("token", token);
      }

      try {
        // 🔥 CLIENT CHECK
        await api.get("/client-only");
        setIsAuthenticated(true);
        setRole("client");
        setLoading(false);
        return;

      } catch {
        // ❌ Both failed — token is truly invalid
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setRole(null);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // =====================================
  // LOGIN
  // =====================================

  const login = useCallback(async (loginRole: "owner" | "client", token: string) => {

    // Store token in localStorage FIRST
    localStorage.setItem("token", token);

    try {
      if (loginRole === "client") {
        await api.get("/client-only");
        setRole("client");
      } else {
        await api.get("/owner-only");
        setRole("owner");
      }

      setIsAuthenticated(true);

    } catch {
      // Token is invalid — clean up
      localStorage.removeItem("token");
      setIsAuthenticated(false);
      setRole(null);
      throw new Error("Auth verification failed after login");
    }

  }, []);

  // =====================================
  // LOGOUT
  // =====================================

  const logout = useCallback(() => {

    // capture role before clearing
    const currentRole = role;

    // Clear token from localStorage
    localStorage.removeItem("token");

    setIsAuthenticated(false);
    setRole(null);

    if (typeof window !== "undefined") {

      const currentPath = window.location.pathname;

      // redirect to correct login based on previous role
      if (currentRole === "client") {
        if (!currentPath.includes("/client-login")) {
          window.location.href = "/client-login";
        }
      } else {
        if (!currentPath.includes("/login")) {
          window.location.href = "/login";
        }
      }

    }

  }, [role]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        role,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


// =====================================
// HOOK
// =====================================

export function useAuth() {

  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;

}