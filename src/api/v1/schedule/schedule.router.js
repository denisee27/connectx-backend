import { Router } from 'express';
import scheduleController from './schedule.controller.js';
import { authMiddleware } from '../../../infra/security/auth.middleware.js';

const router = Router();

router.get('/upcoming', authMiddleware, scheduleController.getUpcoming);
router.get('/past', authMiddleware, scheduleController.getPast);

export { router as scheduleRouter };
