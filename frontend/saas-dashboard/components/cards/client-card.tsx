"use client";
import { motion } from "framer-motion";
interface Client {
  id: string;
  company_name: string;
  email: string;
  phone: string;
  usage_limit: number;
  validity_days: number;

  used?: number;
  remaining_usage?: number;
  usage_percent?: number;

  expire_in?: number;
  expire_unit?: string;
}

export default function ClientCard({
  client,
  onEdit,
  onDelete,
  onReset,
  deleting,
}: {
  client: Client;
  onEdit: () => void;
  onDelete: () => void;
  onReset: () => void;
  deleting: boolean;
}) {
  const percent = client.usage_percent ?? 0;

  const status =
    percent >= 100
      ? "Limit Reached"
      : (client.expire_in ?? 0) <= 0
      ? "Expired"
      : "Active";

  return (
    <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       whileHover={{ scale: 1.02 }}
       transition={{ duration: 0.3 }}
       className="group bg-white dark:bg-black border border-gray-200 dark:border-zinc-700 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all flex flex-col gap-5"
>

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
            {client.company_name}
          </h2>
          <p className="text-sm text-gray-600 dark:text-white">{client.email}</p>
          <p className="text-xs text-gray-400">ID: {client.id}</p>
        </div>

        {/* STATUS */}
        <span
          className={`text-xs px-3 py-1 rounded-full font-semibold ${
          status === "Active"
          ? "bg-green-500/10 text-green-600"
          : status === "Expired"
          ? "bg-red-500/10 text-red-500"
          : "bg-yellow-500/10 text-yellow-500"
  }`}
>
          {status}
        </span>
      </div>

      {/* USAGE SECTION */}
      <div className="space-y-2">
        <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
          <span className="font-medium">Usage</span>
          <span className="text-gray-700 text-lg font-bold text-gray-900 dark:text-white">
            {percent}%
          </span>
        </div>

        <div className="w-full bg-gray-100 dark:bg-zinc-700 h-3 rounded-full overflow-hidden">
          <motion.div
  className="h-3 rounded-full shadow-sm"
  initial={{ width: 0 }}
  animate={{ width: `${percent}%` }}
  transition={{ duration: 0.6 }}
  style={{
    background: 
  percent > 90
    ? "linear-gradient(90deg,#ef4444,#dc2626)"
    : percent > 60
    ? "linear-gradient(90deg,#f59e0b,#d97706)"
    : "linear-gradient(90deg,#3b82f6,#2563eb)"
  }}
/>
        </div>

        <div className="text-right text-xs text-gray-500">
          {percent}% used
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3 text-sm">

        <div className="bg-white dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 shadow-sm rounded-xl p-3">
          <p className="text-gray-700 dark:text-zinc-300 dark:text-zinc-300 text-xs">Remaining</p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {client.remaining_usage ?? 0}
          </p>
        </div>

        <div className="bg-gray-100 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-xl p-3">
          <p className="text-gray-700 dark:text-zinc-300 dark:text-zinc-300 text-xs">Plan</p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {client.validity_days} days
          </p>
        </div>

        <div className="bg-gray-100 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-xl p-3 col-span-2">
  <p className="text-gray-700 dark:text-zinc-300 text-xs">
    Expires In
  </p>

  <p
    className={`font-bold ${
      (client.expire_in ?? 0) <= 0
        ? "text-red-500"
        : (client.expire_in ?? 0) <= 3
        ? "text-red-400"
        : (client.expire_in ?? 0) <= 7
        ? "text-yellow-500"
        : "text-green-500"
    }`}
  >
    {(client.expire_in ?? 0) <= 0
      ? "Expired"
      : `${client.expire_in} ${client.expire_unit ?? "days"}`}
  </p>
</div>

      </div>

      {/* FOOTER */}
      <div className="flex justify-between items-center border-t pt-4">

        <p className="text-xs text-gray-600 dark:text-zinc-300 truncate max-w-[120px]">
          {client.phone}
        </p>

        <div className="flex gap-2">

  {/* EDIT */}
  <button
    onClick={onEdit}
    className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md 
    hover:bg-blue-600 transition"
  >
    Edit
  </button>

  {/* RESET */}
  <button
    onClick={() => {
      if (confirm("Reset this client's usage?")) {
        onReset();
      }
    }}
    className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded-md 
    hover:bg-yellow-600 transition"
  >
    Reset
  </button>

  {/* DELETE */}
  <button
  onClick={() => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    onDelete();
  }}
  disabled={deleting}
  className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-md 
  hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
>
  {deleting ? "Deleting..." : "Delete"}
</button>

</div>

      </div>
    </motion.div>
  );
}