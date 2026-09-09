import { query } from "../db/pool.js";

function toCredential(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    grade: row.grade,
    acquiredDate: row.acquired_date,
    expiresAt: row.expires_at,
    score: row.score,
    issuer: row.issuer,
    memo: row.memo,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

const columnByField = {
  name: "name",
  grade: "grade",
  acquiredDate: "acquired_date",
  expiresAt: "expires_at",
  score: "score",
  issuer: "issuer",
  memo: "memo",
  updatedAt: "updated_at"
};

export async function findAllCredentials() {
  const result = await query("SELECT * FROM user_credentials ORDER BY created_at DESC");
  return result.rows.map(toCredential);
}

export async function createCredential(credential) {
  const now = new Date().toISOString();
  const result = await query(
    `
      INSERT INTO user_credentials (id, name, grade, acquired_date, expires_at, score, issuer, memo, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `,
    [
      crypto.randomUUID(),
      credential.name || "",
      credential.grade || "",
      credential.acquiredDate || "",
      credential.expiresAt || "",
      credential.score || "",
      credential.issuer || "",
      credential.memo || "",
      now,
      now
    ]
  );
  return toCredential(result.rows[0]);
}

export async function updateCredential(id, updates) {
  const nextUpdates = { ...updates, updatedAt: new Date().toISOString() };
  const entries = Object.entries(nextUpdates).filter(([key]) => columnByField[key]);
  if (!entries.length) return null;
  const sets = entries.map(([key], index) => `${columnByField[key]} = $${index + 2}`);
  const result = await query(
    `UPDATE user_credentials SET ${sets.join(", ")} WHERE id = $1 RETURNING *`,
    [id, ...entries.map(([, value]) => value)]
  );
  return toCredential(result.rows[0]);
}

export async function deleteCredential(id) {
  await query("DELETE FROM user_credentials WHERE id = $1", [id]);
}
