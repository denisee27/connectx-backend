import { Router } from 'express';
import profilingController from './profiling.controller.js';
import { validate } from "../../middleware/validate.middleware.js";
import { temporaryUserSchema } from './profiling.validation.js';

const router = Router();

router.post('/', validate(temporaryUserSchema), profilingController.createTemporaryUser);
router.get('/questions', profilingController.getQuestions);
router.get('/categories', profilingController.getCategories);

export { router as profilingRouter };
