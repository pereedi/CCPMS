import { Response } from 'express';
import { KPIService } from './kpis.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';

const kpiService = new KPIService();

export class KPIController {
  async listCategories(req: AuthRequest, res: Response) {
    try {
      const categories = await kpiService.listCategories();
      return sendSuccess(res, categories, 'KPI Categories retrieved');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async createCategory(req: AuthRequest, res: Response) {
    try {
      const { name, description } = req.body;
      if (!name) return sendError(res, 'Category name is required', 400);
      const created = await kpiService.createCategory({ name, description });
      return sendSuccess(res, created, 'KPI Category created', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async listKPIs(req: AuthRequest, res: Response) {
    try {
      const { directorateId, categoryId, search } = req.query;
      const kpis = await kpiService.listKPIs({
        directorateId: directorateId as string,
        categoryId: categoryId as string,
        search: search as string,
      });
      return sendSuccess(res, kpis, 'KPIs list retrieved');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async createKPI(req: AuthRequest, res: Response) {
    try {
      const { name, code, description, unit, weight, targetValue, categoryId, directorateId, departmentId } = req.body;
      if (!name || !code || !unit || weight === undefined || targetValue === undefined || !categoryId || !directorateId) {
        return sendError(res, 'Missing required fields for KPI creation', 400);
      }
      const created = await kpiService.createKPI({
        name,
        code,
        description,
        unit,
        weight: parseFloat(weight),
        targetValue: parseFloat(targetValue),
        categoryId,
        directorateId,
        departmentId,
      });
      return sendSuccess(res, created, 'KPI created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async recordResult(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { actualValue, period, remarks } = req.body;
      if (actualValue === undefined || !period) {
        return sendError(res, 'actualValue and period are required', 400);
      }
      const result = await kpiService.recordKPIResult(id, {
        actualValue: parseFloat(actualValue),
        period,
        remarks,
        submittedById: req.user?.id,
      });
      return sendSuccess(res, result, 'KPI result recorded and scores updated');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async getKpiDetails(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const details = await kpiService.getKpiDetails(id);
      return sendSuccess(res, details, 'KPI details retrieved');
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }
}
