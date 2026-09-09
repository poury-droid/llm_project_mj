// 대시보드 요약 데이터를 조회하는 라우트를 선언합니다.
import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getDashboard } from "../controllers/dashboardController.js";

const router = express.Router();
router.get("/", asyncHandler(getDashboard));
export default router;
