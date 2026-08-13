import { Response } from 'express';
import { DirectoratesService } from './directorates.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';

const directoratesService = new DirectoratesService();

export class DirectoratesController {
  async listDirectorates(_req: AuthRequest, res: Response) {
    try {
      const list = await directoratesService.getDirectorates();
      return sendSuccess(res, list, 'Directorates list retrieved');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async getDirectorateById(req: AuthRequest, res: Response) {
    try {
      const details = await directoratesService.getDirectorateById(req.params.id as string);
      return sendSuccess(res, details, 'Directorate details retrieved');
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }
}
