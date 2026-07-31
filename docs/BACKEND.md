# Mission Control System (CCPMS) - Backend Documentation

## Overview
The **Command & Control Performance Management System (CCPMS)** backend provides robust API services for monitoring organizational KPIs, managing projects & budget allocations, approving directorate performance reports, managing user roles, and maintaining an immutable system audit trail.

---

## Technical Stack & Architecture

- **Runtime & Language**: Node.js (v18+) & TypeScript
- **Web Framework**: Express v5
- **ORM & Database**: Prisma ORM with SQLite (`prisma/dev.db`)
- **Authentication**: KingsChat Single Sign-On (SSO) with JWT (JSON Web Tokens)
- **Background Jobs**: Node-Cron (`src/jobs/cron.ts`)

---

## Directory Structure

```text
src/
├── app.ts                 # Express app initialization, middleware & router mounting
├── server.ts              # HTTP Server listener
├── config/
│   ├── database.ts        # Prisma client singleton
│   └── env.ts             # Environment variable schema & validation
├── auth/
│   ├── auth.controller.ts # KingsChat login, token refresh & user profile endpoints
│   ├── auth.routes.ts     # Express auth routes
│   └── auth.service.ts    # KingsChat token verification, user auto-provisioning & JWT generation
├── users/                 # User management & role assignment
├── directorates/          # Directorate & department hierarchy
├── projects/              # Projects, milestones & budget tracking
├── kpis/                  # KPI definitions, targets, & periodic result recordings
├── reports/               # Performance report generation & multi-stage approvals
├── dashboard/             # Executive analytics & summary aggregations
├── notifications/         # Real-time alert notifications
├── audit/                 # System audit log logging & query routes
├── middleware/            # Auth JWT verify middleware & error handlers
└── utils/                 # Response formatters & logger
```

---

## Data Models (Prisma Schema)

| Model | Description | Key Fields |
|---|---|---|
| `Role` | RBAC System Roles | `id`, `name` (`SUPER_ADMIN`, `DIRECTOR`), `description` |
| `Permission` | Fine-grained Access Control | `id`, `name`, `resource`, `action` |
| `User` | User account linked to KingsChat | `id`, `kingschatUserId`, `name`, `email`, `roleId`, `directorateId` |
| `Directorate` | Executive Directorate Unit | `id`, `name`, `code`, `organizationId` |
| `Department` | Sub-department under Directorate | `id`, `name`, `code`, `directorateId` |
| `Project` | Project Initiative | `id`, `name`, `code`, `progress`, `budget`, `spent`, `status` |
| `Milestone` | Deliverable Milestone | `id`, `title`, `status`, `projectId` |
| `KPI` | Key Performance Indicator | `id`, `name`, `code`, `targetValue`, `currentValue`, `performanceScore`, `status` |
| `KPIResult` | Recorded Actual Measurement | `id`, `kpiId`, `period`, `actualValue`, `targetValue`, `score` |
| `Report` | Directorate Summary Report | `id`, `title`, `type`, `period`, `summary`, `status` |
| `AuditLog` | Audit Log Entry | `id`, `userId`, `action`, `resource`, `details`, `ipAddress` |

---

## API Endpoints Reference

### 🔐 Auth (`/api/auth`)
- `POST /api/auth/kingschat-login`: Authenticate with KingsChat token or handle (Returns JWT `accessToken` & `user`).
- `POST /api/auth/refresh`: Refresh JWT access token using `refreshToken`.
- `GET /api/auth/me`: Retrieve current logged-in user profile & permissions.
- `POST /api/auth/logout`: End active session.

### 📊 Executive Dashboard (`/api/dashboard`)
- `GET /api/dashboard/summary`: Aggregated executive metrics (KPI score averages, active projects budget vs spent, directorate stats).

### 🎯 KPIs (`/api/kpis`)
- `GET /api/kpis`: List all KPI metrics with current performance score.
- `POST /api/kpis`: Create new KPI definition.
- `POST /api/kpis/:id/results`: Record actual periodic result & automatically calculate performance score and health status (`EXCELLENT`, `GOOD`, `NEEDS_ATTENTION`, `CRITICAL`).

### 🏢 Directorates (`/api/directorates`)
- `GET /api/directorates`: List all directorates with sub-departments and linked staff/projects count.
- `POST /api/directorates`: Create a new directorate unit.

### 📁 Projects (`/api/projects`)
- `GET /api/projects`: List active projects with progress %, budget vs spent, and milestones.
- `POST /api/projects`: Create a new strategic project.
- `POST /api/projects/:id/milestones`: Add a milestone deliverable.

### 📑 Reports & Approvals (`/api/reports`)
- `GET /api/reports`: List performance reports.
- `POST /api/reports`: Submit new report draft.
- `POST /api/reports/:id/approve`: Approve or reject report (`MANAGER_APPROVED`, `DIRECTOR_APPROVED`).

### 🛡️ Audit & Notifications (`/api/audit`, `/api/notifications`)
- `GET /api/audit`: Query system audit log timeline.
- `GET /api/notifications`: Retrieve unread notifications for active user.

---

## Database Seeding & Setup

Run database migrations and seed default roles, permissions, command directorate, sample KPIs, and test users:

```bash
npx prisma db push
npm run seed
```
