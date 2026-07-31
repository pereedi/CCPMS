import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

router.post('/kingschat', (req, res) => authController.loginWithKingsChat(req, res));
router.post('/refresh', (req, res) => authController.refreshToken(req, res));
router.get('/me', authMiddleware, (req, res) => authController.getMe(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));

export default router;
