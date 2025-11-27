import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import categoryController from './category.controller.js';

const router = Router();

router.get("/", categoryController.getCategories);
router.get("/:slug", categoryController.getCategoryBySlug);

export { router as categoryRouter };
