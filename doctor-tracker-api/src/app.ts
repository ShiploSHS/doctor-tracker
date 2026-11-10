import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { env } from "./config/env";
import authRoutes from "./modules/auth/auth.routes";
import doctorRoutes from "./modules/doctors/doctor.routes";
import patientRoutes from "./modules/patients/patient.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import { authenticate } from "./middlewares/authenticate";
import { notFound, errorHandler } from "./middlewares/errorHandler";
import { Doctor } from "./modules/doctors/doctor.model";
import { CONDITIONS } from "./constants/conditions";

export const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
if (env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1/auth", authRoutes);

app.get("/api/v1/meta/filters", authenticate, async (_req, res) => {
  const [specializations, hospitals, doctors] = await Promise.all([
    Doctor.distinct("specialization"),
    Doctor.distinct("hospital"),
    Doctor.find().select("_id name specialization").sort({ name: 1 }).lean(),
  ]);
  res.json({
    success: true,
    data: {
      specializations: specializations.sort(),
      hospitals: hospitals.sort(),
      conditions: CONDITIONS,
      doctors,
    },
  });
});

app.use("/api/v1/doctors", authenticate, doctorRoutes);
app.use("/api/v1/patients", authenticate, patientRoutes);
app.use("/api/v1/dashboard", authenticate, dashboardRoutes);

app.use(notFound);
app.use(errorHandler);
