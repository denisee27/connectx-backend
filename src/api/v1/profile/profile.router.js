import { Router } from 'express';
import profileController from './profile.controller.js';

import { validate } from "../../middleware/validate.middleware.js";
import { updateProfileSchema } from './profile.validation.js';
import { authMiddleware } from '../../../infra/security/auth.middleware.js';
import multer from 'multer';


const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
});

router.get('/', authMiddleware, profileController.getProfile);
router.get('/:id/temporary', profileController.getTemporaryUser);
router.post('/update', authMiddleware, upload.single('profilePictureUrl'), profileController.updateProfile);


export { router as profileRouter };
