# Mission Control System (CCPMS) - Frontend Documentation

## Overview
The **Command & Control Performance Management System (CCPMS)** frontend is built using **React 18** and **TypeScript**, bundled with **Vite**. It features an executive dark-mode design system with glassmorphism visual styling, real-time KPI score calculation, interactive chart analytics (Recharts), and seamless 1-click KingsChat authentication integration.

---

## Technology Stack

- **Framework**: React 18 + TypeScript 5
- **Build Tool & Dev Server**: Vite 5
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **HTTP Client**: Axios with JWT Interceptor
- **Styling**: Modern Vanilla CSS Design System with CSS Custom Properties & Glassmorphism (`client/src/index.css`)

---

## Project Structure (`client/`)

```text
client/
├── index.html               # Main HTML entry point
├── package.json             # Frontend dependencies & scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite build & API proxy setup (/api -> http://localhost:5000)
└── src/
    ├── main.tsx             # React DOM root render
    ├── App.tsx              # Main dashboard layout wrapper & state management
    ├── index.css            # Custom CSS Tokens, Glassmorphism, animations, theme badges
    ├── types/
    │   └── index.ts         # TypeScript interfaces (User, KPI, Project, Directorate, Report, AuditLog)
    ├── services/
    │   └── api.ts           # Axios instance with Bearer token interceptor & error handling
    ├── context/
    │   └── AuthContext.tsx  # React Auth Provider, KingsChat quick-login & session state
    └── components/
        ├── layout/
        │   ├── Navbar.tsx   # Header bar with KingsChat status badge & profile menu
        │   └── Sidebar.tsx  # Navigation sidebar menu
        ├── auth/
        │   └── KingsChatLoginModal.tsx # KingsChat sign-in modal with 1-click test profiles
        ├── dashboard/
        │   └── OverviewTab.tsx # Executive summary, metric cards, & analytics charts
        ├── directorates/
        │   └── DirectoratesTab.tsx # Directorate & department tree views
        ├── kpis/
        │   └── KPIsTab.tsx  # KPI list & actual result recording modal
        ├── projects/
        │   └── ProjectsTab.tsx # Project portfolio, budget allocation, & milestones
        ├── reports/
        │   └── ReportsTab.tsx # Performance report submission & approval workflow
        ├── audit/
        │   └── AuditLogsTab.tsx # Audit log table
        └── notifications/
            └── NotificationsModal.tsx # Notification center
```

---

## Key Frontend Features & Capabilities

### 1. 👑 KingsChat Quick Sign-In (No-Security Mode)
- **1-Click Test Profiles**:
  - `Dr. Peremobowei Edi` (`KC_SUPERADMIN`): Full Super Admin access.
  - `Alex Director` (`KC_DIRECTOR`): Directorate Head (Technology & Innovation).
- **Custom KingsChat Handles**: Enter any username or handle to auto-authenticate immediately without requiring official KingsChat client secret keys during dev/testing.

### 2. 📊 Executive Dashboard Analytics
- Dynamic status health cards (System Uptime, Project Progress, Spend vs Budget).
- Interactive Recharts bar graph displaying KPI performance distribution (`EXCELLENT`, `GOOD`, `NEEDS_ATTENTION`, `CRITICAL`).
- Financial spend progress meter with live percentage calculations.

### 3. 🎯 KPI Target & Actual Recording
- View target vs actual values across all categories (Operational Excellence, Financial, etc.).
- Modal for recording actual metric values with automatic performance score recalculation.

### 4. 📑 Performance Reports & Multi-Stage Approvals
- Submit monthly and quarterly directorate summaries.
- One-click approval actions for Managers and Directors.

---

## Development & Building Commands

From the project root:

```bash
# Run frontend dev server on http://localhost:3000
npm run dev:frontend

# Build production bundle output directly into backend ../public folder
npm run build:frontend
```
