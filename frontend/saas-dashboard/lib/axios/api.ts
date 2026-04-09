import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

// ======================================
// API BASE URL (ENV + FALLBACK)
// ======================================

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// ======================================
// AXIOS INSTANCE
// ======================================

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ======================================
// REQUEST INTERCEPTOR
// ======================================

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {

    if (config.headers) {
      config.headers["X-Request-Time"] = Date.now().toString();
    }

    return config;

  },
  (error: AxiosError) => {

    console.error("Request Error:", error.message);

    return Promise.reject(error);

  }
);

// ======================================
// RESPONSE INTERCEPTOR
// ======================================

api.interceptors.response.use(

  // SUCCESS: unwrap response.data so callers get the body directly
  (response: AxiosResponse) => {
    return response.data;
  },

  // ERROR HANDLER
  (error: AxiosError) => {

    const status = error.response?.status ?? 0;

    const message =
      (error.response?.data as any)?.message ||
      error.message ||
      "Something went wrong";

    // 401 — silent (auth system handles it)
    if (status === 401) {
      return Promise.reject({ message, status });
    }

    // Network error
    if (!error.response) {
      console.error("Network Error:", message);
      return Promise.reject({
        message: "Network error",
        status: 0,
      });
    }

    // Other API errors
    console.error("API Error:", message);

    return Promise.reject({
      message,
      status,
      url: error.config?.url,
    });

  }

);

// ======================================
// EXPORT
// ======================================

export default api;

// =========================
// TYPED API HELPERS
// =========================
// NOTE: The response interceptor returns response.data,
// so api.get() already returns the body (not AxiosResponse).
// We cast through 'unknown' to make TypeScript agree with the runtime.

export async function apiGet<T>(url: string): Promise<T> {
  return (await api.get(url)) as unknown as T;
}

export async function apiPost<T = any>(url: string, data?: any): Promise<T> {
  return (await api.post(url, data)) as unknown as T;
}

export async function apiPut<T = any>(url: string, data?: any): Promise<T> {
  return (await api.put(url, data)) as unknown as T;
}

export async function apiDelete<T = any>(url: string): Promise<T> {
  return (await api.delete(url)) as unknown as T;
}