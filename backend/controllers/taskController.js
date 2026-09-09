// 지원 공고에 속한 체크리스트의 생성, 조회, 수정, 삭제를 처리합니다.
import * as taskRepo from "../repositories/taskRepository.js";
import * as studyPlanRepo from "../repositories/studyPlanRepository.js";
import { calculateProgress } from "../services/studyPlanService.js";

export async function getTasks(req, res) {
  const tasks = await taskRepo.findTasksByApplicationId(req.params.id);
  res.json(tasks);
}

export async function createTask(req, res) {
  const task = {
    id: crypto.randomUUID(),
    applicationId: req.params.id,
    title: req.body.title,
    category: req.body.category || "사용자정의",
    dueDate: req.body.dueDate || "",
    completed: Boolean(req.body.completed),
    priority: req.body.priority || "normal",
    createdAt: new Date().toISOString()
  };
  const saved = await taskRepo.createTask(task);
  res.status(201).json(saved);
}

export async function updateTask(req, res) {
  const updated = await taskRepo.updateTask(req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: "체크리스트를 찾을 수 없습니다." });
  res.json(updated);
}

export async function deleteTask(req, res) {
  const deleted = await taskRepo.deleteTask(req.params.id);
  if (!deleted) return res.status(404).json({ message: "체크리스트를 찾을 수 없습니다." });
  res.status(204).send();
}

// 공부계획의 날짜별 block을 StudyTask처럼 개별 저장합니다.
export async function updateStudyTask(req, res) {
  const plans = await studyPlanRepo.findAllStudyPlans();
  const plan = plans.find((candidate) => (candidate.days || []).some((day) => (day.blocks || []).some((block) => block.id === req.params.id)));
  if (!plan) return res.status(404).json({ message: "공부 항목을 찾을 수 없습니다." });

  const days = plan.days.map((day) => ({
    ...day,
    blocks: (day.blocks || []).map((block) => block.id === req.params.id ? { ...block, ...req.body } : block)
  }));
  const updated = await studyPlanRepo.updateStudyPlan(plan.id, { days, progress: calculateProgress({ ...plan, days }) });
  res.json(updated);
}

export async function deleteStudyTask(req, res) {
  const plans = await studyPlanRepo.findAllStudyPlans();
  const plan = plans.find((candidate) => (candidate.days || []).some((day) => (day.blocks || []).some((block) => block.id === req.params.id)));
  if (!plan) return res.status(404).json({ message: "공부 항목을 찾을 수 없습니다." });
  const days = plan.days.map((day) => ({ ...day, blocks: (day.blocks || []).filter((block) => block.id !== req.params.id) }));
  const updated = await studyPlanRepo.updateStudyPlan(plan.id, { days, progress: calculateProgress({ ...plan, days }) });
  res.json(updated);
}
