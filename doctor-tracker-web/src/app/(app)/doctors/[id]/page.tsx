"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, toQueryString } from "@/lib/api";
import { Doctor, FilterMeta, PaginatedResponse, Patient, SingleResponse } from "@/types";
import { ArrowLeft, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export default function DoctorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [condition, setCondition] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);

  const { data: docRes } = useQuery({
    queryKey: ["doctor", id],
    queryFn: () => api<SingleResponse<Doctor>>(`/doctors/${id}`),
  });

  const { data: metaRes } = useQuery({
    queryKey: ["meta", "filters"],
    queryFn: () => api<SingleResponse<FilterMeta>>("/meta/filters"),
  });

  const { data: patientsRes, isLoading } = useQuery({
    queryKey: ["doctor-patients", id, { page, q, condition }],
    queryFn: () =>
      api<PaginatedResponse<Patient>>(
        `/doctors/${id}/patients?${toQueryString({ page, limit: 10, q, condition })}`
      ),
  });

  const addMutation = useMutation({
    mutationFn: (body: any) =>
      api(`/doctors/${id}/patients`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success("Patient added");
      setAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["doctor-patients", id] });
      queryClient.invalidateQueries({ queryKey: ["doctor", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (patientId: string) =>
      api(`/doctors/${id}/patients/${patientId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Patient deleted");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["doctor-patients", id] });
      queryClient.invalidateQueries({ queryKey: ["doctor", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  function handleAddPatient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    addMutation.mutate({
      name: String(fd.get("name")),
      age: Number(fd.get("age")),
      gender: String(fd.get("gender")),
      phone: String(fd.get("phone")),
      condition: String(fd.get("condition")),
      notes: String(fd.get("notes") || ""),
    });
  }

  const doc = docRes?.data;
  const patients = patientsRes?.data ?? [];
  const meta = patientsRes?.meta;

  return (
    <div className="space-y-6">
      <Link
        href="/doctors"
        className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to doctors
      </Link>

      {doc && (
        <div className="rounded-2xl border border-[#112D4E]/15 p-6 bg-[#CBF1F5] flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{doc.name}</h1>
            <p className="text-sm text-[#112D4E]/75">
              {doc.specialization} · {doc.hospital}
            </p>
            <p className="text-xs text-[#112D4E]/70 mt-1">
              {doc.email} · {doc.phone}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs font-semibold text-[#112D4E]/70">Assigned Patients</div>
              <div className="text-2xl font-bold">{doc.patientCount}</div>
            </div>
            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 rounded-[10px] bg-[#112D4E] text-[#CBF1F5] px-4 py-2.5 text-sm font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add patient
            </button>
          </div>
        </div>
      )}

      {/* Patient Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search this doctor's patients..."
          className="rounded-[10px] border border-[#112D4E]/20 bg-[#E0F7FA] px-3.5 py-2 text-sm w-64"
        />
        <select
          value={condition}
          onChange={(e) => {
            setCondition(e.target.value);
            setPage(1);
          }}
          className="rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3 py-2 text-sm"
        >
          <option value="">All conditions</option>
          {(metaRes?.data?.conditions ?? []).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Doctor's Patients Table */}
      <div className="rounded-2xl border border-[#112D4E]/15 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#112D4E]/15 bg-[#112D4E]/[0.04] font-semibold">
            <tr>
              <th className="py-3.5 px-4">Patient Name</th>
              <th className="py-3.5 px-4">Age / Gender</th>
              <th className="py-3.5 px-4">Condition</th>
              <th className="py-3.5 px-4">Phone</th>
              <th className="py-3.5 px-4">Date added</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#112D4E]/10">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center">Loading patients...</td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-[#112D4E]/70">
                  No patients yet. Add the first patient for this doctor.
                </td>
              </tr>
            ) : (
              patients.map((p) => (
                <tr key={p._id} className="hover:bg-[#112D4E]/[0.06]">
                  <td className="py-3.5 px-4 font-bold">{p.name}</td>
                  <td className="py-3.5 px-4 capitalize">
                    {p.age} yrs · {p.gender}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#112D4E]/10">
                      {p.condition}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">{p.phone}</td>
                  <td className="py-3.5 px-4 text-xs">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="p-1.5 rounded-lg text-[#B3261E] hover:bg-[#B3261E]/10 cursor-pointer"
                      title="Delete patient"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {meta && meta.total > 0 && (
          <div className="px-4 py-3 border-t border-[#112D4E]/15 flex items-center justify-between text-xs font-medium">
            <span>
              Page {meta.page} of {meta.totalPages} ({meta.total} total)
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={meta.page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-[#112D4E]/20 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-[#112D4E]/20 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#112D4E]/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#112D4E]/20 bg-[#E0F7FA] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add patient for {doc?.name}</h2>
              <button onClick={() => setAddOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddPatient} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold mb-1">Patient name</label>
                <input
                  name="name"
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
                    min={0}
                    max={120}
                    required
                    className="w-full rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Gender</label>
                  <select
                    name="gender"
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
                  required
                  className="w-full rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Clinical notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full rounded-[10px] border border-[#112D4E]/20 bg-[#CBF1F5] px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="px-4 py-2 rounded-[10px] border border-[#112D4E]/20 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="px-4 py-2 rounded-[10px] bg-[#112D4E] text-[#CBF1F5] font-semibold"
                >
                  Add patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#112D4E]/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#112D4E]/20 bg-[#E0F7FA] p-6">
            <h3 className="text-lg font-bold">Delete {deleteTarget.name}?</h3>
            <p className="text-sm text-[#112D4E]/75 mt-1">
              This action cannot be undone.
            </p>
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
