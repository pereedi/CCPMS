import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { prisma } from '../config/database';
import { sendError } from '../utils/response';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    kingschatUserId: string;
    name: string;
    email?: string | null;
    role: string | { id: string; name: string };
    permissions: string[];
    directorate?: { id: string; name: string; code: string } | null;
    directorateId?: string | null;
    departmentId?: string | null;
    profilePhoto?: string | null;
    status?: string;
    lastLogin?: string;
  };
}

/** Mock user shapes for prototype bypass — keyed by the mock userId in the JWT */
const MOCK_USERS: Record<string, AuthRequest['user']> = {
  'mock-ofem-001': {
    id: 'mock-ofem-001',
    kingschatUserId: 'KC_SUPERADMIN',
    name: 'OFEM Executive',
    email: 'ofem@ccpms.org',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    status: 'ACTIVE',
    role: 'SUPER_ADMIN',
    permissions: ['VIEW_ALL', 'MANAGE_REPORTS', 'APPROVE_REPORTS', 'MANAGE_USERS', 'VIEW_AUDIT'],
    directorate: null,
    lastLogin: new Date().toISOString(),
  },
  'mock-ad-001': {
    id: 'mock-ad-001',
    kingschatUserId: 'KC_DIRECTOR',
    name: 'AD Director',
    email: 'ad.director@ccpms.org',
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    status: 'ACTIVE',
    role: 'DIRECTOR',
    permissions: ['SUBMIT_REPORT', 'VIEW_OWN_REPORTS', 'VIEW_KPIS', 'reports:read', 'reports:create'],
    directorate: { id: 'mock-dir-001', name: 'Technology & Digital Innovation', code: 'TECH_DIGITAL' },
    lastLogin: new Date().toISOString(),
  },
};

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    let decoded: any = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
      } catch (err) {
        // Token invalid/expired
      }
    }

    // ── PROTOTYPE BYPASS — resolve mock user without full DB role join ────────
    if (decoded?.userId && (MOCK_USERS[decoded.userId] || decoded.kingschatUserId?.startsWith('KC_'))) {
      // Try to find real seeded user by kingschatUserId for correct FK IDs
      try {
        const kcId = decoded.kingschatUserId;
        const dbUser = kcId ? await prisma.user.findUnique({
          where: { kingschatUserId: kcId },
          include: { role: true, directorate: true },
        }) : null;

        if (dbUser) {
          req.user = {
            id:              dbUser.id,
            kingschatUserId: dbUser.kingschatUserId,
            name:            kcId === 'KC_SUPERADMIN' ? 'OFEM Executive' : 'AD Director',
            email:           dbUser.email,
            profilePhoto:    kcId === 'KC_SUPERADMIN'
              ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
              : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            status:          'ACTIVE',
            role:            dbUser.role?.name || decoded.role,
            permissions:     kcId === 'KC_SUPERADMIN'
              ? ['VIEW_ALL', 'MANAGE_REPORTS', 'APPROVE_REPORTS', 'MANAGE_USERS', 'VIEW_AUDIT', 'reports:read', 'reports:create']
              : ['SUBMIT_REPORT', 'VIEW_OWN_REPORTS', 'VIEW_KPIS', 'reports:read', 'reports:create'],
            directorate:     dbUser.directorate
              ? { id: dbUser.directorate.id, name: dbUser.directorate.name, code: dbUser.directorate.code }
              : null,
          };
          return next();
        }
      } catch (_) { /* DB not ready */ }

      // Fall back to hardcoded mock if DB lookup fails
      if (MOCK_USERS[decoded.userId]) {
        req.user = MOCK_USERS[decoded.userId];
        return next();
      }
    }
    // ─────────────────────────────────────────────────────────────────────────────


    let user: any = null;
    if (decoded?.userId) {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      });
    }

    // In no-security mode, fallback to any active DB user
    if (!user) {
      user = await prisma.user.findFirst({
        where: { status: 'ACTIVE' },
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      });
    }

    if (!user) {
      return sendError(res, 'System initialization incomplete: No active users found', 401);
    }

    const permissions = user.role.permissions.map((rp: any) => rp.permission.name);

    req.user = {
      id: user.id,
      kingschatUserId: user.kingschatUserId,
      name: user.name,
      email: user.email,
      role: {
        id: user.role.id,
        name: user.role.name,
      },
      permissions,
      directorateId: user.directorateId,
      departmentId: user.departmentId,
    };

    next();
  } catch (error: any) {
    return sendError(res, `Authentication failed: ${error.message}`, 401);
  }
}
