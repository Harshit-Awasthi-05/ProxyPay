import { Router } from "express";
import { approve } from "../controllers/approve.controller.js";
import { asyncHandler } from "../middlewares/error.middleware.js";

const router = Router();
router.post("/", asyncHandler(approve));
export default router;