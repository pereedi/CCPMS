import { Response } from 'express';
import { DirectoratesService } from './directorates.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';

const directoratesService = new DirectoratesService();

export class DirectoratesController {
  async listDirectorates(req: AuthRequest, res: Response) {
    try {
      const list = await directoratesService.listDirectorates();
      return sendSuccess(res, list, 'Directorates list retrieved');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async createDirectorate(req: AuthRequest, res: Response) {
    try {
      const { name, code, description, organizationId } = req.body;
      if (!name || !code) {
        return sendError(res, 'Name and code are required', 400);
      }
      const created = await directoratesService.createDirectorate({ name, code, description, organizationId });
      return sendSuccess(res, created, 'Directorate created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async getDirectorateById(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const details = await directoratesService.getDirectorateById(id);
      return sendSuccess(res, details, 'Directorate details retrieved');
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  async createDepartment(req: AuthRequest, res: Response) {
    try {
      const { name, code, directorateId } = req.body;
      if (!name || !code || !directorateId) {
        return sendError(res, 'Name, code, and directorateId are required', 400);
      }
      const created = await directoratesService.createDepartment({ name, code, directorateId });
      return sendSuccess(res, created, 'Department (Internal Unit) created', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async deleteDirectorate(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      await directoratesService.deleteDirectorate(id);
      return sendSuccess(res, null, 'Directorate deleted successfully');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}
