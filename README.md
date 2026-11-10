# Doctor Tracker — Clinical Administration Portal Workspace

> Doctor Tracker is a secure full-stack administration portal for managing hospital doctors and their assigned patients. It pairs index-backed prefix-token search, multi-facet filtering, and URL-synchronized pagination with an analytics dashboard that turns clinical admissions into actionable charts.

## Project Structure

```
Doctor_Tracker/
├── doctor-tracker-api/       # Backend (Node.js, Express 5, TypeScript, Mongoose 8, Zod, JWT)
│   ├── src/
│   │   ├── config/           # Environment and DB connection
│   │   ├── constants/        # Clinical conditions and constants
│   │   ├── middlewares/      # Authentication and error handling
│   │   ├── modules/
│   │   │   ├── auth/         # Login, logout, session /me routes
│   │   │   ├── dashboard/    # Analytics aggregation endpoints
│   │   │   ├── doctors/      # Doctor schema & CRUD routes
│   │   │   ├── patients/     # Patient schema & CRUD routes
│   │   │   └── users/        # User schema (Admin model)
│   │   ├── scripts/          # Database seed (40 doctors, 600 patients) & explain scripts
│   │   └── utils/            # Token generation, regex escaping, date filters
│   └── dist/                 # Compiled JavaScript
└── doctor-tracker-web/       # Frontend (Next.js 15, React 19, Tailwind CSS v4, TanStack Query v5)
    └── src/
        ├── app/
        │   ├── (auth)/login/ # Admin login screen
        │   ├── (app)/
        │   │   ├── dashboard/# Analytics charts (area, horizontal bar, donut)
        │   │   ├── doctors/  # Filterable doctors list & doctor detail views
        │   │   └── patients/ # Filterable global patients directory
        ├── lib/              # API fetch client and query string utility
        └── types/            # TypeScript data contracts
```

## Quick Start Guide

### 1. Configure Backend Environment
Edit `doctor-tracker-api/.env` with your MongoDB connection string:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/doctor_tracker?retryWrites=true&w=majority
JWT_SECRET=super_secret_jwt_key_at_least_32_characters_long_12345
JWT_EXPIRES_IN=8h
CLIENT_URL=http://localhost:3000
APP_TIMEZONE=UTC
```

### 2. Seed Database & Explain Query Execution
```bash
cd doctor-tracker-api
npm run seed
npm run explain
```
- Creates 1 Admin account (`admin@doctortracker.dev` / `Admin@123456`)
- Creates 40 Doctors with tokenized prefixes across 10 specializations and 10 hospitals
- Creates 600 Patients with realistic distribution across clinical conditions
- Confirms `IXSCAN` compound indexes for ESR queries

### 3. Start Development Servers
In Terminal 1 (Backend):
```bash
cd doctor-tracker-api
npm run dev
```

In Terminal 2 (Frontend):
```bash
cd doctor-tracker-web
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to log in.
Demo credentials:
- **Email:** `admin@doctortracker.dev`
- **Password:** `Admin@123456`
