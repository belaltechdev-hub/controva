"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/dashboard-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/axios/api";
import CreateClientForm from "@/components/forms/create-client-form";
import EditClientForm from "@/components/forms/edit-client-form";
import ClientCard from "@/components/cards/client-card";
import { useAuth } from "@/store/auth/auth.context";
// =========================
// TYPES
// =========================

interface Client {
  id: string;
  company_name: string;
  email: string;
  phone: string;
  usage_limit: number;
  validity_days: number;

  used: number;
  remaining_usage: number;
  usage_percent: number;
  expire_in: number;
  expire_unit: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export default function CRMPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");
  const fetchClientsInvocation = useRef(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // =========================
  // FETCH CLIENTS
  // =========================
  const fetchClients = useCallback(async (silent = false) => {
    try {
      fetchClientsInvocation.current += 1;

      if (!silent) {
        setLoading(true);
        setError(null);
      }

      const res = await apiGet<ApiResponse<Client[]>>("/owner/clients");

      if (!res.success) {
        throw new Error(res.message || "Failed to fetch clients");
      }

      // merge instead of replace (prevents UI flicker)
      setClients(prev => {
        const map = new Map(prev.map(c => [c.id, c]));

        res.data.forEach((c: Client) => {
          map.set(c.id, c);
        });

        return Array.from(map.values());
      });

    } catch (err: any) {
      if (!silent) {
        setError(err?.message || "Fetch failed");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  // =========================
  // INITIAL FETCH (wait for auth)
  // ========================= 
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return;
    fetchClients();
  }, [fetchClients, authLoading, isAuthenticated]);

  // =========================
// AUTO REFRESH (2s SAFE POLLING)
// =========================
  useEffect(() => {
  if (authLoading || !isAuthenticated) return;

  let isFetching = false;

  const interval = setInterval(async () => {
    if (document.visibilityState !== "visible") return;

    if (isFetching) return;
    isFetching = true;

    try {
      await fetchClients(true); // silent refresh
    } finally {
      isFetching = false;
    }
  }, 2000);

  return () => clearInterval(interval);
}, [fetchClients, authLoading, isAuthenticated]);
  // =========================
  // SEARCH FILTER
  // =========================
  const filteredClients = clients.filter((client) => {
    const query = search.toLowerCase();

    return (
      client.email?.toLowerCase().includes(query) ||
      client.company_name?.toLowerCase().includes(query)
    );
  });

  // =========================
  // EDIT CLIENT
  // =========================
  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setMode("edit");
  };

  // =========================
  // DELETE CLIENT
  // =========================
  const handleDelete = async (id: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this client?");
if (!confirmDelete) return;
  // prevent double click
  if (deletingId === id) return;

  setDeletingId(id);

  let previousClients: any[] = [];

  // optimistic update
  setClients((current) => {
    previousClients = current;
    return current.filter((c) => c.id !== id);
  });

  try {
    await apiDelete(`/owner/delete-client/${id}`);

    toast.success("Client deleted");
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message;

    // ignore already deleted case
    if (message?.toLowerCase().includes("not found")) {
      return;
    }

    // rollback
    setClients(previousClients);

    toast.error(message || "Delete failed");
  } finally {
    setDeletingId(null);
  }
};

  // =========================
  // RESET USAGE
  // =========================
  const handleReset = async (id: string) => {
    try {
      const res = await apiPost<{
        success: boolean;
        message: string;
      }>(`/owner/reset-usage/${id}`);

      if (!res.success) {
        throw new Error(res.message);
      }

      fetchClients();

    } catch (err: any) {
      console.error("Reset failed", err);
      toast.error(err?.message || "Reset failed");
    }
  };

  return (
    <DashboardLayout>
      <ProtectedRoute role="owner">

  

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">CRM</h1>

          <button
            onClick={() => setMode("create")}
            className="bg-black text-white px-4 py-2 rounded cursor-pointer hover:bg-gray-800 transition"
          >
            + Add Client
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="mb-6 flex items-center justify-between gap-4">

          <div className="relative w-full md:w-[420px] group">

            {/* Search Icon */}
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 group-focus-within:text-black transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.3-4.3m1.3-5.2a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>

            {/* Input */}
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 
              bg-white border border-gray-200 rounded-xl 
              shadow-sm 
              focus:outline-none focus:ring-2 focus:ring-black focus:border-black
              transition-all duration-200"
            />

            {/* Clear Button */}
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-black transition"
              >
                ✕
              </button>
            )}
          </div>

        </div>

        {mode === "create" && (
          <CreateClientForm
            onSuccess={() => {
              setMode(null);
              fetchClients();
            }}
            onCancel={() => setMode(null)}
          />
        )}

        {mode === "edit" && selectedClient && (
          <EditClientForm
            client={selectedClient}
            onSuccess={async () => {
              setMode(null);
              setSelectedClient(null);
              await fetchClients();
            }}
            onCancel={() => {
              setMode(null);
              setSelectedClient(null);
            }}
          />
        )}

        {/* ERROR */}
        {error && (
           <p className="text-red-500 mb-4">{error}</p>
        )}

        {/* CLIENT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* EMPTY STATE */}
          {filteredClients.length === 0 && (
            <p className="text-gray-500">No clients found</p>
          )}

          {filteredClients.map((client: Client) => (
  <ClientCard
    key={client.id}
    client={client}
    onEdit={() => handleEdit(client)}
    onDelete={() => handleDelete(client.id)}
    onReset={() => handleReset(client.id)}
    deleting={deletingId === client.id} // 👈 ADD THIS
  />
))}
        </div>
      
           </ProtectedRoute>
    </DashboardLayout>
  );
}