import { Router } from "express";
import { getState, resetDemo } from "../controllers/ledger.controller.js";

const router = Router();
router.get("/", getState);
router.post("/reset", resetDemo);
export default router;