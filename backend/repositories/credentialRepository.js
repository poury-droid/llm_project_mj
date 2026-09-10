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

export async function findAllCredentials(userId) {
  const result = await query("SELECT * FROM user_credentials WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
  return result.rows.map(toCredential);
}

export async function createCredential(userId, credential) {
  const now = new Date().toISOString();
  const result = await query(
    `
      INSERT INTO user_credentials (id, user_id, name, grade, acquired_date, expires_at, score, issuer, memo, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `,
    [
      crypto.randomUUID(),
      userId,
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

export async function updateCredential(userId, id, updates) {
  const nextUpdates = { ...updates, updatedAt: new Date().toISOString() };
  const entries = Object.entries(nextUpdates).filter(([key]) => columnByField[key]);
  if (!entries.length) return null;
  const sets = entries.map(([key], index) => `${columnByField[key]} = $${index + 3}`);
  const result = await query(
    `UPDATE user_credentials SET ${sets.join(", ")} WHERE user_id = $1 AND id = $2 RETURNING *`,
    [userId, id, ...entries.map(([, value]) => value)]
  );
  return toCredential(result.rows[0]);
}

export async function deleteCredential(userId, id) {
  const result = await query("DELETE FROM user_credentials WHERE user_id = $1 AND id = $2", [userId, id]);
  return result.rowCount > 0;
}
