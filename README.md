# 🛡️ Mission Control System (CCPMS)
### Command & Control Performance Management System

An executive performance monitoring, KPI tracking, project budget management, and directorate reporting portal built with Express, Prisma, SQLite, React 18, and TypeScript.

---

## 📚 Project Documentation

The documentation is organized cleanly into dedicated guides:

- 📖 [**Backend Architecture & API Guide**](docs/BACKEND.md): Express server, Prisma schema, API endpoints reference, and database seeding.
- 🎨 [**Frontend Architecture & UI Guide**](docs/FRONTEND.md): React + TypeScript app, Vite config, glassmorphism design system, and components.
- 👑 [**KingsChat Integration & Security Guide**](docs/KINGSCHAT_INTEGRATION.md): KingsChat authentication setup, developer quick-login mode, and OAuth 2.0 migration.

---

## ⚡ Quick Start

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Installation & Setup

```bash
# Clone or navigate to the repository
cd mission-control-system

# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

### 3. Database Initialization & Seeding

```bash
# Push Prisma schema to SQLite database
npx prisma db push

# Seed default roles, permissions, directorates, and sample KPIs
npm run seed
```

### 4. Running the Application

#### Option A: Run Backend API & Serve Built Frontend
```bash
# 1. Build the React frontend into public/
npm run build:frontend

# 2. Start the backend server
npm run dev
```
Open **http://localhost:5000** in your browser.

#### Option B: Run Frontend Dev Server (with API Proxying)
```bash
# Terminal 1 (Backend API):
npm run dev

# Terminal 2 (React Vite Frontend):
npm run dev:frontend
```
Open **http://localhost:3000** in your browser.

---

## 🔓 KingsChat Sign-In (No-Security Mode)

KingsChat authentication currently operates in **No-Security / Quick-Login Mode** for fast testing:
- **1-Click Test Profiles**:
  - `Dr. Peremobowei Edi` (`KC_SUPERADMIN`) - Super Admin Access
  - `Alex Director` (`KC_DIRECTOR`) - Director Access (Technology & Innovation)
- **Custom Handles**: Type any KingsChat handle or email to sign in instantly.

---

## 📁 System Architecture Overview

```text
mission-control-system/
├── docs/
│   ├── BACKEND.md               # Backend API and Database documentation
│   ├── FRONTEND.md              # React + TypeScript Frontend documentation
│   └── KINGSCHAT_INTEGRATION.md # KingsChat authentication & OAuth guide
├── prisma/
│   ├── schema.prisma            # Prisma Data Models
│   └── seed.ts                  # Seed Data Script
├── src/                         # Express Backend Source Code (TypeScript)
│   ├── app.ts
│   ├── server.ts
│   ├── auth/
│   ├── directorates/
│   ├── kpis/
│   ├── projects/
│   ├── reports/
│   ├── dashboard/
│   └── audit/
├── client/                      # React + TypeScript Frontend Source Code
│   ├── index.html
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── context/AuthContext.tsx
│       └── components/
└── public/                      # Compiled Frontend Static Assets
```
