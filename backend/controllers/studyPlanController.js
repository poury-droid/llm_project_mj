import { generateStudyPlan } from "../services/studyPlanService.js";
import * as studyRepo from "../repositories/studyPlanRepository.js";

export async function getStudyPlan(req, res) {
  const plan = await studyRepo.findStudyPlanByApplicationId(req.params.id);
  res.json(plan);
}

export async function createStudyPlan(req, res) {
  const plan = generateStudyPlan({ applicationId: req.params.id, ...req.body });
  const saved = await studyRepo.replaceStudyPlan(req.params.id, plan);
  res.status(201).json(saved);
}

export async function deleteStudyPlan(req, res) {
  await studyRepo.deleteStudyPlan(req.params.id);
  res.status(204).send();
}

export async function updateStudyPlan(req, res) {
  const updated = await studyRepo.updateStudyPlan(req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: "공부계획을 찾을 수 없습니다." });
  res.json(updated);
}
