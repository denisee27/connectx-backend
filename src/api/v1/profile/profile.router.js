import { Router } from 'express';
import profileController from './profile.controller.js';

import { validate } from "../../middleware/validate.middleware.js";
import { updateProfileSchema } from './profile.validation.js';
import { authMiddleware } from '../../../infra/security/auth.middleware.js';


const router = Router();

router.get('/', authMiddleware, profileController.getProfile);
router.put('/update', validate(updateProfileSchema), profileController.updateProfile);

export { router as profileRouter };
