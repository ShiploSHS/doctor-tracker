"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api, toQueryString } from "@/lib/api";
import { FilterMeta, PaginatedResponse, Patient, SingleResponse } from "@/types";
import { Search, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

function PatientsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const page = Number(searchParams.get("page") || "1");
  const q = searchParams.get("q") || "";
  const condition = searchParams.get("condition") || "";
  const doctorId = searchParams.get("doctorId") || "";
  const gender = searchParams.get("gender") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const [searchInput, setSearchInput] = useState(q);
  const [editTarget, setEditTarget] = useState<Patient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);

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
    router.push(`/patients?${next.toString()}`);
  }

  const { data: metaRes } = useQuery({
    queryKey: ["meta", "filters"],
    queryFn: () => api<SingleResponse<FilterMeta>>("/meta/filters"),
  });

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ["patients", { page, q, condition, doctorId, gender, from, to }],
    queryFn: () =>
      api<PaginatedResponse<Patient>>(
        `/patients?${toQueryString({ page, limit: 10, q, condition, doctorId, gender, from, to })}`
      ),
    placeholderData: keepPreviousData,
  });

  const editMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      api(`/patients/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success("Changes saved");
      setEditTarget(null);
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/patients/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Patient deleted");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editTarget) return;
    const fd = new FormData(e.currentTarget);
    editMutation.mutate({
      id: editTarget._id,
      body: {
        name: String(fd.get("name")),
        age: Number(fd.get("age")),
        gender: String(fd.get("gender")),
        condition: String(fd.get("condition")),
        phone: String(fd.get("phone")),
        notes: String(fd.get("notes") || ""),
      },
    });
  }

  const patients = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
        <p className="text-sm text-[#112D4E]/70">
          Global patient registry across all doctors and departments
        </p>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 rounded-2xl border border-[#112D4E]/15 p-4 bg-[#CBF1F5]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#112D4E]/60" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name or phone..."
            className="w-full pl-9 pr-3 py-2 rounded-[10px] border border-[#112D4E]/20 bg-[#E0F7FA] text-sm"
          />
        </div>
        <select
          value={condition}
          onChange={(e) => updateParams({ condition: e.target.value, page: 1 })}
          className="rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3 py-2 text-sm"
        >
          <option value="">All conditions</option>
          {(metaRes?.data?.conditions ?? []).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={doctorId}
          onChange={(e) => updateParams({ doctorId: e.target.value, page: 1 })}
          className="rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3 py-2 text-sm"
        >
          <option value="">All doctors</option>
          {(metaRes?.data?.doctors ?? []).map((d) => (
            <option key={d._id} value={d._id}>{d.name}</option>
          ))}
        </select>
        <select
          value={gender}
          onChange={(e) => updateParams({ gender: e.target.value, page: 1 })}
          className="rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3 py-2 text-sm"
        >
          <option value="">All genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => updateParams({ from: e.target.value, page: 1 })}
          className="rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={to}
            onChange={(e) => updateParams({ to: e.target.value, page: 1 })}
            className="flex-1 rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3 py-2 text-sm"
          />
          {(q || condition || doctorId || gender || from || to) && (
            <button
              onClick={() => {
                setSearchInput("");
                router.push("/patients");
              }}
              className="px-2.5 rounded-[10px] border border-[#112D4E]/20"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div
        className={`rounded-2xl border border-[#112D4E]/15 overflow-hidden ${
          isPlaceholderData ? "opacity-60" : ""
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#112D4E]/15 bg-[#112D4E]/[0.04] font-semibold">
              <tr>
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4">Age / Gender</th>
                <th className="py-3.5 px-4">Condition</th>
                <th className="py-3.5 px-4">Assigned Doctor</th>
                <th className="py-3.5 px-4">Date added</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#112D4E]/10">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">Loading patients...</td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#112D4E]/70">
                    No patients match these filters.
                  </td>
                </tr>
              ) : (
                patients.map((p) => {
                  const doc = typeof p.doctorId === "object" ? p.doctorId : null;
                  return (
                    <tr key={p._id} className="hover:bg-[#112D4E]/[0.06]">
                      <td className="py-3.5 px-4">
                        <div className="font-bold">{p.name}</div>
                        <div className="text-xs text-[#112D4E]/70">{p.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 capitalize">
                        {p.age} yrs · {p.gender}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#112D4E]/10">
                          {p.condition}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {doc ? (
                          <Link
                            href={`/doctors/${doc._id}`}
                            className="font-semibold underline hover:opacity-80"
                          >
                            {doc.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => setEditTarget(p)}
                          className="p-1.5 rounded-lg hover:bg-[#112D4E]/10 cursor-pointer"
                          title="Edit patient"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="p-1.5 rounded-lg text-[#B3261E] hover:bg-[#B3261E]/10 cursor-pointer"
                          title="Delete patient"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

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
                className="px-3 py-1.5 rounded-lg border border-[#112D4E]/20 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={meta.page >= meta.totalPages}
                onClick={() => updateParams({ page: meta.page + 1 })}
                className="px-3 py-1.5 rounded-lg border border-[#112D4E]/20 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#112D4E]/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#112D4E]/20 bg-[#E0F7FA] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Edit patient</h2>
              <button onClick={() => setEditTarget(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold mb-1">Name</label>
                <input
                  name="name"
                  defaultValue={editTarget.name}
                  required
                  className="w-full rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Age</label>
                  <input
                    name="age"
                    type="number"
                    defaultValue={editTarget.age}
                    required
                    className="w-full rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Gender</label>
                  <select
                    name="gender"
                    defaultValue={editTarget.gender}
                    className="w-full rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3 py-2"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Condition</label>
                <select
                  name="condition"
                  defaultValue={editTarget.condition}
                  className="w-full rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3 py-2"
                >
                  {(metaRes?.data?.conditions ?? []).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Phone</label>
                <input
                  name="phone"
                  defaultValue={editTarget.phone}
                  required
                  className="w-full rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Notes</label>
                <textarea
                  name="notes"
                  defaultValue={editTarget.notes}
                  rows={2}
                  className="w-full rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2 rounded-[10px] border border-[#112D4E]/20 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-[10px] bg-[#112D4E] text-[#CBF1F5] font-semibold"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#112D4E]/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#112D4E]/20 bg-[#E0F7FA] p-6">
            <h3 className="text-lg font-bold">Delete {deleteTarget.name}?</h3>
            <p className="text-sm text-[#112D4E]/75 mt-1">This can&apos;t be undone.</p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-[10px] border border-[#112D4E]/20 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget._id)}
                className="px-4 py-2 rounded-[10px] bg-[#B3261E] text-white text-sm font-semibold"
              >
                Delete patient
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PatientsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading patients...</div>}>
      <PatientsContent />
    </Suspense>
  );
}
