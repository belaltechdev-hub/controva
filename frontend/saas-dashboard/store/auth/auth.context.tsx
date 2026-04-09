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
  login: (role: "owner" | "client") => Promise<void>;
  logout: () => Promise<void>;
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

    try {
      // 🔥 OWNER CHECK
      await api.get("/owner-only");
      setIsAuthenticated(true);
      setRole("owner");
      return;

    } catch {
      try {
        // 🔥 CLIENT CHECK
        await api.get("/client-only");
        setIsAuthenticated(true);
        setRole("client");
        return;

      } catch {
        // ❌ NOT AUTHENTICATED
        setIsAuthenticated(false);
        setRole(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // =====================================
  // LOGIN
  // =====================================

  const login = useCallback(async (role: "owner" | "client") => {

    try {
      if (role === "client") {
        await api.get("/client-only");
        setRole("client");
      } else {
        await api.get("/owner-only");
        setRole("owner");
      }

      setIsAuthenticated(true);

    } catch {
      setIsAuthenticated(false);
      setRole(null);
      // Re-throw so the calling login page can catch it and show an error
      throw new Error("Auth verification failed after login");
    }

  }, []);

  // =====================================
  // LOGOUT
  // =====================================

  const logout = useCallback(async () => {

    // capture role before clearing
    const currentRole = role;

    try {

      await api.post("/logout");

    } catch (error) {

      console.error("Logout error:", error);

    } finally {

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