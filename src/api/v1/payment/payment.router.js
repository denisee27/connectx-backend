import { Router } from "express";
import paymentController from "./payment.controller.js";
import { validate } from "../../middleware/validate.middleware.js";
import { authMiddleware } from "../../../infra/security/auth.middleware.js";
import { createPaymentSchema, getPaymentStatusSchema } from "./payment.validation.js";

const router = Router();

router.post("/", authMiddleware, validate(createPaymentSchema), paymentController.createPayment);
router.get(
  "/:orderId/status",
  authMiddleware,
  validate(getPaymentStatusSchema),
  paymentController.getPaymentStatus
);

// Webhook must remain unauthenticated; signature is verified inside the controller/service
router.post("/webhook/midtrans", paymentController.handleMidtransWebhook);

export { router as paymentRouter };
