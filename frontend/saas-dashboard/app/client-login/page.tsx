"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clientLogin } from "@/services/api/client.service";
import { useAuth } from "@/store/auth/auth.context";


export default function ClientLoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = () => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      // Hit /client/login → get JWT token in response
      const res: any = await clientLogin({
        email: email.trim(),
        password: password.trim(),
      });

      const token = res?.access_token;
      if (!token) throw new Error("No token received from server");

      // Store token + verify via AuthContext
      await login("client", token);

      router.replace("/client-dashboard");

    } catch (err: any) {
      console.error("Client login failed:", err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">

      {/* WRAPPER */}
      <div className="w-full max-w-6xl grid lg:grid-cols-2 bg-[#0f0f0f] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">

        {/* LEFT SIDE (INFO) */}
        <div className="hidden lg:flex flex-col justify-center p-12 bg-gradient-to-b from-[#0a0a0a] to-[#111] border-r border-gray-800">
          <h2 className="text-3xl font-semibold mb-4">
            Client Portal
          </h2>

          <p className="text-gray-400 mb-8 leading-relaxed">
            Manage your chatbot usage, track limits, and monitor plan validity —
            all in one secure dashboard.
          </p>

          <div className="space-y-4 text-sm text-gray-300">
            <p>✔ Real-time usage tracking</p>
            <p>✔ Plan limits & expiry visibility</p>
            <p>✔ Secure access with protected data</p>
          </div>
        </div>

        {/* RIGHT SIDE (LOGIN FORM) */}
        <div className="flex items-center justify-center w-full p-6 sm:p-10">

          <form
            onSubmit={handleLogin}
            className="w-full max-w-md flex flex-col gap-5"
          >
            {/* HEADER */}
            <div className="text-center">
              <h1 className="text-2xl font-semibold">Client Login</h1>
              <p className="text-gray-500 text-sm mt-1">
                Access your dashboard securely
              </p>
            </div>

            {/* ERROR */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-2 rounded text-center">
                {error}
              </div>
            )}

            {/* EMAIL */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="border border-gray-700 bg-black px-3 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {/* PASSWORD */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                className="border border-gray-700 bg-black px-3 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>


            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 transition text-white py-2.5 rounded-md font-medium disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login to Dashboard"}
            </button>

            {/* FOOTER */}
            <p className="text-center text-xs text-gray-600 mt-2">
              Your usage, limits, and chatbot data are securely managed.
            </p>

          </form>
        </div>

      </div>
    </div>
  );
}