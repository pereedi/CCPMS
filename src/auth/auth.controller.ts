import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

const authService = new AuthService();

export class AuthController {
  async loginWithKingsChat(req: Request, res: Response) {
    try {
      const token = req.body?.token || 'KC_DIRECTOR';

      const result = await authService.authenticateWithKingsChat(token);
      return sendSuccess(res, result, 'KingsChat authentication successful');
    } catch (error: any) {
      return sendError(res, error.message || 'Authentication failed', 401);
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return sendError(res, 'Refresh token is required', 400);
      }

      const result = await authService.refreshSession(refreshToken);
      return sendSuccess(res, result, 'Token refreshed successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Refresh failed', 401);
    }
  }

  async getMe(req: AuthRequest, res: Response) {
    if (!req.user) {
      return sendError(res, 'Unauthenticated', 401);
    }
    return sendSuccess(res, req.user, 'Current user profile retrieved');
  }

  async logout(req: Request, res: Response) {
    return sendSuccess(res, null, 'Logged out successfully');
  }
}
