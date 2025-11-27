import { Router } from 'express';
import roomController from './room.controller.js';


const router = Router();

router.get('/highlights', roomController.getHighlights);
router.get('/image/:filename', roomController.getImage);
router.get('/popular', roomController.getPopular);
router.get('/:slug', roomController.getRoomBySlug);
router.get('/', roomController.getRooms);

export { router as roomRouter };
