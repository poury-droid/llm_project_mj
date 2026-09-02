import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { upload } from "../middleware/upload.js";
import * as analysisController from "../controllers/analysisController.js";

const router = express.Router();

router.post("/file", upload.single("file"), asyncHandler(analysisController.analyzeFile));
router.post("/job-posting", upload.single("file"), asyncHandler(analysisController.analyzeJobPosting));
router.post("/interview-notice", upload.single("file"), asyncHandler(analysisController.analyzeInterviewNotice));

export default router;
