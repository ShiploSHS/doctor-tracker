import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { Doctor } from "./doctor.model";
import { Patient } from "../patients/patient.model";
import { CONDITIONS } from "../../constants/conditions";
import { buildSearchFilter } from "../../utils/tokens";
import { buildDateRangeFilter } from "../../utils/dateRange";
import { ApiError } from "../../utils/ApiError";

const router = Router();

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  q: z.string().optional(),
  specialization: z.string().optional(),
  hospital: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

const createDoctorSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  specialization: z.string().trim().min(2, "Specialization is required").max(80),
  hospital: z.string().trim().min(2, "Hospital is required").max(120),
  phone: z.string().trim().min(6, "Phone is required").max(25),
  email: z.string().trim().email("Valid email is required").toLowerCase(),
});

const createPatientSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  age: z.coerce.number().int().min(0).max(120),
  gender: z.enum(["male", "female", "other"]),
  phone: z.string().trim().min(6).max(25),
  condition: z.enum(CONDITIONS),
  notes: z.string().trim().max(500).optional().default(""),
});

router.get("/", async (req, res) => {
  const { page, limit, q, specialization, hospital, from, to } = listQuerySchema.parse(req.query);
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {
    ...buildSearchFilter(q, true),
    ...buildDateRangeFilter(from, to),
  };
  if (specialization) filter.specialization = specialization;
  if (hospital) filter.hospital = hospital;

  const [items, total] = await Promise.all([
    Doctor.find(filter)
      .select("-nameTokens -__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Doctor.countDocuments(filter),
  ]);

  const ids = items.map((d) => d._id);
  const counts = await Patient.aggregate([
    { $match: { doctorId: { $in: ids } } },
    { $group: { _id: "$doctorId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

  const data = items.map((d) => ({
    ...d,
    patientCount: countMap.get(d._id.toString()) ?? 0,
  }));

  res.json({
    success: true,
    data,
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
});

router.post("/", async (req, res) => {
  const body = createDoctorSchema.parse(req.body);
  const created = await Doctor.create(body);
  res.status(201).json({
    success: true,
    data: { ...created.toObject(), patientCount: 0 },
  });
});

router.get("/:id", async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError(404, "NOT_FOUND", "Doctor not found");
  }
  const [doctor, patientCount] = await Promise.all([
    Doctor.findById(req.params.id).select("-nameTokens -__v").lean(),
    Patient.countDocuments({ doctorId: req.params.id }),
  ]);
  if (!doctor) throw new ApiError(404, "NOT_FOUND", "Doctor not found");

  res.json({ success: true, data: { ...doctor, patientCount } });
});

router.get("/:id/patients", async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError(404, "NOT_FOUND", "Doctor not found");
  }
  const querySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10),
    q: z.string().optional(),
    condition: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  });
  const { page, limit, q, condition, from, to } = querySchema.parse(req.query);
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {
    doctorId: new Types.ObjectId(req.params.id),
    ...buildSearchFilter(q, false),
    ...buildDateRangeFilter(from, to),
  };
  if (condition) filter.condition = condition;

  const [items, total] = await Promise.all([
    Patient.find(filter)
      .select("-nameTokens -__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Patient.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
});

router.post("/:id/patients", async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError(404, "NOT_FOUND", "Doctor not found");
  }
  const doctorExists = await Doctor.exists({ _id: req.params.id });
  if (!doctorExists) throw new ApiError(404, "NOT_FOUND", "Doctor not found");

  const body = createPatientSchema.parse(req.body);
  const patient = await Patient.create({ ...body, doctorId: req.params.id });
  res.status(201).json({ success: true, data: patient });
});

router.delete("/:id/patients/:patientId", async (req, res) => {
  const { id, patientId } = req.params;
  if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(patientId)) {
    throw new ApiError(404, "NOT_FOUND", "Patient not found");
  }
  const deleted = await Patient.findOneAndDelete({ _id: patientId, doctorId: id });
  if (!deleted) {
    throw new ApiError(404, "NOT_FOUND", "Patient not found for this doctor");
  }
  res.status(204).send();
});

export default router;
