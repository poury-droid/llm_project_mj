// applications 테이블의 SQL을 담당하며 DB snake_case를 API camelCase로 변환합니다.
import { query } from "../db/pool.js";

// PostgreSQL의 snake_case 컬럼을 API의 camelCase 형식으로 변환합니다.
function toApplication(row) {
  if (!row) return null;
  return {
    id: row.id,
    company: row.company,
    position: row.position,
    title: row.title,
    deadline: row.deadline,
    stage: row.stage,
    pdfFileName: row.pdf_file_name,
    memo: row.memo,
    writtenTestDate: row.written_test_date,
    interviewDate: row.interview_date,
    replyDeadline: row.reply_deadline,
    location: row.location,
    subjects: row.subjects || [],
    requiredDocuments: row.required_documents || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

const columnByField = {
  company: "company",
  position: "position",
  title: "title",
  deadline: "deadline",
  stage: "stage",
  pdfFileName: "pdf_file_name",
  memo: "memo",
  writtenTestDate: "written_test_date",
  interviewDate: "interview_date",
  replyDeadline: "reply_deadline",
  location: "location",
  subjects: "subjects",
  requiredDocuments: "required_documents",
  updatedAt: "updated_at"
};

export async function findAllApplications() {
  // Repository는 DB 접근만 담당하고, HTTP 응답 형식은 Controller가 담당합니다.
  const result = await query("SELECT * FROM applications ORDER BY created_at ASC");
  return result.rows.map(toApplication);
}

export async function findApplicationById(id) {
  const result = await query("SELECT * FROM applications WHERE id = $1", [id]);
  return toApplication(result.rows[0]);
}

export async function createApplication(application) {
  const result = await query(
    `
      INSERT INTO applications (
        id, company, position, title, deadline, stage, pdf_file_name, memo,
        written_test_date, interview_date, reply_deadline, location,
        subjects, required_documents, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14::jsonb, $15, $16)
      RETURNING *
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
      application.createdAt,
      application.updatedAt
    ]
  );
  return toApplication(result.rows[0]);
}

export async function updateApplication(id, updates) {
  // 허용된 필드만 SQL에 포함해 임의의 컬럼명이 쿼리에 들어가지 않도록 합니다.
  const entries = Object.entries(updates).filter(([key]) => columnByField[key]);
  if (entries.length === 0) return findApplicationById(id);

  const sets = entries.map(([key], index) => {
    const column = columnByField[key];
    const cast = ["subjects", "requiredDocuments"].includes(key) ? "::jsonb" : "";
    return `${column} = $${index + 2}${cast}`;
  });
  const values = entries.map(([key, value]) =>
    ["subjects", "requiredDocuments"].includes(key) ? JSON.stringify(value || []) : value
  );

  const result = await query(
    `UPDATE applications SET ${sets.join(", ")} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return toApplication(result.rows[0]);
}

export async function deleteApplication(id) {
  const result = await query("DELETE FROM applications WHERE id = $1", [id]);
  return result.rowCount > 0;
}
