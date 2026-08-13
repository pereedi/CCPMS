import { Response } from 'express';
import { NotificationsService } from './notifications.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';

const notificationsService = new NotificationsService();

export class NotificationsController {
  async getUserNotifications(req: AuthRequest, res: Response) {
    try {
      const list = await notificationsService.getUserNotifications(req.user!.username);
      return sendSuccess(res, list, 'Notifications retrieved');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const notifId = req.params.id as string;
      await notificationsService.markAsRead(notifId, req.user!.username);
      return sendSuccess(res, null, 'Notification marked as read');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      await notificationsService.markAllAsRead(req.user!.username);
      return sendSuccess(res, null, 'All notifications marked as read');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}
