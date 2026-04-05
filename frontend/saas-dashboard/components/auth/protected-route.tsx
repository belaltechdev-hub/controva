"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/auth/auth.context";

type UserRole = "owner" | "client";

interface ProtectedRouteProps {
  children: ReactNode;
  role: UserRole;
}

export default function ProtectedRoute({
  children,
  role,
}: ProtectedRouteProps) {
  const { isAuthenticated, role: userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // user not logged in
    if (!isAuthenticated) {
      // #region agent log
      const dest = role === "client" ? "/client-login" : "/login";
      fetch("http://127.0.0.1:7292/ingest/08f45cac-2965-454a-94ff-318d3cabf17b", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "fc92fa",
        },
        body: JSON.stringify({
          sessionId: "fc92fa",
          runId: "pre-fix",
          hypothesisId: "H3",
          location: "protected-route.tsx:redirect",
          message: "unauthenticated_redirect",
          data: { requiredRole: role, destUsedInCode: "/login", destExpectedForClient: dest },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      router.replace("/login");
      return;
    }

    // wrong role
    if (userRole && userRole !== role) {
      router.replace("/");
    }
  }, [isAuthenticated, userRole, role, router, loading]);

  // prevent UI flash
  if (loading) {
    return null;
  }

  if (!isAuthenticated || userRole !== role) {
    return null;
  }

  return <>{children}</>;
}