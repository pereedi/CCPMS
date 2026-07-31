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
    role: {
      id: string;
      name: string;
    };
    permissions: string[];
    directorateId?: string | null;
    departmentId?: string | null;
  };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
        if (decoded && decoded.userId) {
          userId = decoded.userId;
        }
      } catch (err) {
        // Token invalid/expired - will fallback in no-security mode
      }
    }

    let user: any = null;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      });
    }

    // In no-security mode, if no valid user token is provided, fallback to the default admin/director user
    if (!user) {
      user = await prisma.user.findFirst({
        where: { status: 'ACTIVE' },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
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
