import { Router } from 'express';
import { UsersController } from './users.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole, requirePermission } from '../middleware/rbac.middleware';
import { auditLogMiddleware } from '../middleware/audit.middleware';

const router = Router();
const usersController = new UsersController();

router.use(authMiddleware);

router.get('/', requirePermission('users:read'), (req, res) => usersController.listUsers(req, res));
router.get('/roles', (req, res) => usersController.listRoles(req, res));
router.get('/:id', requirePermission('users:read'), (req, res) => usersController.getUserById(req, res));
router.put('/:id', requireRole('SUPER_ADMIN'), auditLogMiddleware('UPDATE', 'User'), (req, res) =>
  usersController.updateUser(req, res)
);

export default router;
