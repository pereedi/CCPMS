import { Response } from 'express';
import { ReportsService } from './reports.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';

const reportsService = new ReportsService();

export class ReportsController {
  async listReports(req: AuthRequest, res: Response) {
    try {
      const { directorateId, status, type, authorId } = req.query;

      const rawRole = req.user?.role;
      const userRole = typeof rawRole === 'string' ? rawRole : (rawRole as any)?.name;

      // STRICT DIRECTORATE ISOLATION:
      // If user is a DIRECTOR, force directorateId filter to their assigned directorate.
      let effectiveDirectorateId = directorateId as string;
      if (userRole === 'DIRECTOR') {
        const assignedDirId = req.user?.directorateId || (req.user?.directorate as any)?.id;
        if (assignedDirId) {
          effectiveDirectorateId = assignedDirId;
        }
      }

      const reports = await reportsService.listReports({
        directorateId: effectiveDirectorateId,
        status: status as string,
        type: type as string,
        authorId: authorId as string,
      });
      return sendSuccess(res, reports, 'Reports list retrieved');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async createReport(req: AuthRequest, res: Response) {
    try {
      const { title, type, period, summary, dataJson, directorateId } = req.body;
      if (!title || !period || !summary) {
        return sendError(res, 'Title, period, and summary are required', 400);
      }

      const rawRole = req.user?.role;
      const userRole = typeof rawRole === 'string' ? rawRole : (rawRole as any)?.name;

      // STRICT DIRECTORATE BINDING:
      // If user is a DIRECTOR, force directorateId to their assigned directorate.
      let assignedDirId = directorateId;
      if (userRole === 'DIRECTOR') {
        assignedDirId = req.user?.directorateId || (req.user?.directorate as any)?.id || directorateId;
      }

      // Resolve the real DB user ID from kingschatUserId if needed
      let authorId = req.user!.id;
      if (authorId && authorId.startsWith('user-')) {
        const { prisma } = await import('../config/database');
        const kcHandle = req.user!.kingschatUserId;
        const dbUser = await prisma.user.findFirst({
          where: { OR: [{ kingschatUserId: kcHandle }, { name: kcHandle }] },
        });
        if (dbUser) {
          authorId = dbUser.id;
          if (!assignedDirId) assignedDirId = dbUser.directorateId || undefined;
        } else {
          // Fall back to first user in the relevant directorate
          const { prisma: db } = await import('../config/database');
          const fallbackUser = await db.user.findFirst({ where: { status: 'ACTIVE' } });
          if (fallbackUser) authorId = fallbackUser.id;
        }
      }

      const created = await reportsService.createReport({
        title,
        type,
        period,
        summary,
        dataJson,
        directorateId: assignedDirId,
        authorId,
      });
      return sendSuccess(res, created, 'Draft report created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async submitReport(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const updated = await reportsService.submitReport(id, req.user!.id);
      return sendSuccess(res, updated, 'Report submitted for review');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async reviewReport(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { action, comments } = req.body; // APPROVE or REJECT
      if (!action || !['APPROVE', 'REJECT'].includes(action)) {
        return sendError(res, 'Valid action (APPROVE or REJECT) is required', 400);
      }
      const updated = await reportsService.reviewReport(id, req.user!.id, action, comments);
      return sendSuccess(res, updated, `Manager review recorded: ${action}`);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async approveReport(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { action, comments } = req.body;
      if (!action) {
        return sendError(res, 'Action is required', 400);
      }
      const actStr = String(action).toUpperCase();
      const normalizedAction: 'APPROVE' | 'REJECT' = actStr.includes('APPROVE') ? 'APPROVE' : 'REJECT';
      const rawRole = req.user?.role;
      const approverRole = (typeof rawRole === 'string' ? rawRole : (rawRole as any)?.name) || 'SUPER_ADMIN';

      const updated = await reportsService.approveReportByDirector(id, req.user!.id, normalizedAction, comments, approverRole);
      return sendSuccess(res, updated, `Report ${normalizedAction === 'APPROVE' ? 'approved' : 'rejected'} successfully by ${approverRole.replace('_', ' ')}`);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async getReportById(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const report = await reportsService.getReportById(id);
      return sendSuccess(res, report, 'Report details retrieved');
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  async updateReport(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { title, type, period, summary, dataJson, directorateId } = req.body;
      const updated = await reportsService.updateReport(id, {
        title,
        type,
        period,
        summary,
        dataJson,
        directorateId,
      });
      return sendSuccess(res, updated, 'Report updated successfully');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}
