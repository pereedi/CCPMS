import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export function auditLogMiddleware(action: string, resource: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Intercept response finish to write audit log
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await prisma.auditLog.create({
            data: {
              userId: req.user?.id || null,
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
