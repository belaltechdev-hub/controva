import { useEffect, useState, useCallback, useRef } from "react";
import { getClientDashboard } from "@/services/api/client.service";
import { useAuth } from "@/store/auth/auth.context";

interface ClientDashboardData {
  company: string;
  total_limit: number;
  used: number;
  remaining: number;
  usage_percent: number;
  total_validity: number;
  expire_in: number;
  expiry_date: string;
  expire_unit: string;
}

export const useClientDashboard = () => {

  const { isAuthenticated, loading: authLoading } = useAuth();

  const [data, setData] = useState<ClientDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef<ClientDashboardData | null>(null);

  // Keep dataRef in sync
  dataRef.current = data;

  // =====================================
  // FETCH DASHBOARD (SMART + SILENT MODE)
  // =====================================

  const fetchDashboard = useCallback(async (silent = false) => {

    // Don't fetch if not authenticated yet
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      return;
    }

    try {

      if (!silent) {
        setLoading(true);
      }

      const res = await getClientDashboard();

      if (!res.success) {
        throw new Error(res.message);
      }

      if (isMounted.current) {
        const prev = dataRef.current;

        // Lightweight comparison — only update state if data changed
        if (
          !prev ||
          res.data.used !== prev.used ||
          res.data.remaining !== prev.remaining ||
          res.data.expire_in !== prev.expire_in
        ) {
          setData(res.data);
        }

        setError(null);
      }

    } catch (err: any) {
      if (isMounted.current) {
        setError(err.message || "Something went wrong");
      }

    } finally {
      if (isMounted.current && !silent) {
        setLoading(false);
      }
    }

  }, []); // ← stable reference (no data dep = no infinite loop)

  // =====================================
  // REAL-TIME POLLING
  // =====================================

  useEffect(() => {
    // Wait for auth check to complete before fetching
    if (authLoading) return;
    if (!isAuthenticated) return;

    isMounted.current = true;

    // Initial load
    fetchDashboard(false);

    // Start polling (every 2 sec)
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchDashboard(true); // silent refresh
      }
    }, 2000);

    // Cleanup
    return () => {
      isMounted.current = false;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };

  }, [fetchDashboard, authLoading, isAuthenticated]);

  // =====================================
  // MANUAL REFRESH
  // =====================================

  const refetch = useCallback(() => {
    fetchDashboard(false);
  }, [fetchDashboard]);

  // =====================================
  // RETURN
  // =====================================

  return {
    data,
    loading,
    error,
    refetch,
  };
};