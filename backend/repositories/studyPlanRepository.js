import { readDb, writeDb } from "./jsonRepository.js";

export async function findStudyPlanByApplicationId(applicationId) {
  const db = await readDb();
  return db.studyPlans.find((plan) => plan.applicationId === applicationId) || null;
}

export async function replaceStudyPlan(applicationId, plan) {
  const db = await readDb();
  db.studyPlans = db.studyPlans.filter((item) => item.applicationId !== applicationId);
  db.studyPlans.push(plan);
  await writeDb(db);
  return plan;
}

export async function updateStudyPlan(applicationId, updates) {
  const db = await readDb();
  const index = db.studyPlans.findIndex((item) => item.applicationId === applicationId);
  if (index === -1) return null;
  db.studyPlans[index] = { ...db.studyPlans[index], ...updates, updatedAt: new Date().toISOString() };
  await writeDb(db);
  return db.studyPlans[index];
}

export async function deleteStudyPlan(applicationId) {
  const db = await readDb();
  db.studyPlans = db.studyPlans.filter((item) => item.applicationId !== applicationId);
  await writeDb(db);
}
