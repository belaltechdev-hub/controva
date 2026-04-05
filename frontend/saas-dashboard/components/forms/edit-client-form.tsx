"use client";


import api from "@/lib/axios/api";
import { useState, useEffect } from "react";


interface Client {
  id: string;
  company_name: string;
  email: string;
  phone: string;
  usage_limit: number;
  validity_days: number;
}

interface UpdateClientResponse {
  success: boolean;
  message: string;
}

interface Props {
  client: Client;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditClientForm({ client, onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    company_name: client.company_name,
    email: client.email,
    phone: client.phone,
    usage_limit: client.usage_limit.toString(),
    validity_days: client.validity_days.toString(),
  });

useEffect(() => {
  setForm({
    company_name: client.company_name,
    email: client.email,
    phone: client.phone,
    usage_limit: client.usage_limit.toString(),
    validity_days: client.validity_days.toString(),
  });
}, [client]);

  // 🔥 VALIDATION
const validate = () => {
    if (!form.company_name.trim()) return "Company name is required";
    if (!form.email.includes("@")) return "Invalid email";
    if (Number(form.usage_limit) < 0) return "Usage must be positive";
    if (Number(form.validity_days) < 0) return "Validity must be positive";

    return null;
  };

  const handleUpdate = async () => {
  // ✅ STEP 1: Validate before API call
  const validationError = validate();
  if (validationError) {
    setError(validationError);
    return;
  }

  try {
    setLoading(true);
    setError(null);

    const res: any = await api.put(
  `/owner/edit-client/${client.id}`,
  {
    ...form,
    usage_limit: Number(form.usage_limit),
    validity_days: Number(form.validity_days),
  }
);

// ✅ success check
if (!res.success) {
  throw new Error(res.message || "Update failed");
}

onSuccess();

  } catch (err: any) {
    setError(
      err?.response?.data?.message ||
      err?.message ||
      "Something went wrong"
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="bg-white border rounded-2xl p-6 shadow-sm mb-6 max-w-2xl">

      {/* HEADER */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Edit Client
        </h2>
        <p className="text-sm text-gray-500">
          Update client details and limits
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {/* FORM */}
      <div className="grid grid-cols-2 gap-5">

        {/* Company */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Company Name
          </label>
          <input
            value={form.company_name}
            onChange={(e) =>
              setForm({ ...form, company_name: e.target.value })
            }
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={loading}
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={loading}
          />
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={loading}
          />
        </div>

        {/* Usage Limit */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Usage Limit
          </label>
          <input
            type="number"
            value={form.usage_limit}
            onChange={(e) =>
              setForm({ ...form, usage_limit: e.target.value })
            }
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={loading}
          />
        </div>

        {/* Validity */}
        <div className="flex flex-col gap-1 col-span-2">
          <label className="text-sm font-medium text-gray-700">
            Validity (Days)
          </label>
          <input
            type="number"
            value={form.validity_days}
            onChange={(e) =>
              setForm({ ...form, validity_days: e.target.value })
            }
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={loading}
          />
        </div>

      </div>

      {/* ACTIONS */}
      <div className="mt-6 flex justify-end gap-3">

        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100 transition"
        >
          Cancel
        </button>

        <button
          onClick={handleUpdate}
          disabled={loading}
          className="px-5 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Client"}
        </button>

      </div>
    </div>
  );
}