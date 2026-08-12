import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

/** Returns the userId only if it looks like a real UUID (from DB). Synthetic IDs like "user-pereedi" are excluded. */
function realUserId(id?: string): string | null {
  if (!id) return null;
  // Real Prisma UUIDs are 36 chars with 4 dashes: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return id;
  return null;
}

export function auditLogMiddleware(action: string, resource: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await prisma.auditLog.create({
            data: {
              // Only attach userId if it's a real DB UUID — avoids FK constraint violations
              userId: realUserId(req.user?.id),
              action,
              resource,
              details: JSON.stringify({
                method: req.method,
                url: req.originalUrl,
                body: req.body ? Object.keys(req.body) : [],
              }),
              ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
            },
          });
        } catch (err: any) {
          logger.error('Failed to save audit log:', err.message);
        }
      }
    });

    next();
  };
}

