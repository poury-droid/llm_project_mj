import * as applicationRepo from "../repositories/applicationRepository.js";
import * as taskRepo from "../repositories/taskRepository.js";
import * as studyRepo from "../repositories/studyPlanRepository.js";
import { buildStageChecklist } from "../services/checklistService.js";

export async function getApplications(req, res) {
  const applications = await applicationRepo.findAllApplications();
  res.json(applications);
}

export async function getApplication(req, res) {
  const application = await applicationRepo.findApplicationById(req.params.id);
  if (!application) return res.status(404).json({ message: "지원 공고를 찾을 수 없습니다." });
  const tasks = await taskRepo.findTasksByApplicationId(req.params.id);
  const studyPlan = await studyRepo.findStudyPlanByApplicationId(req.params.id);
  res.json({ ...application, tasks, studyPlan });
}

export async function createApplication(req, res) {
  const now = new Date().toISOString();
  const application = {
    id: crypto.randomUUID(),
    company: req.body.company,
    position: req.body.position,
    title: req.body.title,
    deadline: req.body.deadline,
    stage: req.body.stage,
    pdfFileName: req.body.pdfFileName || "",
    memo: req.body.memo || "",
    writtenTestDate: req.body.writtenTestDate || "",
    interviewDate: req.body.interviewDate || "",
    replyDeadline: req.body.replyDeadline || "",
    location: req.body.location || "",
    subjects: req.body.subjects || [],
    requiredDocuments: req.body.requiredDocuments || [],
    createdAt: now,
    updatedAt: now
  };
  const saved = await applicationRepo.createApplication(application);
  res.status(201).json(saved);
}

export async function updateApplication(req, res) {
  const existing = await applicationRepo.findApplicationById(req.params.id);
  if (!existing) return res.status(404).json({ message: "지원 공고를 찾을 수 없습니다." });
  const updated = await applicationRepo.updateApplication(req.params.id, {
    ...req.body,
    updatedAt: new Date().toISOString()
  });
  res.json(updated);
}

export async function deleteApplication(req, res) {
  const deleted = await applicationRepo.deleteApplication(req.params.id);
  if (!deleted) return res.status(404).json({ message: "지원 공고를 찾을 수 없습니다." });
  res.status(204).send();
}

export async function addStageChecklist(req, res) {
  const application = await applicationRepo.findApplicationById(req.params.id);
  if (!application) return res.status(404).json({ message: "지원 공고를 찾을 수 없습니다." });
  const existingTasks = await taskRepo.findTasksByApplicationId(req.params.id);
  const tasks = buildStageChecklist(application.stage, application.id, existingTasks, application.deadline);
  const saved = [];
  for (const task of tasks) saved.push(await taskRepo.createTask(task));
  res.status(201).json(saved);
}
