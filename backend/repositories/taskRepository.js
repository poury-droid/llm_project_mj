import { query } from "../db/pool.js";

function toTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    applicationId: row.application_id,
    title: row.title,
    category: row.category,
    dueDate: row.due_date,
    completed: row.completed,
    priority: row.priority,
    createdAt: row.created_at
  };
}

const columnByField = {
  applicationId: "application_id",
  title: "title",
  category: "category",
  dueDate: "due_date",
  completed: "completed",
  priority: "priority"
};

export async function findTasksByApplicationId(userId, applicationId) {
  const result = await query(
    "SELECT * FROM tasks WHERE user_id = $1 AND application_id = $2 ORDER BY created_at ASC",
    [userId, applicationId]
  );
  return result.rows.map(toTask);
}

export async function findAllTasks(userId) {
  const result = await query("SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at ASC", [userId]);
  return result.rows.map(toTask);
}

export async function createTask(userId, task) {
  const result = await query(
    `
      INSERT INTO tasks (id, user_id, application_id, title, category, due_date, completed, priority, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
    [
      task.id,
      userId,
      task.applicationId,
      task.title || "",
      task.category || "",
      task.dueDate || "",
      Boolean(task.completed),
      task.priority || "normal",
      task.createdAt
    ]
  );
  return toTask(result.rows[0]);
}

export async function updateTask(userId, id, updates) {
  const entries = Object.entries(updates).filter(([key]) => columnByField[key]);
  if (entries.length === 0) {
    const result = await query("SELECT * FROM tasks WHERE user_id = $1 AND id = $2", [userId, id]);
    return toTask(result.rows[0]);
  }

  const sets = entries.map(([key], index) => `${columnByField[key]} = $${index + 3}`);
  const values = entries.map(([, value]) => value);
  const result = await query(
    `UPDATE tasks SET ${sets.join(", ")} WHERE user_id = $1 AND id = $2 RETURNING *`,
    [userId, id, ...values]
  );
  return toTask(result.rows[0]);
}

export async function deleteTask(userId, id) {
  const result = await query("DELETE FROM tasks WHERE user_id = $1 AND id = $2", [userId, id]);
  return result.rowCount > 0;
}
