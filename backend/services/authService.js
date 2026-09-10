// 비밀번호 해시와 서버 세션의 생성, 조회, 삭제를 담당하는 인증 도메인 서비스입니다.
import crypto from "crypto";
import { promisify } from "util";
import { query } from "../db/pool.js";

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password, encodedHash) {
  const [, salt, storedKey] = String(encodedHash || "").split("$");
  if (!salt || !storedKey) return false;
  const derivedKey = await scrypt(password, salt, KEY_LENGTH);
  const expectedKey = Buffer.from(storedKey, "hex");
  return expectedKey.length === derivedKey.length && crypto.timingSafeEqual(expectedKey, derivedKey);
}

export async function findUserByEmail(email) {
  const result = await query(
    "SELECT id, email, password_hash, created_at FROM users WHERE email = $1",
    [email.trim().toLowerCase()]
  );
  return result.rows[0] || null;
}

export async function createUser(email, passwordHash) {
  const result = await query(
    "INSERT INTO users (id, email, password_hash, created_at) VALUES ($1, $2, $3, $4) RETURNING id, email, created_at",
    [crypto.randomUUID(), email.trim().toLowerCase(), passwordHash, new Date().toISOString()]
  );
  return result.rows[0];
}

export async function updatePassword(userId, passwordHash) {
  const result = await query(
    "UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, email",
    [passwordHash, userId]
  );
  return result.rows[0] || null;
}

export async function createSession(userId, remember) {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const maxAgeSeconds = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
  const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000).toISOString();
  await query(
    "INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES ($1, $2, $3, $4, $5)",
    [crypto.randomUUID(), userId, tokenHash, expiresAt, new Date().toISOString()]
  );
  return { token, maxAgeSeconds };
}

export async function findSession(token) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const result = await query(
    `SELECT users.id, users.email
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = $1 AND sessions.expires_at > NOW()`,
    [tokenHash]
  );
  return result.rows[0] || null;
}

export async function deleteSession(token) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await query("DELETE FROM sessions WHERE token_hash = $1", [tokenHash]);
}
