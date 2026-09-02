import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getDashboard } from "../controllers/dashboardController.js";

const router = express.Router();
router.get("/", asyncHandler(getDashboard));
export default router;
