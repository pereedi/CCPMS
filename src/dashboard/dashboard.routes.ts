import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();
const controller = new DashboardController();

router.use(authMiddleware);

router.get('/executive', (req, res) => controller.getExecutiveDashboard(req, res));
router.get('/summary', (req, res) => controller.getExecutiveDashboard(req, res));
router.get('/reports-analytics', (req, res) => controller.getReportsAnalytics(req, res));
router.get('/directorate/:id', (req, res) => controller.getDirectorateDashboard(req, res));

export default router;
