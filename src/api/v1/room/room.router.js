import { Router } from 'express';
import multer from 'multer';
import roomController from './room.controller.js';
import { authMiddleware } from '../../../infra/security/auth.middleware.js';


const router = Router();

// Multer setup: use memory storage so we can compress before saving
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
});

router.get('/highlights', roomController.getHighlights);
router.get('/image/:filename', roomController.getImage);
router.get('/popular', roomController.getPopular);
router.get('/:slug', roomController.getRoomBySlug);
router.get('/', roomController.getRooms);
router.post('/create', authMiddleware, upload.single('imageFile'), roomController.createRoom);

export { router as roomRouter };
