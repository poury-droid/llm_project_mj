// tasks 테이블에 대한 조회/생성/수정/삭제 SQL을 캡슐화합니다.
import { query } from "../db/pool.js";

// DB 컬럼명(application_id, due_date)을 프론트엔드 데이터 형식으로 바꿉니다.
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

export async function findTasksByApplicationId(applicationId) {
  const result = await query(
    "SELECT * FROM tasks WHERE application_id = $1 ORDER BY created_at ASC",
    [applicationId]
  );
  return result.rows.map(toTask);
}

export async function findAllTasks() {
  const result = await query("SELECT * FROM tasks ORDER BY created_at ASC");
  return result.rows.map(toTask);
}

export async function createTask(task) {
  const result = await query(
    `
      INSERT INTO tasks (id, application_id, title, category, due_date, completed, priority, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
    [
      task.id,
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

export async function updateTask(id, updates) {
  // 수정 가능한 필드 목록을 제한하고, 값은 파라미터 바인딩으로 전달합니다.
  const entries = Object.entries(updates).filter(([key]) => columnByField[key]);
  if (entries.length === 0) {
    const result = await query("SELECT * FROM tasks WHERE id = $1", [id]);
    return toTask(result.rows[0]);
  }

  const sets = entries.map(([key], index) => `${columnByField[key]} = $${index + 2}`);
  const values = entries.map(([, value]) => value);
  const result = await query(`UPDATE tasks SET ${sets.join(", ")} WHERE id = $1 RETURNING *`, [id, ...values]);
  return toTask(result.rows[0]);
}

export async function deleteTask(id) {
  const result = await query("DELETE FROM tasks WHERE id = $1", [id]);
  return result.rowCount > 0;
}
