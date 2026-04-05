"use client";

import { useAuth } from "@/store/auth/auth.context";
import { useMemo } from "react";

export default function Topbar() {
  const { role, isAuthenticated } = useAuth();

  // dynamic title (future scalable)
  const title = useMemo(() => {
    if (role === "owner") return "Owner Dashboard";
    if (role === "client") return "Client Dashboard";
    return "Dashboard";
  }, [role]);

  return (
    <header className="w-full h-16 bg-white border-b px-6 flex items-center justify-between">
      {/* Left */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">
          {title}
        </h1>
        <p className="text-xs text-gray-500">
          Manage your SaaS efficiently
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {isAuthenticated && (
          <span className="text-sm text-gray-600">
            {role === "owner" ? "Owner" : "Client"}
          </span>
        )}
      </div>
    </header>
  );
}