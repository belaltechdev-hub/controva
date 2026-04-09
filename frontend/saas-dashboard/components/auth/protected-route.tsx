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
      const dest = role === "client" ? "/client-login" : "/login";
      router.replace(dest);
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