// Express 애플리케이션의 진입점입니다. 공통 미들웨어와 API 라우트를 조립합니다.
import "./config/env.js";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import applicationRoutes from "./routes/applicationRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import analysisRoutes from "./routes/analysisRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import studyPlanRoutes from "./routes/studyPlanRoutes.js";
import credentialRoutes from "./routes/credentialRoutes.js";
import * as taskController from "./controllers/taskController.js";
import { asyncHandler } from "./middleware/asyncHandler.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.join(__dirname, "..", "frontend", "dist");

// React 개발 서버나 다른 기기에서 API를 호출할 수 있도록 CORS를 허용합니다.
// cors() 미들웨어는 다른 출처에서 백엔드 API를 호출할 수 있도록 응답 헤더를 설정합니다.
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:4173,https://*.vercel.app")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
if (process.env.VERCEL_URL) allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
const localDevOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;

function isAllowedOrigin(origin) {
  return allowedOrigins.some((allowedOrigin) => {
    if (allowedOrigin === origin) return true;
    if (!allowedOrigin.includes("*")) return false;
    const pattern = new RegExp(`^${allowedOrigin.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`);
    return pattern.test(origin);
  });
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || isAllowedOrigin(origin)) return callback(null, true);
    if (process.env.NODE_ENV !== "production" && localDevOriginPattern.test(origin)) return callback(null, true);
    return callback(new Error("CORS origin is not allowed"));
  },
  credentials: true
}));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "job-process-assistant" });
});

app.use("/api/auth", authRoutes);

app.use("/api", requireAuth);

app.patch("/api/study-tasks/:id", asyncHandler(taskController.updateStudyTask));
app.delete("/api/study-tasks/:id", asyncHandler(taskController.deleteStudyTask));

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/analyze", analysisRoutes);
app.use("/api/study-plans", studyPlanRoutes);
app.use("/api/credentials", credentialRoutes);

// frontend/dist가 있으면 Express가 React 화면까지 같이 제공합니다.
// 이제 http://localhost:4000 하나만 열어도 화면과 API를 모두 사용할 수 있습니다.
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
