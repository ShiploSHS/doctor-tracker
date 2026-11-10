import { Router } from "express";
import { Doctor } from "../doctors/doctor.model";
import { Patient } from "../patients/patient.model";
import { env } from "../../config/env";

const router = Router();

router.get("/summary", async (_req, res) => {
  const now = new Date();
  const startOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const startOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));

  const [totalDoctors, totalPatients, newThisMonth, newLastMonth] = await Promise.all([
    Doctor.countDocuments(),
    Patient.countDocuments(),
    Patient.countDocuments({ createdAt: { $gte: startOfThisMonth } }),
    Patient.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
    }),
  ]);

  const avgPatientsPerDoctor =
    totalDoctors > 0 ? Number((totalPatients / totalDoctors).toFixed(1)) : 0;

  const monthOverMonthPct =
    newLastMonth > 0
      ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100)
      : 100;

  res.json({
    success: true,
    data: {
      totalDoctors,
      totalPatients,
      avgPatientsPerDoctor,
      newThisMonth,
      newLastMonth,
      monthOverMonthPct,
    },
  });
});

router.get("/patients-over-time", async (req, res) => {
  const rangeStr = String(req.query.range || "30d");
  const days = rangeStr === "7d" ? 7 : rangeStr === "90d" ? 90 : 30;

  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const raw = await Patient.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
            timezone: env.APP_TIMEZONE,
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const map = new Map(raw.map((r) => [r._id, r.count]));
  const series: { date: string; count: number }[] = [];

  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key, count: map.get(key) ?? 0 });
  }

  res.json({ success: true, data: series });
});

router.get("/patients-per-doctor", async (req, res) => {
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 10));
  const data = await Patient.aggregate([
    { $group: { _id: "$doctorId", patients: { $sum: 1 } } },
    { $sort: { patients: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "doctors",
        localField: "_id",
        foreignField: "_id",
        as: "doctor",
      },
    },
    { $unwind: "$doctor" },
    {
      $project: {
        _id: 0,
        doctorId: "$_id",
        name: "$doctor.name",
        specialization: "$doctor.specialization",
        patients: 1,
      },
    },
  ]);

  res.json({ success: true, data });
});

router.get("/conditions", async (_req, res) => {
  const data = await Patient.aggregate([
    { $group: { _id: "$condition", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, condition: "$_id", count: 1 } },
  ]);

  res.json({ success: true, data });
});

export default router;
