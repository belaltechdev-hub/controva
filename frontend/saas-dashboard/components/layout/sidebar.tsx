"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/store/auth/auth.context";
import api from "@/lib/axios/api";
import { useState } from "react";
import { toast } from "sonner";

type MenuItem = {
  name: string;
  path: string;
};

const MENU_ITEMS: MenuItem[] = [
  { name: "CRM", path: "/crm" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;

    setLoading(true);

    try {
      await api.post("/logout");

      logout();
      router.replace("/login");

      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("Logout failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="w-64 h-screen bg-black text-white flex flex-col justify-between p-5">
      {/* TOP */}
      <div>
        {/* Logo */}
        <h2 className="text-2xl font-bold mb-10 tracking-wide">
          Lion SaaS
        </h2>

        {/* Navigation */}
        <nav className="flex flex-col gap-2">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? "bg-white text-black"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* BOTTOM */}
      <button
        onClick={handleLogout}
        disabled={loading}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
          loading
            ? "bg-gray-500 cursor-not-allowed"
            : "bg-red-500 hover:bg-red-600"
        }`}
      >
        {loading ? "Logging out..." : "Logout"}
      </button>
    </aside>
  );
}