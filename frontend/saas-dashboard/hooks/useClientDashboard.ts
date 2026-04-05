import { useEffect, useState, useCallback, useRef } from "react";
import { getClientDashboard } from "@/services/api/client.service";

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

  const [data, setData] = useState<ClientDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // =====================================
  // FETCH DASHBOARD (SMART + SILENT MODE)
  // =====================================

  const fetchDashboard = useCallback(async (silent = false) => {

    try {
    
      // #endregion
      // 🔥 only show loader on first load
      if (!silent) {
  setLoading(true);
}

const res = await getClientDashboard();

if (!res.success) {
  throw new Error(res.message);
}

if (isMounted.current) {
  // ✅ lightweight comparison (fast + safe)
  if (
    !data ||
    res.data.used !== data.used ||
    res.data.remaining !== data.remaining ||
    res.data.expire_in !== data.expire_in
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

  }, [data]);

  // =====================================
  // REAL-TIME POLLING
  // =====================================

  useEffect(() => {
    isMounted.current = true;

  // 🔥 Initial load
  fetchDashboard(false);

  // 🔥 Start polling (every 2 sec)
  intervalRef.current = setInterval(() => {
    // ✅ Only run if tab is active (pro behavior)
    if (document.visibilityState === "visible") {
      fetchDashboard(true); // silent refresh
    }
  }, 2000);

  // 🔥 Cleanup (very important)
  return () => {
    isMounted.current = false;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

}, [fetchDashboard]);

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