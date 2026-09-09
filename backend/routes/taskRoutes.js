// 공고와 분리된 체크리스트 수정/삭제 라우트를 선언합니다.
import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as taskController from "../controllers/taskController.js";

const router = express.Router();

router.patch("/:id", asyncHandler(taskController.updateTask));
router.delete("/:id", asyncHandler(taskController.deleteTask));

export default router;
