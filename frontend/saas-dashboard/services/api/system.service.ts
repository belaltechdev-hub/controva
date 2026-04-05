import api from "@/lib/axios/api";

// TYPES
interface UsageCheckResponse {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}

interface UsageDataResponse {
  client: string;
  used: number;
  limit: number;
  remaining: number;
  percent: number;
  total_validity: number;
  expire_in: number;
  expire_unit: string;
}


// CHECK USAGE
export const checkUsage = async (clientId: string) => {
  return await api.get<UsageCheckResponse>(`/api/check/${clientId}`);
};


// GET DATA
export const getUsageData = async (clientId: string) => {
  return await api.get<UsageDataResponse>(`/api/data/${clientId}`);
};


// RESET API USAGE
export const resetApiUsage = async (clientId: string) => {
  return await api.post(`/api/reset/${clientId}`);
};