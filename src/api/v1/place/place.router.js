import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { getCitiesByCountryIdSchema } from "./place.validator.js";
import placeController from './place.controller.js';

const router = Router();

router.get("/countries", placeController.getCountries);
router.get("/regions", placeController.getRegions);
router.get("/cities/:countryId", validate(getCitiesByCountryIdSchema), placeController.getCitiesByCountryId);
router.get("/rooms", placeController.getRoomsFromRegion);
router.get("/rooms/:cityId", placeController.getRoomsFromCity);

export { router as placeRouter };
