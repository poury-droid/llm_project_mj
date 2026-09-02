import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as taskController from "../controllers/taskController.js";

const router = express.Router();

router.patch("/:id", asyncHandler(taskController.updateTask));
router.delete("/:id", asyncHandler(taskController.deleteTask));

export default router;
