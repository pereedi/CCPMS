import { Router } from 'express';
import { authMiddleware, requireAuth, requireRole } from '../middleware/auth.middleware';
import { AuditService } from './audit.service';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();
const svc = new AuditService();

router.use(authMiddleware);

/**
 * GET /api/audit
 * OFEM Executive view for System Audit Logs
 */
router.get('/', requireAuth, requireRole('OFEM'), async (req: any, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const logs = await svc.getAuditLogs(limit);
    return sendSuccess(res, logs, 'Audit logs retrieved');
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
});

export default router;
