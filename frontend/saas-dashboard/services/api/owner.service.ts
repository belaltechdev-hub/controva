import api from "@/lib/axios/api";

// TYPES
interface OwnerSignupPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
}

interface OwnerLoginPayload {
  email: string;
  password: string;
}

interface CreateClientPayload {
  company_name: string;
  email: string;
  phone: string;
  password: string;
  usage_limit: number;
  validity_days: number;
}

interface UpdateClientPayload {
  company_name: string;
  email: string;
  phone: string;
  usage_limit: number;
  validity_days: number;
}


// OWNER SIGNUP
export const ownerSignup = async (data: OwnerSignupPayload) => {
  const response = await api.post("/signup", data);
  return response;
};

// OWNER LOGIN
export const ownerLogin = async (data: OwnerLoginPayload) => {
  const response = await api.post("/login", data);
  return response;
};

// OWNER PROTECTED ROUTE
export const ownerOnly = async () => {
  const response = await api.get("/owner-only");
  return response;
};

// CREATE CLIENT
export const createClient = async (data: CreateClientPayload) => {
  const response = await api.post("/owner/create-client", data);
  return response;
};

// GET ALL CLIENTS
export const getClients = async () => {
  const response = await api.get("/owner/clients");
  return response;
};

// EDIT CLIENT
export const editClient = async (clientId: string, data: UpdateClientPayload) => {
  const response = await api.put(`/owner/edit-client/${clientId}`, data);
  return response;
};

// DELETE CLIENT
export const deleteClient = async (clientId: string) => {
  const response = await api.delete(`/owner/delete-client/${clientId}`);
  return response;
};

// RESET USAGE
export const resetUsage = async (clientId: string) => {
  const response = await api.post(`/owner/reset-usage/${clientId}`);
  return response;
};