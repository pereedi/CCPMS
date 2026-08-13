import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { sendError } from '../utils/response';
import { findRosterEntry } from '../config/authorized-users';

// ─── Request type ─────────────────────────────────────────────────────────────

export interface AuthRequest extends Request {
  user?: {
    username:    string;           // KingsChat handle (PK)
    name:        string;
    email?:      string | null;
    profilePhoto?: string | null;
    role:        'OFEM' | 'AD';
    directorate?: string | null;   // directorate code, null for OFEM sessions
    permissions: string[];
  };
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      // No token — still continue (routes that require auth will fail with 401 later)
      return next();
    }

    let decoded: any;
    try {
      decoded = jwt.verify(authHeader.split(' ')[1], ENV.JWT_SECRET);
    } catch {
      // Expired / invalid token — leave req.user undefined, routes decide what to do
      return next();
    }

    const { username, role, directorate } = decoded as {
      username: string;
      role: 'OFEM' | 'AD';
      directorate?: string | null;
    };

    if (!username || !role) return next();

    // Verify the user is still on the roster (handles de-provisioning)
    const roster = findRosterEntry({ username });
    if (!roster) return next();  // removed from roster — session silently invalidated

    // Fetch live profile data from DB (name, email, photo)
    let dbUser: any = null;
    try {
      const { prisma } = await import('../config/database');
      dbUser = await (prisma as any).authorizedUser.findUnique({ where: { username } });
    } catch {
      // DB unavailable — fall back to roster static data
    }

    req.user = {
      username,
      name:        dbUser?.name        ?? roster.name,
      email:       dbUser?.email       ?? null,
      profilePhoto: dbUser?.profilePhoto ?? null,
      role,
      directorate: role === 'OFEM' ? null : (directorate ?? roster.directorate ?? null),
      permissions: permissionsForRole(role),
    };

    return next();
  } catch (error: any) {
    return sendError(_res, `Authentication failed: ${error.message}`, 401);
  }
}

// ─── Guard helper ─────────────────────────────────────────────────────────────

/** Use after authMiddleware to require an authenticated session. */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return sendError(res, 'Authentication required', 401);
  return next();
}

/** Require a specific role. Use after requireAuth. */
export function requireRole(...roles: Array<'OFEM' | 'AD'>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return sendError(res, 'Authentication required', 401);
    if (!roles.includes(req.user.role)) {
      return sendError(res, `Insufficient permissions. Required: ${roles.join(' or ')}`, 403);
    }
    return next();
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function permissionsForRole(role: 'OFEM' | 'AD'): string[] {
  if (role === 'OFEM') {
    return [
      'records:read_all', 'records:review',
      'reviews:create', 'reviews:update',
      'directorates:read',
      'dashboard:read', 'audit:read',
      'notifications:read',
    ];
  }
  return [
    'records:create', 'records:read_own',
    'directorates:read',
    'dashboard:read',
    'notifications:read',
  ];
}
