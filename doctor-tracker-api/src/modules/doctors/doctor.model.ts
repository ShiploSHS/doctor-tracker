import { Schema, model } from "mongoose";
import { toTokens } from "../../utils/tokens";

export interface IDoctor {
  name: string;
  nameTokens: string[];
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const doctorSchema = new Schema<IDoctor>(
  {
    name: { type: String, required: true, trim: true },
    nameTokens: { type: [String], default: [] },
    specialization: { type: String, required: true, trim: true },
    hospital: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);

doctorSchema.pre("validate", function (next) {
  if (this.name) {
    this.nameTokens = toTokens(this.name);
  }
  next();
});

doctorSchema.index({ createdAt: -1 });
doctorSchema.index({ specialization: 1, createdAt: -1 });
doctorSchema.index({ hospital: 1, createdAt: -1 });
doctorSchema.index({ nameTokens: 1 });
doctorSchema.index({ phone: 1 });

export const Doctor = model<IDoctor>("Doctor", doctorSchema);
