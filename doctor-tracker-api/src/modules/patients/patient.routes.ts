import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { Patient } from "./patient.model";
import { Doctor } from "../doctors/doctor.model";
import { CONDITIONS } from "../../constants/conditions";
import { buildSearchFilter } from "../../utils/tokens";
import { buildDateRangeFilter } from "../../utils/dateRange";
import { ApiError } from "../../utils/ApiError";

const router = Router();

const listPatientsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  q: z.string().optional(),
  condition: z.string().optional(),
  doctorId: z.string().optional(),
  gender: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

const updatePatientSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  age: z.coerce.number().int().min(0).max(120).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  phone: z.string().trim().min(6).max(25).optional(),
  condition: z.enum(CONDITIONS).optional(),
  notes: z.string().trim().max(500).optional(),
  doctorId: z.string().optional(),
});

router.get("/", async (req, res) => {
  const { page, limit, q, condition, doctorId, gender, from, to } =
    listPatientsSchema.parse(req.query);
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {
    ...buildSearchFilter(q, false),
    ...buildDateRangeFilter(from, to),
  };
  if (condition) filter.condition = condition;
  if (gender) filter.gender = gender;
  if (doctorId && Types.ObjectId.isValid(doctorId)) {
    filter.doctorId = new Types.ObjectId(doctorId);
  }

  const [items, total] = await Promise.all([
    Patient.find(filter)
      .select("-nameTokens -__v")
      .populate("doctorId", "name specialization hospital")
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

router.get("/:id", async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError(404, "NOT_FOUND", "Patient not found");
  }
  const patient = await Patient.findById(req.params.id)
    .select("-nameTokens -__v")
    .populate("doctorId", "name specialization hospital")
    .lean();
  if (!patient) throw new ApiError(404, "NOT_FOUND", "Patient not found");
  res.json({ success: true, data: patient });
});

router.patch("/:id", async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError(404, "NOT_FOUND", "Patient not found");
  }
  const body = updatePatientSchema.parse(req.body);
  if (body.doctorId) {
    if (!Types.ObjectId.isValid(body.doctorId) || !(await Doctor.exists({ _id: body.doctorId }))) {
      throw new ApiError(400, "INVALID_DOCTOR", "Selected doctor does not exist");
    }
  }
  const doc = await Patient.findById(req.params.id);
  if (!doc) throw new ApiError(404, "NOT_FOUND", "Patient not found");

  Object.assign(doc, body);
  await doc.save();

  const populated = await doc.populate("doctorId", "name specialization hospital");
  res.json({ success: true, data: populated });
});

router.delete("/:id", async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError(404, "NOT_FOUND", "Patient not found");
  }
  const deleted = await Patient.findByIdAndDelete(req.params.id);
  if (!deleted) throw new ApiError(404, "NOT_FOUND", "Patient not found");
  res.status(204).send();
});

export default router;
