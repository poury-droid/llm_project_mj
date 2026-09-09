// 지원 공고와 하위 체크리스트/학습계획 API의 URL과 HTTP 메서드를 선언합니다.
import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validateApplication, validateStudyPlan, validateTask } from "../middleware/validate.js";
import * as applicationController from "../controllers/applicationController.js";
import * as taskController from "../controllers/taskController.js";
import * as studyPlanController from "../controllers/studyPlanController.js";

const router = express.Router();

// 지원 공고와 공고에 종속된 할 일/학습 계획 API를 한 라우터에서 관리합니다.
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
