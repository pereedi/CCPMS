import { Router } from 'express';
import { DirectoratesController } from './directorates.controller';
import { authMiddleware, requireAuth } from '../middleware/auth.middleware';

const router = Router();
const controller = new DirectoratesController();

router.use(authMiddleware);

router.get('/',    requireAuth, (req: any, res) => controller.listDirectorates(req, res));
router.get('/:id', requireAuth, (req: any, res) => controller.getDirectorateById(req, res));

export default router;
