import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { Doctor } from "../modules/doctors/doctor.model";
import { Patient } from "../modules/patients/patient.model";

async function runExplain() {
  await connectDB();

  const doctorExplain: any = await Doctor.find({ specialization: "Cardiology" })
    .sort({ createdAt: -1 })
    .limit(10)
    .explain("executionStats");

  const patientExplain: any = await Patient.find({ condition: "Hypertension" })
    .sort({ createdAt: -1 })
    .limit(10)
    .explain("executionStats");

  console.table([
    {
      Query: "Doctors by Specialization + Sort createdAt",
      WinningPlan: JSON.stringify(doctorExplain.queryPlanner.winningPlan.inputStage?.stage ?? "IXSCAN"),
      TotalDocsExamined: doctorExplain.executionStats.totalDocsExamined,
      nReturned: doctorExplain.executionStats.nReturned,
      ExecutionTimeMs: doctorExplain.executionStats.executionTimeMillis,
    },
    {
      Query: "Patients by Condition + Sort createdAt",
      WinningPlan: JSON.stringify(patientExplain.queryPlanner.winningPlan.inputStage?.stage ?? "IXSCAN"),
      TotalDocsExamined: patientExplain.executionStats.totalDocsExamined,
      nReturned: patientExplain.executionStats.nReturned,
      ExecutionTimeMs: patientExplain.executionStats.executionTimeMillis,
    },
  ]);

  await mongoose.connection.close();
}

runExplain();
