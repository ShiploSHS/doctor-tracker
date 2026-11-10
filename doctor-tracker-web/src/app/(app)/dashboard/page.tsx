"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SingleResponse } from "@/types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PIE_COLORS = ["#112D4E", "#3F72AF", "#274C77", "#5C88C4", "#1B3B6F", "#4A7C59", "#6B9080", "#84A98C"];

export default function DashboardPage() {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");

  const { data: summaryRes, isLoading: loadingSummary } = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () =>
      api<
        SingleResponse<{
          totalDoctors: number;
          totalPatients: number;
          avgPatientsPerDoctor: number;
          newThisMonth: number;
          monthOverMonthPct: number;
        }>
      >("/dashboard/summary"),
  });

  const { data: overTimeRes, isLoading: loadingTime } = useQuery({
    queryKey: ["dashboard", "over-time", range],
    queryFn: () =>
      api<SingleResponse<{ date: string; count: number }[]>>(
        `/dashboard/patients-over-time?range=${range}`
      ),
  });

  const { data: perDoctorRes } = useQuery({
    queryKey: ["dashboard", "per-doctor"],
    queryFn: () =>
      api<SingleResponse<{ name: string; patients: number }[]>>(
        "/dashboard/patients-per-doctor?limit=10"
      ),
  });

  const { data: conditionsRes } = useQuery({
    queryKey: ["dashboard", "conditions"],
    queryFn: () =>
      api<SingleResponse<{ condition: string; count: number }[]>>("/dashboard/conditions"),
  });

  const summary = summaryRes?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-[#112D4E]/70 mt-1">
          Real-time overview of doctors, patient intake, and condition distribution
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total doctors", value: summary?.totalDoctors ?? "—" },
          { label: "Total patients", value: summary?.totalPatients ?? "—" },
          { label: "Average patients / doctor", value: summary?.avgPatientsPerDoctor ?? "—" },
          {
            label: "New patients this month",
            value: summary?.newThisMonth ?? "—",
            sub:
              summary?.monthOverMonthPct !== undefined
                ? `${summary.monthOverMonthPct >= 0 ? "+" : ""}${summary.monthOverMonthPct}% vs last month`
                : "",
          },
        ].map((card, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[#112D4E]/15 bg-[#CBF1F5] p-5 flex flex-col justify-between"
          >
            <span className="text-xs font-semibold text-[#112D4E]/70">{card.label}</span>
            <div className="mt-2 text-3xl font-bold">
              {loadingSummary ? "..." : card.value}
            </div>
            {card.sub && <span className="text-xs text-[#146C4E] font-medium mt-1">{card.sub}</span>}
          </div>
        ))}
      </div>

      {/* Hero Chart: Patients Over Time */}
      <div className="rounded-2xl border border-[#112D4E]/15 bg-[#CBF1F5] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold">Patients over time</h2>
            <p className="text-xs text-[#112D4E]/70">Daily patient admissions (zero-filled)</p>
          </div>
          <div className="flex rounded-[10px] border border-[#112D4E]/15 p-1 gap-1">
            {(["7d", "30d", "90d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  range === r ? "bg-[#112D4E] text-[#CBF1F5]" : "hover:bg-[#112D4E]/[0.06]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72">
          {loadingTime ? (
            <div className="h-full flex items-center justify-center text-sm text-[#112D4E]/70">
              Loading time-series data...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overTimeRes?.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,45,78,0.12)" />
                <XAxis dataKey="date" stroke="#112D4E" fontSize={12} tickMargin={8} />
                <YAxis stroke="#112D4E" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#E0F7FA",
                    borderColor: "rgba(17,45,78,0.2)",
                    borderRadius: "10px",
                    color: "#112D4E",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#112D4E"
                  strokeWidth={2.5}
                  fill="#3F72AF"
                  fillOpacity={0.25}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[#112D4E]/15 bg-[#CBF1F5] p-6">
          <h2 className="text-lg font-bold mb-1">Patients per doctor (Top 10)</h2>
          <p className="text-xs text-[#112D4E]/70 mb-4">Ranked by active caseload</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perDoctorRes?.data ?? []} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,45,78,0.12)" />
                <XAxis type="number" stroke="#112D4E" fontSize={12} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#112D4E" fontSize={11} width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#E0F7FA",
                    borderColor: "rgba(17,45,78,0.2)",
                    borderRadius: "10px",
                  }}
                />
                <Bar dataKey="patients" fill="#112D4E" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-[#112D4E]/15 bg-[#CBF1F5] p-6">
          <h2 className="text-lg font-bold mb-1">Patients by condition</h2>
          <p className="text-xs text-[#112D4E]/70 mb-4">Breakdown across primary diagnoses</p>
          <div className="h-72 flex flex-col sm:flex-row items-center">
            <div className="w-full sm:w-1/2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={conditionsRes?.data ?? []}
                    dataKey="count"
                    nameKey="condition"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {(conditionsRes?.data ?? []).map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 space-y-1.5 text-xs">
              {(conditionsRes?.data ?? []).map((item, idx) => (
                <div key={item.condition} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="font-medium">{item.condition}</span>
                  </div>
                  <span className="font-bold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
