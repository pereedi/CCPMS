import { Router } from 'express';
import { ProjectsController } from './projects.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { auditLogMiddleware } from '../middleware/audit.middleware';

const router = Router();
const controller = new ProjectsController();

router.use(authMiddleware);

router.get('/', requirePermission('projects:read'), (req, res) => controller.listProjects(req, res));
router.post('/', requirePermission('projects:manage'), auditLogMiddleware('CREATE', 'Project'), (req, res) =>
  controller.createProject(req, res)
);
router.get('/:id', requirePermission('projects:read'), (req, res) => controller.getProjectById(req, res));
router.put('/:id', requirePermission('projects:manage'), auditLogMiddleware('UPDATE', 'Project'), (req, res) =>
  controller.updateProject(req, res)
);
router.post('/:id/milestones', requirePermission('projects:manage'), (req, res) => controller.addMilestone(req, res));
router.post('/:id/tasks', requirePermission('projects:manage'), (req, res) => controller.addTask(req, res));

export default router;
