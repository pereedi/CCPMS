import { Response } from 'express';
import { DashboardService } from './dashboard.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';

const dashboardService = new DashboardService();

export class DashboardController {
  async getExecutiveDashboard(req: AuthRequest, res: Response) {
    try {
      const data = await dashboardService.getExecutiveDashboard();
      return sendSuccess(res, data, 'Executive dashboard data retrieved');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async getDirectorateDashboard(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const data = await dashboardService.getDirectorateDashboard(id);
      return sendSuccess(res, data, 'Directorate dashboard data retrieved');
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  async getReportsAnalytics(req: AuthRequest, res: Response) {
    try {
      const data = await dashboardService.getReportsAnalytics();
      return sendSuccess(res, data, 'Reports analytics data retrieved');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}
