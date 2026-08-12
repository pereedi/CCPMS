import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { prisma } from '../config/database';
import { sendError } from '../utils/response';
import { getAuthorizedUserConfig } from '../config/authorized-users';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    kingschatUserId: string;
    username: string;
    name: string;
    email?: string | null;
    role: string | { id: string; name: string };
    directorateRole?: string;
    permissions: string[];
    directorate?: { id: string; name: string; code: string } | null;
    directorateId?: string | null;
    departmentId?: string | null;
    profilePhoto?: string | null;
    status?: string;
    lastLogin?: string;
  };
}

/**
 * Sanitize a raw ID string into a clean KingsChat handle.
 * Returns null if the value looks like a base64 token, UUID, or OAuth hash.
 */
function sanitizeHandle(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const s = raw.trim().replace(/^@/, '');
  if (!s) return null;
  // Reject: base64 (contains =, +), UUIDs (8-4-4 pattern), long OAuth hashes
  if (
    s.includes('=') ||
    s.includes('+') ||
    s.length > 30 ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s)
  ) {
    return null;
  }
  return s;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    let decoded: any = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
      } catch (err) {
        // Token invalid/expired — decoded stays null
      }
    }

    // ── 1. Extract identifiers from JWT ──────────────────────────────────────
    // JWT fields: { userId: <DB UUID>, kingschatUserId: <clean handle>, role: <string> }
    // IMPORTANT: `decoded.userId` is always a DB UUID — never use it as a display handle.
    // IMPORTANT: `decoded.kingschatUserId` is the clean KingsChat username.
    const rawKcHandle = decoded?.kingschatUserId;   // e.g. "pereedi"
    const dbUserId    = decoded?.userId;             // e.g. "a3f1b2c4-..."  (UUID only)
    const jwtRole     = decoded?.role;               // e.g. "SUPER_ADMIN"

    // Sanitize to guarantee no base64/UUID reaches the display layer
    const cleanHandle = sanitizeHandle(rawKcHandle)
      ?? getAuthorizedUserConfig(rawKcHandle, jwtRole)?.kingschatUsername
      ?? null;

    // Get roster config entry for this user
    const config = getAuthorizedUserConfig(cleanHandle ?? rawKcHandle, jwtRole) ?? null;

    // ── 2. Fetch DB user — ONLY by explicit ID, never "first active" fallback ─
    let user: any = null;

    if (dbUserId) {
      user = await prisma.user.findUnique({
        where: { id: dbUserId },
        include: { role: true, directorate: true },
      });
    }

    if (!user && cleanHandle) {
      user = await prisma.user.findFirst({
        where: { kingschatUserId: cleanHandle },
        include: { role: true, directorate: true },
      });
    }

    // ↑ If user is still null here, we build the response purely from JWT + roster.
    // We do NOT fall back to any random "first active user" in the database.

    // ── 3. Determine role ─────────────────────────────────────────────────────
    const userRole = user?.role?.name || jwtRole || config?.role || 'SUPER_ADMIN';
    const isOFEM   = userRole === 'SUPER_ADMIN';
    const dirRoleTitle = isOFEM
      ? 'OFEM Executive Minister'
      : (config?.directorateRole
          || (user?.directorate?.name ? `${user.directorate.name} Director` : 'Assistant Director'));

    // ── 4. Resolve display handle (priority: DB > roster > JWT clean) ─────────
    const dbHandle      = sanitizeHandle(user?.kingschatUserId);
    const resolvedHandle = dbHandle ?? config?.kingschatUsername ?? cleanHandle ?? 'unknown';

    // ── 5. Resolve display name (priority: DB > roster name > roster handle) ──
    const dbName = (user?.name && user.name.length <= 60 && !user.name.includes('='))
      ? user.name
      : null;
    const resolvedName = dbName ?? config?.name ?? config?.kingschatUsername ?? resolvedHandle;

    // ── 6. Avatar (only real HTTP URLs, no placeholder domains) ──────────────
    const photo = (user?.profilePhoto
      && user.profilePhoto.startsWith('http')
      && !user.profilePhoto.includes('unsplash.com'))
      ? user.profilePhoto
      : null;

    // ── 7. Build request user object ─────────────────────────────────────────
    req.user = {
      id: user?.id || `user-${resolvedHandle}`,
      kingschatUserId: resolvedHandle,
      username: resolvedHandle,
      name: resolvedName,
      email: user?.email || config?.email || `${resolvedHandle}@ccpms.org`,
      profilePhoto: photo,
      status: 'ACTIVE',
      role: userRole,
      directorateRole: dirRoleTitle,
      permissions: isOFEM
        ? [
            'VIEW_ALL', 'MANAGE_REPORTS', 'APPROVE_REPORTS', 'MANAGE_USERS', 'VIEW_AUDIT',
            'reports:read', 'reports:create', 'reports:review', 'reports:approve',
            'kpis:read', 'kpis:manage', 'kpis:update_result',
            'projects:read', 'projects:manage',
            'directorates:read', 'users:read', 'users:manage',
            'audit:read', 'dashboard:read', 'notifications:read',
          ]
        : [
            'SUBMIT_REPORT', 'VIEW_OWN_REPORTS', 'VIEW_KPIS',
            'reports:read', 'reports:create',
            'kpis:read', 'kpis:update_result',
            'projects:read', 'projects:manage',
            'directorates:read', 'dashboard:read', 'notifications:read',
          ],
      directorate: isOFEM
        ? null
        : (user?.directorate
            ? { id: user.directorate.id, name: user.directorate.name, code: user.directorate.code }
            : null),
      directorateId: isOFEM ? null : (user?.directorateId || null),
    } as any;

    return next();
  } catch (error: any) {
    return sendError(res, `Authentication failed: ${error.message}`, 401);
  }
}
