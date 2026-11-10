import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import { connectDB } from "../config/db";
import { User } from "../modules/users/user.model";
import { Doctor } from "../modules/doctors/doctor.model";
import { Patient } from "../modules/patients/patient.model";
import { CONDITIONS } from "../constants/conditions";
import { toTokens } from "../utils/tokens";
import mongoose from "mongoose";

faker.seed(2026);

const SPECIALIZATIONS = [
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "Dermatology",
  "Oncology",
  "Endocrinology",
  "Pulmonology",
  "Nephrology",
  "General Medicine",
];

const HOSPITALS = [
  "Square Hospital",
  "Evercare Hospital",
  "United Hospital",
  "Apollo Imperial",
  "Labaid Specialized",
  "Mount Elizabeth Clinic",
  "City Central Medical",
  "Metro Heart Institute",
  "Greenview General",
  "St. Jude Medical Center",
];

async function runSeed() {
  await connectDB();

  const passwordHash = await bcrypt.hash("Admin@123456", 12);
  await User.findOneAndUpdate(
    { email: "admin@doctortracker.dev" },
    {
      name: "Demo Admin",
      email: "admin@doctortracker.dev",
      passwordHash,
      role: "admin",
    },
    { upsert: true, new: true }
  );

  await Doctor.deleteMany({});
  await Patient.deleteMany({});

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const doctorsData = Array.from({ length: 40 }).map((_, idx) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const name = `Dr. ${firstName} ${lastName}`;
    const createdAt = new Date(now - faker.number.int({ min: 1, max: 89 }) * dayMs);
    return {
      _id: new mongoose.Types.ObjectId(),
      name,
      nameTokens: toTokens(name),
      specialization: SPECIALIZATIONS[idx % SPECIALIZATIONS.length],
      hospital: HOSPITALS[idx % HOSPITALS.length],
      phone: `+88017${faker.string.numeric(8)}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${idx}@doctortracker.dev`,
      createdAt,
      updatedAt: createdAt,
    };
  });

  await Doctor.collection.insertMany(doctorsData);
  await Doctor.syncIndexes();

  const genders = ["male", "female", "other"] as const;
  const patientsData = Array.from({ length: 600 }).map(() => {
    const doc = faker.helpers.arrayElement(doctorsData);
    const name = `${faker.person.firstName()} ${faker.person.lastName()}`;
    const daysAgo = Math.floor(Math.pow(faker.number.float({ min: 0, max: 1 }), 1.35) * 89);
    const createdAt = new Date(now - daysAgo * dayMs - faker.number.int({ min: 0, max: 80000000 }));
    return {
      doctorId: doc._id,
      name,
      nameTokens: toTokens(name),
      age: faker.number.int({ min: 4, max: 88 }),
      gender: faker.helpers.arrayElement(genders),
      phone: `+88018${faker.string.numeric(8)}`,
      condition: faker.helpers.arrayElement(CONDITIONS),
      notes: faker.lorem.sentence(),
      createdAt,
      updatedAt: createdAt,
    };
  });

  await Patient.collection.insertMany(patientsData);
  await Patient.syncIndexes();

  console.log("Seed complete: 1 Admin (admin@doctortracker.dev / Admin@123456), 40 Doctors, 600 Patients");
  await mongoose.connection.close();
}

runSeed().catch((e) => {
  console.error(e);
  process.exit(1);
});
