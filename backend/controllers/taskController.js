import * as applicationRepo from "../repositories/applicationRepository.js";
import * as taskRepo from "../repositories/taskRepository.js";
import * as studyPlanRepo from "../repositories/studyPlanRepository.js";
import { calculateProgress } from "../services/studyPlanService.js";

export async function getTasks(req, res) {
  const application = await applicationRepo.findApplicationById(req.user.id, req.params.id);
  if (!application) return res.status(404).json({ message: "지원 공고를 찾을 수 없습니다." });
  const tasks = await taskRepo.findTasksByApplicationId(req.user.id, req.params.id);
  res.json(tasks);
}

export async function createTask(req, res) {
  const application = await applicationRepo.findApplicationById(req.user.id, req.params.id);
  if (!application) return res.status(404).json({ message: "지원 공고를 찾을 수 없습니다." });
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
  const saved = await taskRepo.createTask(req.user.id, task);
  res.status(201).json(saved);
}

export async function updateTask(req, res) {
  const updated = await taskRepo.updateTask(req.user.id, req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: "체크리스트를 찾을 수 없습니다." });
  res.json(updated);
}

export async function deleteTask(req, res) {
  const deleted = await taskRepo.deleteTask(req.user.id, req.params.id);
  if (!deleted) return res.status(404).json({ message: "체크리스트를 찾을 수 없습니다." });
  res.status(204).send();
}

export async function updateStudyTask(req, res) {
  const plans = await studyPlanRepo.findAllStudyPlans(req.user.id);
  const plan = plans.find((candidate) => (candidate.days || []).some((day) => (day.blocks || []).some((block) => block.id === req.params.id)));
  if (!plan) return res.status(404).json({ message: "공부 항목을 찾을 수 없습니다." });

  const days = plan.days.map((day) => ({
    ...day,
    blocks: (day.blocks || []).map((block) => block.id === req.params.id ? { ...block, ...req.body } : block)
  }));
  const updated = await studyPlanRepo.updateStudyPlan(req.user.id, plan.id, { days, progress: calculateProgress({ ...plan, days }) });
  res.json(updated);
}

export async function deleteStudyTask(req, res) {
  const plans = await studyPlanRepo.findAllStudyPlans(req.user.id);
  const plan = plans.find((candidate) => (candidate.days || []).some((day) => (day.blocks || []).some((block) => block.id === req.params.id)));
  if (!plan) return res.status(404).json({ message: "공부 항목을 찾을 수 없습니다." });
  const days = plan.days.map((day) => ({ ...day, blocks: (day.blocks || []).filter((block) => block.id !== req.params.id) }));
  const updated = await studyPlanRepo.updateStudyPlan(req.user.id, plan.id, { days, progress: calculateProgress({ ...plan, days }) });
  res.json(updated);
}
