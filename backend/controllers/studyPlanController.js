import { calculateProgress, generateStudyPlan, rebalanceIncompletePlan } from "../services/studyPlanService.js";
import * as studyRepo from "../repositories/studyPlanRepository.js";
import * as applicationRepo from "../repositories/applicationRepository.js";

function summarizePlan(plan, application = null) {
  const progress = calculateProgress(plan);
  return {
    ...plan,
    progress,
    company: application?.company || "",
    position: application?.position || "",
    title: application?.title || "",
    subjectsText: (plan.subjects || []).map((subject) => subject.name || subject).join(" / ")
  };
}

export async function listStudyPlans(req, res) {
  const [plans, applications] = await Promise.all([
    studyRepo.findAllStudyPlans(),
    applicationRepo.findAllApplications()
  ]);
  const applicationById = new Map(applications.map((application) => [application.id, application]));
  res.json(plans.map((plan) => summarizePlan(plan, applicationById.get(plan.applicationId))));
}

export async function getStudyPlanById(req, res) {
  const plan = await studyRepo.findStudyPlanById(req.params.id);
  if (!plan) return res.status(404).json({ message: "공부계획을 찾을 수 없습니다." });
  const application = plan.applicationId ? await applicationRepo.findApplicationById(plan.applicationId) : null;
  res.json(summarizePlan(plan, application));
}

export async function createPersonalStudyPlan(req, res) {
  const plan = generateStudyPlan({ ...req.body, type: "personalExam", applicationId: null });
  const saved = await studyRepo.upsertStudyPlan(plan);
  res.status(201).json(saved);
}

export async function getStudyPlan(req, res) {
  const plan = await studyRepo.findStudyPlanByApplicationId(req.params.id);
  res.json(plan);
}

export async function createStudyPlan(req, res) {
  const application = await applicationRepo.findApplicationById(req.params.id);
  if (!application) return res.status(404).json({ message: "지원 공고를 찾을 수 없습니다." });
  const examDate = application.stage === "필기전형" && application.writtenTestDate
    ? application.writtenTestDate.slice(0, 10)
    : req.body.examDate;
  const plan = generateStudyPlan({
    ...req.body,
    type: "application",
    applicationId: req.params.id,
    examName: req.body.examName || `${application.company} 필기시험`,
    examDate
  });
  const saved = await studyRepo.upsertApplicationStudyPlan(req.params.id, plan);
  res.status(201).json(saved);
}

export async function deleteStudyPlan(req, res) {
  await studyRepo.deleteStudyPlan(req.params.id);
  res.status(204).send();
}

export async function updateStudyPlan(req, res) {
  const nextPlan = req.body.days ? { ...req.body, progress: calculateProgress(req.body) } : req.body;
  const updated = await studyRepo.updateStudyPlan(req.params.id, nextPlan);
  if (!updated) return res.status(404).json({ message: "공부계획을 찾을 수 없습니다." });
  res.json(updated);
}

export async function rebalanceStudyPlan(req, res) {
  const plan = await studyRepo.findStudyPlanById(req.params.id) || await studyRepo.findStudyPlanByApplicationId(req.params.id);
  if (!plan) return res.status(404).json({ message: "공부계획을 찾을 수 없습니다." });
  const rebalanced = rebalanceIncompletePlan(plan);
  const saved = await studyRepo.updateStudyPlan(plan.id, rebalanced);
  res.json(saved);
}
