import api from "@/lib/axios/api";

// ==============================
// COMMON RESPONSE TYPE
// ==============================

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// ==============================
// TYPES
// ==============================

export interface ClientDashboardData {
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

// ==============================
// CLIENT LOGIN
// ==============================

export const clientLogin = async (data: {
  email: string;
  password: string;
}): Promise<ApiResponse<null>> => {
  return await api.post("/client/login", data);
};

// ==============================
// GET DASHBOARD
// ==============================

export const getClientDashboard = async (): Promise<
  ApiResponse<ClientDashboardData>
> => {
  return await api.get("/client/dashboard");
};