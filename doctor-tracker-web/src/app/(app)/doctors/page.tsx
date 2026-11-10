"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api, toQueryString } from "@/lib/api";
import { Doctor, FilterMeta, PaginatedResponse, SingleResponse } from "@/types";
import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

function DoctorsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const page = Number(searchParams.get("page") || "1");
  const q = searchParams.get("q") || "";
  const specialization = searchParams.get("specialization") || "";
  const hospital = searchParams.get("hospital") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const [searchInput, setSearchInput] = useState(q);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== q) updateParams({ q: searchInput, page: 1 });
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  function updateParams(updates: Record<string, string | number | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, String(v));
    });
    router.push(`/doctors?${next.toString()}`);
  }

  const { data: metaRes } = useQuery({
    queryKey: ["meta", "filters"],
    queryFn: () => api<SingleResponse<FilterMeta>>("/meta/filters"),
  });

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ["doctors", { page, q, specialization, hospital, from, to }],
    queryFn: () =>
      api<PaginatedResponse<Doctor>>(
        `/doctors?${toQueryString({ page, limit: 10, q, specialization, hospital, from, to })}`
      ),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: (body: Omit<Doctor, "_id" | "patientCount" | "createdAt">) =>
      api("/doctors", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success("Doctor added");
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["meta"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to add doctor"),
  });

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      name: String(fd.get("name")),
      specialization: String(fd.get("specialization")),
      hospital: String(fd.get("hospital")),
      phone: String(fd.get("phone")),
      email: String(fd.get("email")),
    });
  }

  const doctors = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Doctors</h1>
          <p className="text-sm text-[#112D4E]/70">
            Search, filter, and manage registered specialists
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-[10px] bg-[#112D4E] text-[#CBF1F5] px-4 py-2.5 text-sm font-semibold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add doctor
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 rounded-2xl border border-[#112D4E]/15 p-4 bg-[#CBF1F5]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#112D4E]/60" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, email, phone..."
            className="w-full pl-9 pr-3 py-2 rounded-[10px] border border-[#112D4E]/20 bg-[#E0F7FA] text-sm focus:outline-none"
          />
        </div>
        <select
          value={specialization}
          onChange={(e) => updateParams({ specialization: e.target.value, page: 1 })}
          className="rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3 py-2 text-sm"
        >
          <option value="">All specializations</option>
          {(metaRes?.data?.specializations ?? []).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={hospital}
          onChange={(e) => updateParams({ hospital: e.target.value, page: 1 })}
          className="rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3 py-2 text-sm"
        >
          <option value="">All hospitals</option>
          {(metaRes?.data?.hospitals ?? []).map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => updateParams({ from: e.target.value, page: 1 })}
          className="rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3 py-2 text-sm"
          title="From date"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={to}
            onChange={(e) => updateParams({ to: e.target.value, page: 1 })}
            className="flex-1 rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3 py-2 text-sm"
            title="To date"
          />
          {(q || specialization || hospital || from || to) && (
            <button
              onClick={() => {
                setSearchInput("");
                router.push("/doctors");
              }}
              className="px-2.5 rounded-[10px] border border-[#112D4E]/20 hover:bg-[#112D4E]/[0.06]"
              title="Clear filters"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div
        className={`rounded-2xl border border-[#112D4E]/15 overflow-hidden transition-opacity ${
          isPlaceholderData ? "opacity-60" : "opacity-100"
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#112D4E]/15 bg-[#112D4E]/[0.04] font-semibold">
              <tr>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Specialization</th>
                <th className="py-3.5 px-4">Hospital</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Patients</th>
                <th className="py-3.5 px-4">Date added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#112D4E]/10">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#112D4E]/70">
                    Loading doctors...
                  </td>
                </tr>
              ) : doctors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#112D4E]/70">
                    No doctors match these filters.
                  </td>
                </tr>
              ) : (
                doctors.map((doc) => (
                  <tr
                    key={doc._id}
                    onClick={() => router.push(`/doctors/${doc._id}`)}
                    className="hover:bg-[#112D4E]/[0.06] cursor-pointer transition"
                  >
                    <td className="py-3.5 px-4 font-bold">
                      <Link href={`/doctors/${doc._id}`} onClick={(e) => e.stopPropagation()}>
                        {doc.name}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">{doc.specialization}</td>
                    <td className="py-3.5 px-4">{doc.hospital}</td>
                    <td className="py-3.5 px-4">
                      <div>{doc.email}</div>
                      <div className="text-xs text-[#112D4E]/70">{doc.phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#112D4E] text-[#CBF1F5]">
                        {doc.patientCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#112D4E]/75">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.total > 0 && (
          <div className="px-4 py-3 border-t border-[#112D4E]/15 flex items-center justify-between text-xs font-medium">
            <span>
              Showing {(meta.page - 1) * meta.limit + 1}–
              {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={meta.page <= 1}
                onClick={() => updateParams({ page: meta.page - 1 })}
                className="px-3 py-1.5 rounded-lg border border-[#112D4E]/20 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={meta.page >= meta.totalPages}
                onClick={() => updateParams({ page: meta.page + 1 })}
                className="px-3 py-1.5 rounded-lg border border-[#112D4E]/20 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Doctor Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#112D4E]/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#112D4E]/20 bg-[#E0F7FA] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add doctor</h2>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3.5 text-sm">
              <div>
                <label className="block font-semibold mb-1">Full name</label>
                <input
                  name="name"
                  required
                  placeholder="Dr. Sarah Ahmed"
                  className="w-full rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Specialization</label>
                <input
                  name="specialization"
                  required
                  placeholder="Cardiology"
                  className="w-full rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Hospital</label>
                <input
                  name="hospital"
                  required
                  placeholder="Square Hospital"
                  className="w-full rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="sarah@hospital.org"
                  className="w-full rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Phone</label>
                <input
                  name="phone"
                  required
                  placeholder="+8801711000000"
                  className="w-full rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-[10px] border border-[#112D4E]/20 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-[10px] bg-[#112D4E] text-[#CBF1F5] font-semibold"
                >
                  {createMutation.isPending ? "Saving..." : "Add doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DoctorsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading doctors...</div>}>
      <DoctorsContent />
    </Suspense>
  );
}
