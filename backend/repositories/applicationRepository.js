import { readDb, writeDb } from "./jsonRepository.js";

export async function findAllApplications() {
  const db = await readDb();
  return db.applications;
}

export async function findApplicationById(id) {
  const db = await readDb();
  return db.applications.find((item) => item.id === id) || null;
}

export async function createApplication(application) {
  const db = await readDb();
  db.applications.push(application);
  await writeDb(db);
  return application;
}

export async function updateApplication(id, updates) {
  const db = await readDb();
  const index = db.applications.findIndex((item) => item.id === id);
  if (index === -1) return null;
  db.applications[index] = { ...db.applications[index], ...updates };
  await writeDb(db);
  return db.applications[index];
}

export async function deleteApplication(id) {
  const db = await readDb();
  const exists = db.applications.some((item) => item.id === id);
  if (!exists) return false;
  db.applications = db.applications.filter((item) => item.id !== id);
  db.tasks = db.tasks.filter((task) => task.applicationId !== id);
  db.studyPlans = db.studyPlans.filter((plan) => plan.applicationId !== id);
  await writeDb(db);
  return true;
}
