import { Router } from "express";
import { chat } from "../controllers/chat.controller.js";
import { validatePrompt } from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../middlewares/error.middleware.js";

const router = Router();
router.post("/", validatePrompt, asyncHandler(chat));
export default router;