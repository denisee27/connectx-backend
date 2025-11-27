import express from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { authMiddleware } from "../../../infra/security/auth.middleware.js";
import { authLimiter } from "../../middleware/ratelimit.middleware.js";
import conversationController from "./conversation.controller.js";
import { chattingSchema } from "./conversation.validator.js";

const router = express.Router();
// router.use(authMiddleware);

//create a conversation
router.post("/", authMiddleware, conversationController.create);

// Chatting wraper
router.post("/:id", authMiddleware, validate(chattingSchema), conversationController.chatting);

export { router as conversationRouter };
