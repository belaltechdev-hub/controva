// CLIENT CREATE REQUEST
export interface ClientCreateRequest {
  company_name: string;
  email: string;
  phone: string;
  password: string;
  usage_limit: number;
  validity_days: number;
}


// CLIENT UPDATE REQUEST
export interface ClientUpdateRequest {
  company_name: string;
  email: string;
  phone: string;
  usage_limit: number;
  validity_days: number;
}


// CLIENT BASE DATA (Reusable)
export interface ClientBase {
  id: string;
  company_name: string;
  email: string;
  phone: string;
  usage_limit: number;
  validity_days: number;
}


// CLIENT USAGE DATA
export interface ClientUsage {
  used: number;
  remaining_usage: number;
  usage_percent: number;
  expire_in: number;
  expire_unit: string;
}


// FINAL CLIENT RESPONSE (Owner Dashboard)
export interface ClientResponse extends ClientBase, ClientUsage {}