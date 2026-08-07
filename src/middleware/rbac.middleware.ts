import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { sendError } from '../utils/response';

/** Resolve role name from either a plain string or a role object */
const getRoleName = (role: AuthRequest['user'] extends undefined ? never : NonNullable<AuthRequest['user']>['role']): string =>
  typeof role === 'string' ? role : (role as any)?.name || '';

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Unauthenticated user', 401);
    }

    if (allowedRoles.includes('ALL') || allowedRoles.includes(getRoleName(req.user.role))) {
      return next();
    }

    return sendError(res, `Forbidden: Requires role [${allowedRoles.join(', ')}]`, 403);
  };
}

export function requirePermission(...requiredPermissions: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Unauthenticated user', 401);
    }

    // Super Admin bypasses permission checks
    if (getRoleName(req.user.role) === 'SUPER_ADMIN') {
      return next();
    }

    const hasPermission = requiredPermissions.every((perm) => req.user?.permissions.includes(perm));
    if (!hasPermission) {
      return sendError(res, `Forbidden: Missing required permissions [${requiredPermissions.join(', ')}]`, 403);
    }

    next();
  };
}
