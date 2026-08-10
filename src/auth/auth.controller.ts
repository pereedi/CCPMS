import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

const authService = new AuthService();

export class AuthController {
  async loginWithKingsChat(req: Request, res: Response) {
    try {
      const payload = req.body;
      const result = await authService.authenticateWithKingsChat(payload);
      return sendSuccess(res, result, 'KingsChat authentication successful');
    } catch (error: any) {
      return sendError(res, error.message || 'Authentication failed', 401);
    }
  }

  async handleKingsChatCallback(req: Request, res: Response) {
    try {
      const { code, origin } = req.body;
      if (!code) {
        return res.status(400).send('Authorization code missing in callback request');
      }

      const result = await authService.authenticateWithKingsChat({ code, origin });
      // Return HTML page that posts token back to client window or redirects
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>KingsChat Callback</title></head>
          <body style="background:#0a0f1a;color:#fff;font-family:sans-serif;text-align:center;padding-top:50px;">
            <h2>KingsChat Authentication Complete</h2>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'KINGSCHAT_OAUTH_SUCCESS', token: "${result.accessToken}" }, '*');
                window.close();
              } else {
                localStorage.setItem('ccpms_access_token', "${result.accessToken}");
                window.location.href = "${origin || '/'}";
              }
            </script>
          </body>
        </html>
      `);
    } catch (error: any) {
      return res.status(401).send(`KingsChat Authentication Error: ${error.message}`);
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
