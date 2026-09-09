// 기존 backend/data/db.json의 공고/할 일/학습계획을 PostgreSQL로 이전합니다.
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { ensureDatabase } from "./schema.js";
import { pool, withTransaction } from "./pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "..", "data", "db.json");

async function migrate() {
  // 기존 JSON 파일을 읽어 PostgreSQL로 옮깁니다. 원본 파일은 삭제하지 않습니다.
  const content = await fs.readFile(dbPath, "utf-8");
  const db = JSON.parse(content);

  await ensureDatabase();

  // 지원 공고, 할 일, 학습 계획을 한 트랜잭션으로 처리합니다.
  // 일부만 저장되는 상태를 방지합니다.
  await withTransaction(async (client) => {
    for (const application of db.applications || []) {
      // 같은 id가 있으면 새 데이터로 갱신해 마이그레이션을 여러 번 실행해도 안전합니다.
      await client.query(
        `
          INSERT INTO applications (
            id, company, position, title, deadline, stage, pdf_file_name, memo,
            written_test_date, interview_date, reply_deadline, location,
            subjects, required_documents, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14::jsonb, $15, $16)
          ON CONFLICT (id) DO UPDATE SET
            company = EXCLUDED.company,
            position = EXCLUDED.position,
            title = EXCLUDED.title,
            deadline = EXCLUDED.deadline,
            stage = EXCLUDED.stage,
            pdf_file_name = EXCLUDED.pdf_file_name,
            memo = EXCLUDED.memo,
            written_test_date = EXCLUDED.written_test_date,
            interview_date = EXCLUDED.interview_date,
            reply_deadline = EXCLUDED.reply_deadline,
            location = EXCLUDED.location,
            subjects = EXCLUDED.subjects,
            required_documents = EXCLUDED.required_documents,
            updated_at = EXCLUDED.updated_at
        `,
        [
          application.id,
          application.company || "",
          application.position || "",
          application.title || "",
          application.deadline || "",
          application.stage || "",
          application.pdfFileName || "",
          application.memo || "",
          application.writtenTestDate || "",
          application.interviewDate || "",
          application.replyDeadline || "",
          application.location || "",
          JSON.stringify(application.subjects || []),
          JSON.stringify(application.requiredDocuments || []),
          application.createdAt || new Date().toISOString(),
          application.updatedAt || new Date().toISOString()
        ]
      );
    }

    for (const task of db.tasks || []) {
      await client.query(
        `
          INSERT INTO tasks (id, application_id, title, category, due_date, completed, priority, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET
            application_id = EXCLUDED.application_id,
            title = EXCLUDED.title,
            category = EXCLUDED.category,
            due_date = EXCLUDED.due_date,
            completed = EXCLUDED.completed,
            priority = EXCLUDED.priority
        `,
        [
          task.id,
          task.applicationId,
          task.title || "",
          task.category || "",
          task.dueDate || "",
          Boolean(task.completed),
          task.priority || "normal",
          task.createdAt || new Date().toISOString()
        ]
      );
    }

    for (const plan of db.studyPlans || []) {
      await client.query(
        `
          INSERT INTO study_plans (
            id, application_id, exam_date, weekday_hours, weekend_hours,
            subjects, available_days, excluded_dates, days, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, $10, $11)
          ON CONFLICT (application_id) DO UPDATE SET
            id = EXCLUDED.id,
            exam_date = EXCLUDED.exam_date,
            weekday_hours = EXCLUDED.weekday_hours,
            weekend_hours = EXCLUDED.weekend_hours,
            subjects = EXCLUDED.subjects,
            available_days = EXCLUDED.available_days,
            excluded_dates = EXCLUDED.excluded_dates,
            days = EXCLUDED.days,
            updated_at = EXCLUDED.updated_at
        `,
        [
          plan.id,
          plan.applicationId,
          plan.examDate || "",
          Number(plan.weekdayHours || 0),
          Number(plan.weekendHours || 0),
          JSON.stringify(plan.subjects || []),
          JSON.stringify(plan.availableDays || []),
          JSON.stringify(plan.excludedDates || []),
          JSON.stringify(plan.days || []),
          plan.createdAt || new Date().toISOString(),
          plan.updatedAt || new Date().toISOString()
        ]
      );
    }
  });

  console.log("JSON data migrated to PostgreSQL.");
}

migrate()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
