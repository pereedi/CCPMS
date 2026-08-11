/** Portal role derived from the user's DB role — drives role-based routing */
export type PortalRole = 'OFEM' | 'AD';

export interface User {
  id: string;
  kingschatUserId: string;
  username?: string;
  name: string;
  email?: string;
  phone?: string;
  profilePhoto?: string;
  status: string;
  role: string;
  directorateRole?: string;
  permissions: string[];
  directorate?: {
    id: string;
    name: string;
    code: string;
  } | null;
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
  lastLogin?: string;
}

export interface Directorate {
  id: string;
  name: string;
  code: string;
  description?: string;
  departments?: Department[];
  _count?: {
    users: number;
    projects: number;
    kpis: number;
  };
}

export interface Department {
  id: string;
  name: string;
  code: string;
  directorateId: string;
}

export interface KPI {
  id: string;
  name: string;
  code: string;
  description?: string;
  unit: string;
  weight: number;
  targetValue: number;
  currentValue: number;
  performanceScore: number;
  status: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | 'CRITICAL' | string;
  category?: {
    name: string;
  };
  directorate?: {
    name: string;
    code: string;
  };
  department?: {
    name: string;
    code: string;
  };
  results?: KPIResult[];
}

export interface KPIResult {
  id: string;
  period: string;
  actualValue: number;
  targetValue: number;
  score: number;
  remarks?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'RISKY' | string;
  progress: number;
  budget: number;
  spent: number;
  startDate?: string;
  endDate?: string;
  directorate?: {
    name: string;
    code: string;
  };
  milestones?: Milestone[];
}

export interface Milestone {
  id: string;
  title: string;
  status: string;
  dueDate?: string;
}

export interface Report {
  id: string;
  title: string;
  type: string;
  period: string;
  summary: string;
  status: 'DRAFT' | 'SUBMITTED' | 'MANAGER_APPROVED' | 'DIRECTOR_APPROVED' | 'REJECTED' | string;
  createdAt: string;
  author?: {
    name: string;
  };
  directorate?: {
    name: string;
    code: string;
  };
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'APPROVAL_REQUEST' | 'ALERT' | 'DEADLINE' | string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
  user?: {
    name: string;
    email?: string;
  };
}

export interface DashboardSummary {
  kpis: {
    total: number;
    avgScore: number;
    statusBreakdown: {
      EXCELLENT: number;
      GOOD: number;
      NEEDS_ATTENTION: number;
      CRITICAL: number;
    };
  };
  projects: {
    total: number;
    avgProgress: number;
    totalBudget: number;
    totalSpent: number;
    byStatus: Record<string, number>;
  };
  directoratesCount: number;
  pendingReportsCount: number;
  recentAuditLogs: AuditLog[];
}
