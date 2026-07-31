import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { sendError } from '../utils/response';

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Unauthenticated user', 401);
    }

    if (allowedRoles.includes('ALL') || allowedRoles.includes(req.user.role.name)) {
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
    if (req.user.role.name === 'SUPER_ADMIN') {
      return next();
    }

    const hasPermission = requiredPermissions.every((perm) => req.user?.permissions.includes(perm));
    if (!hasPermission) {
      return sendError(res, `Forbidden: Missing required permissions [${requiredPermissions.join(', ')}]`, 403);
    }

    next();
  };
}
