import { readDb, writeDb } from "./jsonRepository.js";

export async function findTasksByApplicationId(applicationId) {
  const db = await readDb();
  return db.tasks.filter((task) => task.applicationId === applicationId);
}

export async function findAllTasks() {
  const db = await readDb();
  return db.tasks;
}

export async function createTask(task) {
  const db = await readDb();
  db.tasks.push(task);
  await writeDb(db);
  return task;
}

export async function updateTask(id, updates) {
  const db = await readDb();
  const index = db.tasks.findIndex((task) => task.id === id);
  if (index === -1) return null;
  db.tasks[index] = { ...db.tasks[index], ...updates };
  await writeDb(db);
  return db.tasks[index];
}

export async function deleteTask(id) {
  const db = await readDb();
  const exists = db.tasks.some((task) => task.id === id);
  if (!exists) return false;
  db.tasks = db.tasks.filter((task) => task.id !== id);
  await writeDb(db);
  return true;
}
