import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

const authService = new AuthService();

export class AuthController {
  /**
   * POST /api/auth/kingschat
   * Body: { code } (OAuth popup flow) | { token } (dev/mock) | { rawInput, inputKind, requestedRole }
   */
  async loginWithKingsChat(req: Request, res: Response) {
    try {
      const body = req.body ?? {};

      // Determine what credential type was sent
      const rawInput: string    = body.code ?? body.token ?? body.rawInput ?? '';
      const inputKind           = body.code ? 'code' : 'token';
      const requestedRole       = body.requestedRole as 'OFEM' | 'AD' | undefined;

      if (!rawInput) return sendError(res, 'No credential provided', 400);

      const result = await authService.authenticateWithKingsChat(rawInput, inputKind, requestedRole);
      return sendSuccess(res, result, 'KingsChat authentication successful');
    } catch (error: any) {
      return sendError(res, error.message || 'Authentication failed', 401);
    }
  }

  /**
   * GET /api/auth/kingschat/callback  (or POST — supports both)
   * KingsChat redirects here with ?code=XXXX after the user approves the popup.
   */
  async handleKingsChatCallback(req: Request, res: Response) {
    try {
      const code   = (req.body?.code ?? req.query?.code) as string | undefined;
      const origin = (req.body?.origin ?? req.query?.origin ?? '/') as string;

      if (!code) {
        return res.status(400).send(callbackErrorHtml('Authorization code missing from KingsChat callback', origin));
      }

      const result: any = await authService.authenticateWithKingsChat(code, 'code');

      if (result.requiresRoleSelection) {
        return res.send(dualRoleHtml(result, origin));
      }

      return res.send(successHtml(result, origin));
    } catch (error: any) {
      const msg = error.message ?? 'KingsChat authentication failed';
      return res.status(401).send(callbackErrorHtml(msg, '/'));
    }
  }

  /** POST /api/auth/refresh */
  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return sendError(res, 'Refresh token is required', 400);
      const result = await authService.refreshSession(refreshToken);
      return sendSuccess(res, result, 'Token refreshed successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Refresh failed', 401);
    }
  }

  /** GET /api/auth/me */
  async getMe(req: AuthRequest, res: Response) {
    if (!req.user) return sendError(res, 'Unauthenticated', 401);
    return sendSuccess(res, req.user, 'Current user profile retrieved');
  }

  /** POST /api/auth/logout */
  async logout(_req: Request, res: Response) {
    return sendSuccess(res, null, 'Logged out successfully');
  }
}

// ─── Inline HTML helpers ──────────────────────────────────────────────────────

function dualRoleHtml(data: any, origin: string) {
  const json = JSON.stringify(data).replace(/"/g, '\\"');
  return `<!DOCTYPE html><html>
  <head><title>Select Portal — CCPMS</title></head>
  <body style="background:#0a0f1a;color:#fff;font-family:sans-serif;text-align:center;padding-top:50px;">
    <h2 style="color:#38bdf8;">Dual Access Level Detected</h2>
    <p>Please select your portal in the main window...</p>
    <script>
      if (window.opener) {
        window.opener.postMessage({ type: 'KINGSCHAT_OAUTH_DUAL_ROLE', dualRoleData: ${JSON.stringify(data)} }, '*');
        window.close();
      } else {
        sessionStorage.setItem('ccpms_dual_role_pending', '${json}');
        window.location.href = '${origin}?dual_role=1';
      }
    </script>
  </body></html>`;
}

function successHtml(result: any, origin: string) {
  return `<!DOCTYPE html><html>
  <head><title>KingsChat Callback — CCPMS</title></head>
  <body style="background:#0a0f1a;color:#fff;font-family:sans-serif;text-align:center;padding-top:50px;">
    <h2 style="color:#10b981;">Authentication Complete</h2>
    <p>Welcome, ${result.user.name}</p>
    <script>
      if (window.opener) {
        window.opener.postMessage({ type: 'KINGSCHAT_OAUTH_SUCCESS', token: "${result.accessToken}", user: ${JSON.stringify(result.user)} }, '*');
        window.close();
      } else {
        localStorage.setItem('ccpms_access_token', "${result.accessToken}");
        window.location.href = '${origin}';
      }
    </script>
  </body></html>`;
}

function callbackErrorHtml(msg: string, _origin: string) {
  const safe = msg.replace(/"/g, '\\"');
  return `<!DOCTYPE html><html>
  <head><title>Access Denied — CCPMS</title></head>
  <body style="background:#0a0f1a;color:#f87171;font-family:sans-serif;text-align:center;padding-top:50px;padding:24px;">
    <div style="max-width:480px;margin:0 auto;background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.3);padding:24px;border-radius:16px;">
      <h2 style="margin-top:0;">Access Denied</h2>
      <p style="font-size:.95rem;line-height:1.5;">${msg}</p>
    </div>
    <script>
      if (window.opener) {
        window.opener.postMessage({ type: 'KINGSCHAT_OAUTH_ERROR', message: "${safe}" }, '*');
        setTimeout(() => window.close(), 3000);
      } else {
        setTimeout(() => { window.location.href = '/'; }, 3000);
      }
    </script>
  </body></html>`;
}
