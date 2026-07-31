import { Response } from 'express';
import { AuditService } from './audit.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';

const auditService = new AuditService();

export class AuditController {
  async listLogs(req: AuthRequest, res: Response) {
    try {
      const { userId, action, resource, page, limit } = req.query;
      const result = await auditService.listLogs({
        userId: userId as string,
        action: action as string,
        resource: resource as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });
      return sendSuccess(res, result.logs, 'Audit logs retrieved', 200, result.pagination);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}
