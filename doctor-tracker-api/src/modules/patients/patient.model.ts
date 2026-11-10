import { Schema, model, Types } from "mongoose";
import { toTokens } from "../../utils/tokens";
import { CONDITIONS } from "../../constants/conditions";

export interface IPatient {
  doctorId: Types.ObjectId;
  name: string;
  nameTokens: string[];
  age: number;
  gender: "male" | "female" | "other";
  phone: string;
  condition: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const patientSchema = new Schema<IPatient>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    name: { type: String, required: true, trim: true },
    nameTokens: { type: [String], default: [] },
    age: { type: Number, required: true, min: 0, max: 120 },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    phone: { type: String, required: true, trim: true },
    condition: { type: String, enum: CONDITIONS, required: true },
    notes: { type: String, maxlength: 500, default: "" },
  },
  { timestamps: true }
);

patientSchema.pre("validate", function (next) {
  if (this.name) {
    this.nameTokens = toTokens(this.name);
  }
  next();
});

patientSchema.index({ doctorId: 1, createdAt: -1 });
patientSchema.index({ condition: 1, createdAt: -1 });
patientSchema.index({ createdAt: -1 });
patientSchema.index({ nameTokens: 1 });
patientSchema.index({ phone: 1 });

export const Patient = model<IPatient>("Patient", patientSchema);
