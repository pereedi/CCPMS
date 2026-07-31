import { Router } from 'express';
import { AuditController } from './audit.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();
const controller = new AuditController();

router.use(authMiddleware);

router.get('/', requireRole('SUPER_ADMIN', 'EXECUTIVE'), (req, res) => controller.listLogs(req, res));

export default router;
