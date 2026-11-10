"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SingleResponse } from "@/types";
import { LayoutDashboard, UserRound, Users, LogOut, Menu, X, Stethoscope } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctors", label: "Doctors", icon: UserRound },
  { href: "/patients", label: "Patients", icon: Users },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => api<SingleResponse<{ name: string; email: string }>>("/auth/me"),
  });

  async function handleLogout() {
    await api("/auth/logout", { method: "POST" });
    queryClient.clear();
    toast.success("Signed out");
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex bg-[#CBF1F5] text-[#112D4E]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-[#112D4E]/15 bg-[#CBF1F5] shrink-0">
        <div className="h-16 px-6 flex items-center gap-3 border-b border-[#112D4E]/15">
          <div className="p-2 rounded-lg bg-[#112D4E] text-[#CBF1F5]">
            <Stethoscope className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">Doctor Tracker</span>
        </div>
        <nav className="p-4 space-y-1.5 flex-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-sm font-semibold transition ${
                  active
                    ? "bg-[#112D4E] text-[#CBF1F5]"
                    : "text-[#112D4E] hover:bg-[#112D4E]/[0.06]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[#112D4E]/15">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-[10px] text-sm font-semibold hover:bg-[#112D4E]/[0.06] cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-[#112D4E]/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-[#CBF1F5] border-r border-[#112D4E]/15 flex flex-col z-10">
            <div className="h-16 px-6 flex items-center justify-between border-b border-[#112D4E]/15">
              <span className="font-bold text-lg">Doctor Tracker</span>
              <button onClick={() => setMobileOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-1.5 flex-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-sm font-semibold ${
                      active ? "bg-[#112D4E] text-[#CBF1F5]" : "hover:bg-[#112D4E]/[0.06]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-6 border-b border-[#112D4E]/15 flex items-center justify-between bg-[#CBF1F5]">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-[#112D4E]/[0.06]"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:block text-sm font-medium text-[#112D4E]/70">
            Clinical Administration Portal
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold">{me?.data?.name ?? "Admin"}</div>
              <div className="text-xs text-[#112D4E]/70">{me?.data?.email ?? ""}</div>
            </div>
            <button
              onClick={handleLogout}
              className="lg:hidden p-2 rounded-lg border border-[#112D4E]/15"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>
        <main className="p-6 max-w-7xl w-full mx-auto flex-1">{children}</main>
      </div>
    </div>
  );
}
