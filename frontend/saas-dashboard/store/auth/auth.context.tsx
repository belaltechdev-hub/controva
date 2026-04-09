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
  // #region agent log
  if (typeof window !== "undefined") 
  try {
    // 🔥 OWNER CHECK
    await api.get("/owner-only");

    setIsAuthenticated(true);
    setRole("owner");
    // #region agent log
    if (typeof window !== "undefined") {
      fetch("http://127.0.0.1:7292/ingest/08f45cac-2965-454a-94ff-318d3cabf17b", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "fc92fa",
        },
        body: JSON.stringify({
          sessionId: "fc92fa",
          runId: "pre-fix",
          hypothesisId: "H2",
          location: "auth.context.tsx:checkAuth",
          message: "checkAuth_result",
          data: { result: "owner_ok" },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    }
    // #endregion
    return;

  } catch {
    // #region agent log
    if (typeof window !== "undefined") {
      fetch("http://127.0.0.1:7292/ingest/08f45cac-2965-454a-94ff-318d3cabf17b", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "fc92fa",
        },
        body: JSON.stringify({
          sessionId: "fc92fa",
          runId: "pre-fix",
          hypothesisId: "H2",
          location: "auth.context.tsx:checkAuth",
          message: "owner_probe_failed_trying_client",
          data: {},
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    }
    // #endregion
    try {
      // 🔥 CLIENT CHECK
      await api.get("/client-only");

      setIsAuthenticated(true);
      setRole("client");
      // #region agent log
      if (typeof window !== "undefined") {
        fetch("http://127.0.0.1:7292/ingest/08f45cac-2965-454a-94ff-318d3cabf17b", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "fc92fa",
          },
          body: JSON.stringify({
            sessionId: "fc92fa",
            runId: "pre-fix",
            hypothesisId: "H2",
            location: "auth.context.tsx:checkAuth",
            message: "checkAuth_result",
            data: { result: "client_ok" },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
      }
      // #endregion
      return;

    } catch {
      // ❌ NOT AUTHENTICATED
      setIsAuthenticated(false);
      setRole(null);
      // #region agent log
      if (typeof window !== "undefined") {
        fetch("http://127.0.0.1:7292/ingest/08f45cac-2965-454a-94ff-318d3cabf17b", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "fc92fa",
          },
          body: JSON.stringify({
            sessionId: "fc92fa",
            runId: "pre-fix",
            hypothesisId: "H2",
            location: "auth.context.tsx:checkAuth",
            message: "checkAuth_result",
            data: { result: "none" },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
      }
      // #endregion
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