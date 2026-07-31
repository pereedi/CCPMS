import { Router } from 'express';
import { NotificationsController } from './notifications.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const controller = new NotificationsController();

router.use(authMiddleware);

router.get('/', (req, res) => controller.getUserNotifications(req, res));
router.put('/:id/read', (req, res) => controller.markAsRead(req, res));
router.put('/read-all', (req, res) => controller.markAllAsRead(req, res));

export default router;
