"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ownerLogin } from "@/services/api/owner.service";
import { useAuth } from "@/store/auth/auth.context";

export default function LoginPage() {

  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ======================================
  // VALIDATION
  // ======================================

  const validateForm = () => {

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("Email and password are required");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  // ======================================
  // LOGIN HANDLER
  // ======================================

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {

  e.preventDefault();

  if (loading) return;
  if (!validateForm()) return;

  try {

    setLoading(true);
    setError(null);

    // call backend (sets HttpOnly cookie)
    await ownerLogin({
  email: email.trim(),
  password: password.trim(),
});

    // sync frontend state (login() internally verifies via /owner-only)
    await login("owner");

    // redirect
    router.replace("/crm");

  } catch (err: any) {

    console.error("Owner login failed:", err?.message || err);

    const message =
       err?.message ||
       (err?.status === 401
         ? "Invalid credentials"
         : "Login failed. Please try again.");

    setError(message);

  } finally {

    setLoading(false);

  }

};

  // ======================================
  // UI
  // ======================================

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">

      <form
        onSubmit={handleLogin}
        className="flex flex-col gap-4 w-[340px] p-6 bg-white border rounded-lg shadow-sm"
      >

        <h1 className="text-xl font-semibold text-center">
          Owner Login
        </h1>

        {error && (
          <p className="text-red-500 text-sm text-center">
            {error}
          </p>
        )}

        <input
          autoFocus
          type="email"
          placeholder="Email"
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />        

        <input
          type="password"
          placeholder="Password"
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

      </form>

    </div>
  );
}