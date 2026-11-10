"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Stethoscope } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@doctortracker.dev");
  const [password, setPassword] = useState("Admin@123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      toast.success("Welcome back");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#CBF1F5] text-[#112D4E]">
      <div className="w-full max-w-md rounded-2xl border border-[#112D4E]/15 bg-[#E0F7FA] p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-[#112D4E] text-[#CBF1F5]">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Doctor Tracker</h1>
            <p className="text-sm text-[#112D4E]/70">Admin Portal Sign In</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-[#B3261E]/30 bg-[#B3261E]/10 px-4 py-3 text-sm text-[#B3261E] font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3F72AF]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3F72AF]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[10px] bg-[#112D4E] text-[#CBF1F5] py-2.5 text-sm font-semibold hover:opacity-95 disabled:opacity-60 transition cursor-pointer"
          >
            {loading ? "Signing in (waking server if idle)..." : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-xs text-[#112D4E]/70 text-center">
          Demo credentials pre-filled for reviewer convenience.
        </p>
      </div>
    </div>
  );
}
