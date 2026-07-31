import { Router } from 'express';
import { DirectoratesController } from './directorates.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { auditLogMiddleware } from '../middleware/audit.middleware';

const router = Router();
const controller = new DirectoratesController();

router.use(authMiddleware);

router.get('/', (req, res) => controller.listDirectorates(req, res));
router.post('/', requireRole('SUPER_ADMIN'), auditLogMiddleware('CREATE', 'Directorate'), (req, res) =>
  controller.createDirectorate(req, res)
);
router.get('/:id', (req, res) => controller.getDirectorateById(req, res));
router.delete('/:id', auditLogMiddleware('DELETE', 'Directorate'), (req, res) => controller.deleteDirectorate(req, res));
router.post('/departments', requireRole('SUPER_ADMIN', 'DIRECTOR'), auditLogMiddleware('CREATE', 'Department'), (req, res) =>
  controller.createDepartment(req, res)
);

export default router;
