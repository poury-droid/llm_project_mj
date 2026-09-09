import { query } from "../db/pool.js";

function toStudyPlan(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type || "application",
    applicationId: row.application_id,
    personalExamId: row.personal_exam_id,
    examName: row.exam_name || "",
    examDate: row.exam_date,
    target: row.target || "",
    currentLevel: row.current_level || "",
    weekdayHours: row.weekday_hours,
    weekendHours: row.weekend_hours,
    subjects: row.subjects || [],
    availableDays: row.available_days || [],
    excludedDates: row.excluded_dates || [],
    phaseMode: row.phase_mode || "auto",
    manualPhases: row.manual_phases || [],
    days: row.days || [],
    progress: row.progress || { total: 0, done: 0, percent: 0, bySubject: {} },
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

const columnByField = {
  type: "type",
  applicationId: "application_id",
  personalExamId: "personal_exam_id",
  examName: "exam_name",
  examDate: "exam_date",
  target: "target",
  currentLevel: "current_level",
  weekdayHours: "weekday_hours",
  weekendHours: "weekend_hours",
  subjects: "subjects",
  availableDays: "available_days",
  excludedDates: "excluded_dates",
  phaseMode: "phase_mode",
  manualPhases: "manual_phases",
  days: "days",
  progress: "progress",
  updatedAt: "updated_at"
};

const jsonFields = new Set(["subjects", "availableDays", "excludedDates", "manualPhases", "days", "progress"]);

export async function findStudyPlanById(id) {
  const result = await query("SELECT * FROM study_plans WHERE id = $1", [id]);
  return toStudyPlan(result.rows[0]);
}

export async function findStudyPlanByApplicationId(applicationId) {
  const result = await query("SELECT * FROM study_plans WHERE application_id = $1", [applicationId]);
  return toStudyPlan(result.rows[0]);
}

export async function findStudyPlanByPersonalExamId(personalExamId) {
  const result = await query("SELECT * FROM study_plans WHERE personal_exam_id = $1", [personalExamId]);
  return toStudyPlan(result.rows[0]);
}

export async function findAllStudyPlans() {
  const result = await query("SELECT * FROM study_plans ORDER BY exam_date ASC, created_at ASC");
  return result.rows.map(toStudyPlan);
}

export async function replaceStudyPlan(applicationId, plan) {
  return upsertStudyPlan({ ...plan, applicationId });
}

export async function upsertStudyPlan(plan) {
  const result = await query(
    `
      INSERT INTO study_plans (
        id, type, application_id, personal_exam_id, exam_name, exam_date, target, current_level,
        weekday_hours, weekend_hours, subjects, available_days, excluded_dates,
        phase_mode, manual_phases, days, progress, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13::jsonb, $14, $15::jsonb, $16::jsonb, $17::jsonb, $18, $19)
      ON CONFLICT (id) DO UPDATE SET
        type = EXCLUDED.type,
        application_id = EXCLUDED.application_id,
        personal_exam_id = EXCLUDED.personal_exam_id,
        exam_name = EXCLUDED.exam_name,
        exam_date = EXCLUDED.exam_date,
        target = EXCLUDED.target,
        current_level = EXCLUDED.current_level,
        weekday_hours = EXCLUDED.weekday_hours,
        weekend_hours = EXCLUDED.weekend_hours,
        subjects = EXCLUDED.subjects,
        available_days = EXCLUDED.available_days,
        excluded_dates = EXCLUDED.excluded_dates,
        phase_mode = EXCLUDED.phase_mode,
        manual_phases = EXCLUDED.manual_phases,
        days = EXCLUDED.days,
        progress = EXCLUDED.progress,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `,
    [
      plan.id,
      plan.type || "application",
      plan.applicationId || null,
      plan.personalExamId || null,
      plan.examName || "",
      plan.examDate || "",
      plan.target || "",
      plan.currentLevel || "",
      Number(plan.weekdayHours || 0),
      Number(plan.weekendHours || 0),
      JSON.stringify(plan.subjects || []),
      JSON.stringify(plan.availableDays || []),
      JSON.stringify(plan.excludedDates || []),
      plan.phaseMode || "auto",
      JSON.stringify(plan.manualPhases || []),
      JSON.stringify(plan.days || []),
      JSON.stringify(plan.progress || { total: 0, done: 0, percent: 0, bySubject: {} }),
      plan.createdAt || new Date().toISOString(),
      plan.updatedAt || new Date().toISOString()
    ]
  );
  return toStudyPlan(result.rows[0]);
}

export async function upsertApplicationStudyPlan(applicationId, plan) {
  const existing = await findStudyPlanByApplicationId(applicationId);
  return upsertStudyPlan({ ...plan, id: existing?.id || plan.id, type: "application", applicationId });
}

export async function updateStudyPlan(idOrApplicationId, updates) {
  const existing = await findStudyPlanById(idOrApplicationId) || await findStudyPlanByApplicationId(idOrApplicationId);
  if (!existing) return null;

  const nextUpdates = { ...updates, updatedAt: new Date().toISOString() };
  const entries = Object.entries(nextUpdates).filter(([key]) => columnByField[key]);
  if (!entries.length) return existing;

  const sets = entries.map(([key], index) => {
    const cast = jsonFields.has(key) ? "::jsonb" : "";
    return `${columnByField[key]} = $${index + 2}${cast}`;
  });
  const values = entries.map(([key, value]) => (jsonFields.has(key) ? JSON.stringify(value || (key === "progress" ? {} : [])) : value));
  const result = await query(
    `UPDATE study_plans SET ${sets.join(", ")} WHERE id = $1 RETURNING *`,
    [existing.id, ...values]
  );
  return toStudyPlan(result.rows[0]);
}

export async function deleteStudyPlan(idOrApplicationId) {
  const existing = await findStudyPlanById(idOrApplicationId) || await findStudyPlanByApplicationId(idOrApplicationId);
  if (!existing) return;
  await query("DELETE FROM study_plans WHERE id = $1", [existing.id]);
}
