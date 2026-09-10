// 인증 관련 공개 API와 인증 상태 확인 API의 URL을 정의합니다.
import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, readSessionToken } from "../middleware/auth.js";
import * as authController from "../controllers/authController.js";

const router = express.Router();
router.post("/register", asyncHandler(authController.register));
router.post("/login", asyncHandler(authController.login));
router.post("/reset-password", asyncHandler(authController.resetPassword));
router.get("/me", requireAuth, authController.me);
router.post("/logout", (req, res, next) => {
  req.sessionToken = readSessionToken(req);
  next();
}, asyncHandler(authController.logout));

export default router;
