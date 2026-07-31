import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole, requirePermission } from '../middleware/rbac.middleware';
import { auditLogMiddleware } from '../middleware/audit.middleware';

const router = Router();
const controller = new ReportsController();

router.use(authMiddleware);

router.get('/', requirePermission('reports:read'), (req, res) => controller.listReports(req, res));
router.post('/', requirePermission('reports:create'), auditLogMiddleware('CREATE', 'Report'), (req, res) =>
  controller.createReport(req, res)
);
router.get('/:id', requirePermission('reports:read'), (req, res) => controller.getReportById(req, res));
router.put('/:id', auditLogMiddleware('UPDATE', 'ReportUpdate'), (req, res) => controller.updateReport(req, res));
router.post('/:id/submit', requirePermission('reports:create'), auditLogMiddleware('UPDATE', 'ReportSubmit'), (req, res) =>
  controller.submitReport(req, res)
);
router.post('/:id/review', requireRole('DIRECTOR', 'SUPER_ADMIN'), auditLogMiddleware('APPROVAL', 'ReportReview'), (req, res) =>
  controller.reviewReport(req, res)
);
router.post('/:id/approve', requireRole('DIRECTOR', 'SUPER_ADMIN'), auditLogMiddleware('APPROVAL', 'ReportDirectorApproval'), (req, res) =>
  controller.approveReport(req, res)
);

export default router;
