// BASE USAGE METRICS
export interface UsageMetrics {
  used: number;
  remaining: number;
  total_validity: number;
}


// CLIENT DASHBOARD RESPONSE
export interface ClientDashboardData extends UsageMetrics {
  company: string;
  total_limit: number;
  usage_percent: number;
  expire_in: number;
  expire_unit: string;
  expiry_date: string;
}


// API USAGE DATA (External API endpoint)
export interface ClientUsageData extends UsageMetrics {
  client: string;
  limit: number;
  percent: number;
  expire_in: string;
}