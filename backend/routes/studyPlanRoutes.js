import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as studyPlanController from "../controllers/studyPlanController.js";

const router = express.Router();

router.get("/", asyncHandler(studyPlanController.listStudyPlans));
router.post("/personal", asyncHandler(studyPlanController.createPersonalStudyPlan));
router.get("/:id", asyncHandler(studyPlanController.getStudyPlanById));
router.patch("/:id", asyncHandler(studyPlanController.updateStudyPlan));
router.post("/:id/rebalance", asyncHandler(studyPlanController.rebalanceStudyPlan));
router.delete("/:id", asyncHandler(studyPlanController.deleteStudyPlan));

export default router;
