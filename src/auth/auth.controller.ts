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
      const code = req.body?.code || req.query?.code;
      const origin = req.body?.origin || req.query?.origin;

      if (!code) {
        return res.status(400).send(`
          <!DOCTYPE html>
          <html>
            <head><title>KingsChat Callback Error</title></head>
            <body style="background:#0a0f1a;color:#ef4444;font-family:sans-serif;text-align:center;padding-top:50px;">
              <h2>Authorization Code Missing</h2>
              <p>KingsChat did not return a valid authorization code.</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'KINGSCHAT_OAUTH_ERROR', message: 'Authorization code missing from KingsChat callback' }, '*');
                  setTimeout(() => window.close(), 2000);
                }
              </script>
            </body>
          </html>
        `);
      }

      const result = await authService.authenticateWithKingsChat({ code, origin });
      // Return HTML page that posts token back to client window or redirects
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>KingsChat Callback</title></head>
          <body style="background:#0a0f1a;color:#fff;font-family:sans-serif;text-align:center;padding-top:50px;">
            <h2 style="color: #10b981;">KingsChat Authentication Complete</h2>
            <p>Welcome, ${result.user.name}</p>
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
      const errorMsg = error.message || 'KingsChat authentication failed';
      return res.status(401).send(`
        <!DOCTYPE html>
        <html>
          <head><title>KingsChat Access Denied</title></head>
          <body style="background:#0a0f1a;color:#f87171;font-family:sans-serif;text-align:center;padding-top:50px;padding-left:20px;padding-right:20px;">
            <div style="max-width:500px;margin:0 auto;background:rgba(244,63,94,0.1);border:1px solid rgba(244,63,94,0.3);padding:24px;border-radius:16px;">
              <h2 style="margin-top:0;">Access Denied</h2>
              <p style="font-size:0.95rem;line-height:1.5;">${errorMsg}</p>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'KINGSCHAT_OAUTH_ERROR', message: "${errorMsg.replace(/"/g, '\\"')}" }, '*');
                setTimeout(() => window.close(), 3000);
              } else {
                setTimeout(() => { window.location.href = '/'; }, 3000);
              }
            </script>
          </body>
        </html>
      `);
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
