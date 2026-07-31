import { Router } from 'express';
import { KPIController } from './kpis.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { auditLogMiddleware } from '../middleware/audit.middleware';

const router = Router();
const controller = new KPIController();

router.use(authMiddleware);

router.get('/categories', (req, res) => controller.listCategories(req, res));
router.post('/categories', requirePermission('kpis:manage'), (req, res) => controller.createCategory(req, res));

router.get('/', requirePermission('kpis:read'), (req, res) => controller.listKPIs(req, res));
router.post('/', requirePermission('kpis:manage'), auditLogMiddleware('CREATE', 'KPI'), (req, res) =>
  controller.createKPI(req, res)
);
router.get('/:id', requirePermission('kpis:read'), (req, res) => controller.getKpiDetails(req, res));
router.post('/:id/results', requirePermission('kpis:update_result'), auditLogMiddleware('UPDATE', 'KPIResult'), (req, res) =>
  controller.recordResult(req, res)
);

export default router;
