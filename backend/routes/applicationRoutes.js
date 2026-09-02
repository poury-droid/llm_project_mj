import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validateApplication, validateStudyPlan, validateTask } from "../middleware/validate.js";
import * as applicationController from "../controllers/applicationController.js";
import * as taskController from "../controllers/taskController.js";
import * as studyPlanController from "../controllers/studyPlanController.js";

const router = express.Router();

router.get("/", asyncHandler(applicationController.getApplications));
router.post("/", validateApplication, asyncHandler(applicationController.createApplication));
router.get("/:id", asyncHandler(applicationController.getApplication));
router.put("/:id", validateApplication, asyncHandler(applicationController.updateApplication));
router.delete("/:id", asyncHandler(applicationController.deleteApplication));
router.post("/:id/stage-checklist", asyncHandler(applicationController.addStageChecklist));

router.get("/:id/tasks", asyncHandler(taskController.getTasks));
router.post("/:id/tasks", validateTask, asyncHandler(taskController.createTask));

router.get("/:id/study-plan", asyncHandler(studyPlanController.getStudyPlan));
router.post("/:id/study-plan", validateStudyPlan, asyncHandler(studyPlanController.createStudyPlan));
router.patch("/:id/study-plan", asyncHandler(studyPlanController.updateStudyPlan));
router.delete("/:id/study-plan", asyncHandler(studyPlanController.deleteStudyPlan));

export default router;
