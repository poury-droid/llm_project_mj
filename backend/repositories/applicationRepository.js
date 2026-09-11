import { query } from "../db/pool.js";

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

export async function findAllApplications(userId) {
  const result = await query("SELECT * FROM applications WHERE user_id = $1 ORDER BY created_at ASC", [userId]);
  return result.rows.map(toApplication);
}

export async function findApplicationById(userId, id) {
  const result = await query("SELECT * FROM applications WHERE user_id = $1 AND id = $2", [userId, id]);
  return toApplication(result.rows[0]);
}

export async function findDuplicateApplication(userId, application) {
  const result = await query(
    `SELECT * FROM applications
     WHERE user_id = $1
       AND lower(trim(company)) = lower(trim($2))
       AND lower(trim(position)) = lower(trim($3))
       AND lower(trim(title)) = lower(trim($4))
       AND deadline = $5
     ORDER BY created_at ASC
     LIMIT 1`,
    [userId, application.company || "", application.position || "", application.title || "", application.deadline || ""]
  );
  return toApplication(result.rows[0]);
}

export async function createApplication(userId, application) {
  const result = await query(
    `
      INSERT INTO applications (
        id, user_id, company, position, title, deadline, stage, pdf_file_name, memo,
        written_test_date, interview_date, reply_deadline, location,
        subjects, required_documents, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15::jsonb, $16, $17)
      RETURNING *
    `,
    [
      application.id,
      userId,
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

export async function updateApplication(userId, id, updates) {
  const entries = Object.entries(updates).filter(([key]) => columnByField[key]);
  if (entries.length === 0) return findApplicationById(userId, id);

  const sets = entries.map(([key], index) => {
    const column = columnByField[key];
    const cast = ["subjects", "requiredDocuments"].includes(key) ? "::jsonb" : "";
    return `${column} = $${index + 3}${cast}`;
  });
  const values = entries.map(([key, value]) =>
    ["subjects", "requiredDocuments"].includes(key) ? JSON.stringify(value || []) : value
  );

  const result = await query(
    `UPDATE applications SET ${sets.join(", ")} WHERE user_id = $1 AND id = $2 RETURNING *`,
    [userId, id, ...values]
  );
  return toApplication(result.rows[0]);
}

export async function deleteApplication(userId, id) {
  const result = await query("DELETE FROM applications WHERE user_id = $1 AND id = $2", [userId, id]);
  return result.rowCount > 0;
}
