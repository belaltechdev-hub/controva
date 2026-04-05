"use client";

import { useState } from "react";
import { apiPost } from "@/lib/axios/api";

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreateClientForm({ onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    company_name: "",
    email: "",
    phone: "",
    password: "",
    usage_limit: "",
    validity_days: "",
  });

  // 🔥 VALIDATION
  const validate = () => {
    if (!form.company_name.trim()) return "Company name is required";
    if (!form.email.includes("@")) return "Invalid email";
    if (!form.password || form.password.length < 6)
      return "Password must be at least 6 characters";
    if (Number(form.usage_limit) < 0) return "Usage must be positive";
    if (Number(form.validity_days) < 0) return "Validity must be positive";

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await apiPost("/owner/create-client", {
        ...form,
        usage_limit: Number(form.usage_limit),
        validity_days: Number(form.validity_days),
      });

      if (!res.success) throw new Error(res.message);

      onSuccess();

      setForm({
        company_name: "",
        email: "",
        phone: "",
        password: "",
        usage_limit: "",
        validity_days: "",
      });

    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err.message ||
        "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center px-4">
      <div className="w-full max-w-2xl bg-white border rounded-2xl p-6 sm:p-8 shadow-sm mb-6">

        {/* HEADER */}
        <div className="mb-6 space-y-1">
          <h2 className="text-xl font-semibold text-gray-800">
            Create Client
          </h2>
          <p className="text-sm text-gray-500">
            Add a new client and assign usage limits
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
            {error}
          </div>
        )}

        {/* FORM */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

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
              placeholder="Enter company name"
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
              placeholder="Enter email"
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
              placeholder="Enter phone number"
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
              placeholder="Enter usage limit"
              disabled={loading}
            />
          </div>

          {/* Validity */}
          <div className="flex flex-col gap-1 sm:col-span-2">
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
              placeholder="Enter validity in days"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter password"
              disabled={loading}
            />
          </div>

        </div>

        {/* ACTIONS */}
        <div className="mt-6 flex justify-end gap-3">

          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100 transition cursor-pointer disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Client"}
          </button>

        </div>

      </div>
    </div>
  );
}